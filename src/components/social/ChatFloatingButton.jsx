import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const ChatFloatingButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserList, setShowUserList] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);

        if (!error) {
          setUnreadCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    const fetchPendingFriendRequests = async () => {
      try {
        // Try using the RPC function first
        try {
          const { data, error } = await supabase.rpc('get_pending_friend_requests');

          if (error) throw error;

          setPendingFriendRequests(data?.length || 0);
        } catch (rpcError) {
          console.error('RPC method failed:', rpcError);

          // Fallback to direct query
          const { count, error } = await supabase
            .from('user_friendships')
            .select('id', { count: 'exact', head: true })
            .eq('friend_id', user.id)
            .eq('status', 'pending');

          if (!error) {
            setPendingFriendRequests(count || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching pending friend requests:', error);
      }
    };

    fetchUnreadCount();
    fetchPendingFriendRequests();

    // Set up real-time subscription for new messages
    const chatSubscription = supabase
      .channel('chat_messages_changes')
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
            setUnreadCount(prev => prev + 1);
          }
        }
      )
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
            setUnreadCount(prev => Math.max(prev - 1, 0));
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for friend requests
    const friendsSubscription = supabase
      .channel('user_friendships_changes')
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
            setPendingFriendRequests(prev => prev + 1);
            // No sound notification for friend requests
          }
        }
      )
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
            setPendingFriendRequests(prev => Math.max(prev - 1, 0));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
      supabase.removeChannel(friendsSubscription);
    };
  }, [user]);

  const fetchRecentChats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Skip the RPC function call since it's not available
      // Go directly to the fallback method
      throw new Error("Using fallback method for recent chats");
    } catch (error) {
      console.error('Error fetching recent chats:', error);

      // Fallback method if the RPC function fails
      try {
        // Get all messages involving this user
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;

        // Extract unique conversations
        const uniqueUsers = new Map();

        messages.forEach(message => {
          const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;

          if (!uniqueUsers.has(otherUserId)) {
            uniqueUsers.set(otherUserId, {
              id: otherUserId,
              full_name: null,
              avatar_url: null,
              last_message: message.content,
              last_message_time: message.created_at,
              unread: message.recipient_id === user.id && !message.is_read
            });
          }
        });

        // Fetch all profiles for these users
        const userIds = Array.from(uniqueUsers.keys());

        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          if (profilesError) throw profilesError;

          profiles.forEach(profile => {
            const user = uniqueUsers.get(profile.id);
            if (user) {
              user.full_name = profile.full_name || 'User';
              user.avatar_url = profile.avatar_url;
            }
          });
        }

        setRecentChats(Array.from(uniqueUsers.values()));
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (showUserList) {
      setShowUserList(false);
    } else {
      fetchRecentChats();
      setShowUserList(true);
    }
  };

  const handleChatClick = (userId) => {
    navigate(`/social/messages/${userId}`);
    setShowUserList(false);
  };

  const handleAllChatsClick = () => {
    navigate('/social/messages');
    setShowUserList(false);
  };

  const handleFriendsClick = () => {
    navigate('/social/friends');
    setShowUserList(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* User list popup */}
      <AnimatePresence>
        {showUserList && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-2"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-white">Recent Chats</h3>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : recentChats.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentChats.map(chat => (
                    <div
                      key={chat.id}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        chat.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleChatClick(chat.id)}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <img
                              src={chat.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.full_name)}&background=random`}
                              alt={chat.full_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {chat.unread && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                          )}
                        </div>

                        <div className="ml-3 flex-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {chat.full_name}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {chat.last_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No recent conversations
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex">
              <button
                className="flex-1 py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                onClick={handleAllChatsClick}
              >
                View All Messages
              </button>
              <button
                className="flex-1 py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border-l border-gray-200 dark:border-gray-700"
                onClick={handleFriendsClick}
              >
                View Friends
                {pendingFriendRequests > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {pendingFriendRequests}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating buttons */}
      <div className="flex space-x-3">
        {/* Friends button */}
        <button
          onClick={handleFriendsClick}
          className="relative bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg transition-colors"
        >
          <Users className="w-6 h-6" />
          {pendingFriendRequests > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingFriendRequests > 9 ? '9+' : pendingFriendRequests}
            </span>
          )}
        </button>

        {/* Chat button */}
        <button
          onClick={handleButtonClick}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatFloatingButton;
