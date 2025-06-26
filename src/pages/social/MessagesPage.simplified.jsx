import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, ArrowLeft, Send, Loader2,
  AlertTriangle, MoreVertical, Phone, Video, Info,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import UserSearch from '../../components/social/UserSearch';
import ChatMessage from '../../components/social/ChatMessage';

const MessagesPage = () => {
  const { userId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Simple direct query to get messages
        const { data: allMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (messagesError) {
          console.error('Error loading messages:', messagesError);
          setError(t('social.errorLoadingConversations'));
          setLoading(false);
          return;
        }
        
        if (!allMessages || allMessages.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Get profiles for senders and recipients
        const userIds = new Set();
        allMessages.forEach(msg => {
          userIds.add(msg.sender_id);
          userIds.add(msg.recipient_id);
        });
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(userIds));
        
        if (profilesError) {
          console.error('Error loading profiles:', profilesError);
          setError(t('social.errorLoadingConversations'));
          setLoading(false);
          return;
        }

        // Group messages by conversation
        const conversationMap = {};
        
        allMessages.forEach(message => {
          const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
          const otherUserProfile = profiles.find(p => p.id === otherUserId);
          
          if (otherUserProfile && !conversationMap[otherUserId]) {
            conversationMap[otherUserId] = {
              user_id: otherUserId,
              full_name: otherUserProfile.full_name || 'User',
              avatar_url: otherUserProfile.avatar_url,
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: message.recipient_id === user.id && !message.is_read ? 1 : 0
            };
          }
        });
        
        const conversationList = Object.values(conversationMap);
        setConversations(conversationList);
        
        // If userId is provided, set active conversation
        if (userId) {
          const conversation = conversationList.find(c => c.user_id === userId);
          if (conversation) {
            setActiveConversation(conversation);
          } else {
            // If conversation doesn't exist, fetch user profile to create a new one
            const { data: userProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', userId)
              .single();
            
            if (!profileError && userProfile) {
              const newConversation = {
                user_id: userProfile.id,
                full_name: userProfile.full_name || 'User',
                avatar_url: userProfile.avatar_url,
                last_message: '',
                last_message_time: new Date().toISOString(),
                unread_count: 0
              };
              setActiveConversation(newConversation);
            }
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        setError(t('social.errorLoadingConversations'));
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          // Only update if the message is relevant to the current user
          if (payload.new.sender_id === user.id || payload.new.recipient_id === user.id) {
            // Update conversations
            loadConversations();
            
            // If active conversation is set, update messages
            if (activeConversation) {
              const conversationId = activeConversation.user_id;
              if (payload.new.sender_id === conversationId || payload.new.recipient_id === conversationId) {
                loadMessages(conversationId);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userId, t]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      const conversationId = activeConversation.user_id;
      if (conversationId) {
        loadMessages(conversationId);
        
        // Update URL if needed
        if (userId !== conversationId) {
          navigate(`/social/messages/${conversationId}`, { replace: true });
        }
        
        // Focus message input
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      }
    }
  }, [activeConversation, userId, navigate]);

  // Load messages for a conversation
  const loadMessages = async (otherUserId) => {
    if (!user || !otherUserId) return;

    try {
      // Simple direct query to get messages between users
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading messages:', error);
        setError(t('social.errorLoadingMessages'));
        return;
      }

      // Get profiles for messages
      const userIds = new Set();
      data.forEach(msg => {
        userIds.add(msg.sender_id);
        userIds.add(msg.recipient_id);
      });
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(userIds));
      
      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setError(t('social.errorLoadingMessages'));
        return;
      }

      // Enhance messages with profile data
      const enhancedMessages = data.map(message => {
        const senderProfile = profiles.find(p => p.id === message.sender_id);
        const recipientProfile = profiles.find(p => p.id === message.recipient_id);
        
        return {
          ...message,
          sender: senderProfile ? {
            id: senderProfile.id,
            full_name: senderProfile.full_name || 'User',
            avatar_url: senderProfile.avatar_url
          } : null,
          recipient: recipientProfile ? {
            id: recipientProfile.id,
            full_name: recipientProfile.full_name || 'User',
            avatar_url: recipientProfile.avatar_url
          } : null
        };
      });
      
      setMessages(enhancedMessages);
      scrollToBottom();
      
      // Mark messages as read
      markMessagesAsRead(data, otherUserId);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(t('social.errorLoadingMessages'));
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messages, otherUserId) => {
    if (!messages || !messages.length) return;
    
    try {
      const unreadMessages = messages.filter(m => 
        m.recipient_id === user.id && 
        m.sender_id === otherUserId && 
        !m.is_read
      );
      
      if (unreadMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id));
        
        if (updateError) {
          console.error('Error marking messages as read:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!user || !activeConversation || !messageText.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          recipient_id: activeConversation.user_id,
          content: messageText.trim(),
          is_read: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error sending message:', error);
        setError(t('social.errorSendingMessage'));
        return;
      }
      
      // Add message to the list
      const newMessage = {
        ...data,
        sender: {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url
        },
        recipient: {
          id: activeConversation.user_id,
          full_name: activeConversation.full_name,
          avatar_url: activeConversation.avatar_url
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Clear input
      setMessageText('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(t('social.errorSendingMessage'));
    } finally {
      setSendingMessage(false);
    }
  };

  // Format date for conversation list
  const formatConversationDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }
      
      // If this week, show day
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return format(date, 'EEE');
      }
      
      // Otherwise show date
      return format(date, 'MM/dd/yy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Handle user selection from search
  const handleUserSelect = async (selectedUser) => {
    setShowSearch(false);
    
    // Check if conversation already exists
    const existingConversation = conversations.find(c => c.user_id === selectedUser.id);
    if (existingConversation) {
      setActiveConversation(existingConversation);
      return;
    }
    
    // Create new conversation
    const newConversation = {
      user_id: selectedUser.id,
      full_name: selectedUser.full_name || selectedUser.email?.split('@')[0] || 'User',
      avatar_url: selectedUser.avatar_url,
      last_message: '',
      last_message_time: new Date().toISOString(),
      unread_count: 0
    };
    
    setActiveConversation(newConversation);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {t('social.messages')}
            </h2>
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={t('social.newMessage')}
            >
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('social.noConversations')}
              </p>
              <button
                onClick={() => setShowSearch(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {t('social.startNewConversation')}
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.user_id}
                  className={`p-3 flex items-center cursor-pointer ${
                    activeConversation?.user_id === conversation.user_id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={conversation.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.full_name)}&background=random`}
                        alt={conversation.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.full_name)}&background=random`;
                        }}
                      />
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.full_name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {formatConversationDate(conversation.last_message_time)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conversation.last_message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                  aria-label={t('common.back')}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ml-2">
                  <img
                    src={activeConversation.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.full_name)}&background=random`}
                    alt={activeConversation.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.full_name)}&background=random`;
                    }}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-200">
                    {activeConversation.full_name}
                  </h2>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={t('social.call')}
                  >
                    <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={t('social.videoCall')}
                  >
                    <Video className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={t('social.info')}
                  >
                    <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      {t('social.noMessagesYet')}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {t('social.startConversation')}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isCurrentUser={message.sender_id === user.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={t('social.typeMessage')}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                    ref={messageInputRef}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    className={`ml-2 p-2 rounded-full ${
                      !messageText.trim() || sendingMessage
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    aria-label={t('social.send')}
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {t('social.selectConversation')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {t('social.selectConversationDescription')}
              </p>
              <button
                onClick={() => setShowSearch(true)}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {t('social.newMessage')}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* User search modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  {t('social.newMessage')}
                </h3>
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-4">
                <UserSearch onSelect={handleUserSelect} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;
