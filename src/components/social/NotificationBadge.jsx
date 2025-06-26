import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, UserPlus, X, Heart, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { supabase } from '../../lib/supabaseClient';
import { format, formatDistanceToNow } from 'date-fns';

const NotificationBadge = () => {
  const { user } = useAuth();
  const { socialService } = useFirebase();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setLoading(true);

      try {
        // Fetch unread messages count
        try {
          const { count: messageCount, error: messageError } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          if (!messageError) {
            setUnreadMessages(messageCount || 0);
          }
        } catch (messageError) {
          console.error('Error fetching unread messages count:', messageError);
        }

        // Fetch friend requests count
        try {
          const { count: requestCount, error: requestError } = await supabase
            .from('user_friendships')
            .select('id', { count: 'exact', head: true })
            .eq('friend_id', user.id)
            .eq('status', 'pending');

          if (!requestError) {
            setFriendRequests(requestCount || 0);
          }
        } catch (requestError) {
          console.error('Error fetching friend requests count:', requestError);
        }

        // Try Firebase first for notifications
        try {
          const firebaseNotifications = await socialService.getNotifications(user.id);
          if (firebaseNotifications) {
            setNotifications(firebaseNotifications);
            setUnreadCount(firebaseNotifications.filter(n => !n.read).length);
            setLoading(false);
            return;
          }
        } catch (firebaseError) {
          console.error('Error fetching Firebase notifications:', firebaseError);
        }

        // Try Supabase if Firebase fails
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data ? data.filter(n => !n.read).length : 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const setupNotificationSubscription = async () => {
      try {
        // Try Firebase first
        try {
          const unsubscribe = socialService.subscribeToNotifications(
            user.id,
            (newNotifications) => {
              setNotifications(newNotifications);
              setUnreadCount(newNotifications.filter(n => !n.read).length);
            }
          );

          return () => unsubscribe();
        } catch (firebaseError) {
          console.error('Error setting up Firebase notification subscription:', firebaseError);
        }

        // Try Supabase if Firebase fails
        const channel = supabase
          .channel('social_notifications')
          // Listen for notifications
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              setNotifications(prev => [payload.new, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new : n)
              );

              // Recalculate unread count
              setUnreadCount(prev =>
                payload.old.read === payload.new.read ? prev :
                payload.new.read ? prev - 1 : prev + 1
              );
            }
          )
          // Listen for new messages
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `recipient_id=eq.${user.id}`
            },
            (payload) => {
              if (!payload.new.is_read) {
                setUnreadMessages(prev => prev + 1);

                // Create a notification for the new message
                try {
                  supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', payload.new.sender_id)
                    .single()
                    .then(({ data }) => {
                      if (data) {
                        supabase
                          .from('notifications')
                          .insert({
                            user_id: user.id,
                            type: 'new_message',
                            title: 'New Message',
                            message: `${data.full_name || 'Someone'} sent you a message`,
                            link: `/social/messages/${payload.new.sender_id}`,
                            read: false
                          })
                          .then(({ error }) => {
                            if (error) console.error('Error creating message notification:', error);
                          });
                      }
                    });
                } catch (error) {
                  console.error('Error creating message notification:', error);
                }
              }
            }
          )
          // Listen for message status updates
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'chat_messages',
              filter: `recipient_id=eq.${user.id}`
            },
            (payload) => {
              if (payload.old.is_read === false && payload.new.is_read === true) {
                setUnreadMessages(prev => Math.max(prev - 1, 0));
              }
            }
          )
          // Listen for new friend requests
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'user_friendships',
              filter: `friend_id=eq.${user.id}`
            },
            (payload) => {
              if (payload.new.status === 'pending') {
                setFriendRequests(prev => prev + 1);

                // We don't create a separate notification for friend requests
                // as they will appear in the friend requests section
              }
            }
          )
          // Listen for friend request status updates
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_friendships',
              filter: `friend_id=eq.${user.id}`
            },
            (payload) => {
              if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
                setFriendRequests(prev => Math.max(prev - 1, 0));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
      }
    };

    const cleanup = setupNotificationSubscription();

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [user, socialService]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      // Try Firebase first
      try {
        await socialService.markAllNotificationsAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        return;
      } catch (firebaseError) {
        console.error('Error marking Firebase notifications as read:', firebaseError);
      }

      // Try Supabase if Firebase fails
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    if (!user) return;

    try {
      // Try Firebase first
      try {
        await socialService.markNotificationAsRead(notificationId);
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(prev - 1, 0));
        return;
      } catch (firebaseError) {
        console.error('Error marking Firebase notification as read:', firebaseError);
      }

      // Try Supabase if Firebase fails
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to the link if provided
    if (notification.link) {
      navigate(notification.link);
    }

    // Close dropdown
    setIsOpen(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();

      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }

      // If this week, show day and time
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return format(date, 'EEE h:mm a');
      }

      // Otherwise show date
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Bell className="w-6 h-6" />

        {(unreadCount > 0 || unreadMessages > 0 || friendRequests > 0) && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount + unreadMessages + friendRequests}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Messages section */}
                  {unreadMessages > 0 && (
                    <div
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer bg-blue-50 dark:bg-blue-900/20"
                      onClick={() => navigate('/social/messages')}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                          <MessageSquare className="w-5 h-5 text-blue-500" />
                        </div>

                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            New Messages
                          </div>
                          <div className="text-gray-600 dark:text-gray-300 text-sm">
                            You have {unreadMessages} unread message{unreadMessages !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Click to view
                          </div>
                        </div>

                        <div className="flex items-center justify-center min-w-[24px] h-6 bg-blue-500 text-white text-xs font-bold rounded-full px-1">
                          {unreadMessages}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Friend requests section */}
                  {friendRequests > 0 && (
                    <div
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer bg-green-50 dark:bg-green-900/20"
                      onClick={() => navigate('/social/friends')}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                          <UserPlus className="w-5 h-5 text-green-500" />
                        </div>

                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            Friend Requests
                          </div>
                          <div className="text-gray-600 dark:text-gray-300 text-sm">
                            You have {friendRequests} pending friend request{friendRequests !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                            Click to view
                          </div>
                        </div>

                        <div className="flex items-center justify-center min-w-[24px] h-6 bg-green-500 text-white text-xs font-bold rounded-full px-1">
                          {friendRequests}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regular notifications */}
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {notification.title}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(notification.created_at)}
                            </div>
                          </div>

                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : unreadMessages === 0 && friendRequests === 0 ? (
                    <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBadge;
