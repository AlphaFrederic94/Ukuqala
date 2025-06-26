import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { MessageSquare } from 'lucide-react';

const MessageNotifications = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadMessages = async () => {
      try {
        setLoading(true);
        
        // Get unread messages from Supabase
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            sender_id,
            content,
            created_at,
            profiles:sender_id (
              full_name,
              avatar_url
            )
          `)
          .eq('recipient_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error('Error fetching unread messages:', error);
          return;
        }
        
        setUnreadMessages(messages || []);
      } catch (error) {
        console.error('Error in fetchUnreadMessages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('public:chat_messages')
      .on('INSERT', payload => {
        // Check if the new message is for the current user and is unread
        if (payload.new && 
            payload.new.recipient_id === user.id && 
            !payload.new.is_read) {
          
          // Fetch sender profile
          supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                const newMessage = {
                  ...payload.new,
                  profiles: profile
                };
                
                setUnreadMessages(prev => [newMessage, ...prev.slice(0, 4)]);
              }
            });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleMessageClick = (senderId) => {
    navigate(`/social/messages/${senderId}`);
  };

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('social.messages')}
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (unreadMessages.length === 0) {
    return null; // Don't show the component if there are no unread messages
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('social.unreadMessages')}
        </h3>
        <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
          {unreadMessages.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {unreadMessages.map(message => (
          <div 
            key={message.id}
            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            onClick={() => handleMessageClick(message.sender_id)}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img
                  src={message.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.profiles?.full_name || 'User')}&background=random`}
                  alt={message.profiles?.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            </div>
            
            <div className="ml-3 flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {message.profiles?.full_name || 'User'}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {message.content || (message.file_url ? t('social.sentAttachment') : '')}
              </p>
            </div>
          </div>
        ))}
        
        <button
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors"
          onClick={() => navigate('/social/messages')}
        >
          <div className="flex items-center justify-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            {t('social.viewAllMessages')}
          </div>
        </button>
      </div>
    </div>
  );
};

export default MessageNotifications;
