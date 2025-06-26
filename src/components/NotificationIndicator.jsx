import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const NotificationIndicator = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);

        // Get unread messages count
        const { count: messageCount, error: messageError } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);

        if (messageError) {
          console.error('Error fetching unread messages count:', messageError);
        } else {
          setUnreadMessages(messageCount || 0);
        }

        // Get friend requests count
        const { count: requestCount, error: requestError } = await supabase
          .from('user_friendships')
          .select('id', { count: 'exact', head: true })
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (requestError) {
          console.error('Error fetching friend requests count:', requestError);
        } else {
          setFriendRequests(requestCount || 0);
        }

        // Get recent notifications
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notifError) {
          console.error('Error fetching notifications:', notifError);
        } else {
          setNotifications(notifData || []);
        }
      } catch (error) {
        console.error('Error in fetchNotifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscriptions
    const messagesSubscription = supabase
      .channel('public:chat_messages')
      .on('INSERT', payload => {
        if (payload.new && payload.new.recipient_id === user.id && !payload.new.is_read) {
          setUnreadMessages(prev => prev + 1);
        }
      })
      .subscribe();

    // Only update the counter for friend requests, don't create pop-up notifications
    const friendshipsSubscription = supabase
      .channel('public:user_friendships')
      .on('INSERT', payload => {
        if (payload.new && payload.new.friend_id === user.id && payload.new.status === 'pending') {
          // Just update the counter, don't create a notification
          setFriendRequests(prev => prev + 1);
        }
      })
      .on('UPDATE', payload => {
        if (payload.new && payload.new.friend_id === user.id && payload.old.status === 'pending') {
          setFriendRequests(prev => Math.max(prev - 1, 0));
        }
      })
      .subscribe();

    const notificationsSubscription = supabase
      .channel('public:notifications')
      .on('INSERT', payload => {
        if (payload.new && payload.new.user_id === user.id && !payload.new.read) {
          setNotifications(prev => [payload.new, ...prev.slice(0, 4)]);
        }
      })
      .on('UPDATE', payload => {
        if (payload.new && payload.new.user_id === user.id && payload.new.read) {
          setNotifications(prev => prev.filter(n => n.id !== payload.new.id));
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      friendshipsSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [user, t]);

  const handleNotificationClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMessageClick = () => {
    navigate('/social/messages');
    setUnreadMessages(0);
  };

  const handleFriendRequestsClick = () => {
    navigate('/social/friends');
    setFriendRequests(0);
  };

  const handleNotificationItemClick = async (notification) => {
    // Mark notification as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id);

    // Navigate to the link
    if (notification.link) {
      navigate(notification.link);
    }

    setShowDropdown(false);
  };

  const totalNotifications = unreadMessages + friendRequests + notifications.length;

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        onClick={handleNotificationClick}
        aria-label={t('notifications.title')}
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        {totalNotifications > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t('notifications.title')}
            </h3>
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {t('common.loading')}...
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {unreadMessages > 0 && (
                <div
                  className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={handleMessageClick}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-300" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {t('notifications.unreadMessages', { count: unreadMessages })}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('notifications.tapToViewMessages')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {friendRequests > 0 && (
                <div
                  className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={handleFriendRequestsClick}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-green-500 dark:text-green-300" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {t('notifications.friendRequests', { count: friendRequests })}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('notifications.tapToViewRequests')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleNotificationItemClick(notification)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-purple-500 dark:text-purple-300" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {totalNotifications === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {t('notifications.noNotifications')}
                </div>
              )}
            </div>
          )}

          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button
              className="w-full py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              onClick={() => navigate('/notifications')}
            >
              {t('notifications.viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIndicator;
