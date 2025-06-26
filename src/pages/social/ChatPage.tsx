import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Search, Loader2, AlertCircle, MessageCircle, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TimeAgo from 'react-timeago';
import { chatService } from '../../lib/chatService';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // Get all conversations where the user is either sender or recipient
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Error fetching conversations:', messagesError);
          return;
        }

        // Get unique conversation partners
        const conversationPartners = new Map<string, {
          last_message: string;
          last_message_time: string;
          unread_count: number;
        }>();

        messagesData?.forEach(message => {
          const partnerId = message.sender_id === user.id ? message.recipient_id : message.sender_id;

          if (!conversationPartners.has(partnerId)) {
            conversationPartners.set(partnerId, {
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: message.is_read === false && message.recipient_id === user.id ? 1 : 0
            });
          } else if (message.is_read === false && message.recipient_id === user.id) {
            const current = conversationPartners.get(partnerId);
            if (current) {
              conversationPartners.set(partnerId, {
                ...current,
                unread_count: current.unread_count + 1
              });
            }
          }
        });

        // Get user details for each conversation partner
        const conversationList: Conversation[] = [];

        for (const [partnerId, messageInfo] of conversationPartners.entries()) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', partnerId)
            .single();

          if (userError) {
            console.error(`Error fetching user ${partnerId}:`, userError);
            continue;
          }

          if (userData) {
            conversationList.push({
              user_id: userData.id,
              full_name: userData.full_name || 'Unknown User',
              avatar_url: userData.avatar_url,
              last_message: messageInfo.last_message,
              last_message_time: messageInfo.last_message_time,
              unread_count: messageInfo.unread_count
            });
          }
        }

        // Sort by last message time
        conversationList.sort((a, b) =>
          new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
        );

        setConversations(conversationList);

        // If there are conversations, set the first one as active
        if (conversationList.length > 0 && !activeConversation) {
          setActiveConversation(conversationList[0]);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();

    // Set up real-time subscription for new messages
    const messagesSubscription = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `recipient_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          // Reload conversations when a new message is received
          loadConversations();

          // If the message is for the active conversation, add it to the messages
          if (activeConversation &&
              (payload.new.sender_id === activeConversation.user_id ||
               payload.new.recipient_id === activeConversation.user_id)) {
            loadMessages(activeConversation.user_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.user_id);
      checkFriendshipStatus(activeConversation.user_id);
    }
  }, [activeConversation]);

  // Check friendship status
  const checkFriendshipStatus = async (partnerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_friendships')
        .select('status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${partnerId}),and(user_id.eq.${partnerId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (error) {
        console.error('Error checking friendship status:', error);
        return;
      }

      setFriendshipStatus(data?.status || null);
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (partnerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      // Update unread count in conversations
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.user_id === partnerId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      // Use the chatService to send the message with friend request checks
      const result = await chatService.sendMessage(user.id, activeConversation.user_id, newMessage.trim());

      if (result) {
        // Add the new message to the messages list
        setMessages(prevMessages => [...prevMessages, result]);

        // Update the conversation with the new last message
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.user_id === activeConversation.user_id
              ? {
                  ...conv,
                  last_message: newMessage.trim(),
                  last_message_time: new Date().toISOString()
                }
              : conv
          )
        );

        // Clear the input
        setNewMessage('');

        // Check if this was the first message (friend request)
        if (friendshipStatus === null) {
          setFriendshipStatus('pending');
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setErrorMessage(error.message || 'Failed to send message');
      // Hide error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !activeConversation) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('user_friendships')
        .insert({
          user_id: user.id,
          friend_id: activeConversation.user_id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending friend request:', error);
        setErrorMessage('Failed to send friend request');
        return;
      }

      // We don't create a separate notification for friend requests
      // as they will appear in the friend requests section

      setFriendshipStatus('pending');
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      setErrorMessage(error.message || 'Failed to send friend request');
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-6 h-[calc(100vh-64px)]"
    >
      <div className="flex h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('social.messages')}
            </h1>
            <div className="relative">
              <input
                type="text"
                placeholder={t('social.searchUsers')}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredConversations.length > 0 ? (
              <AnimatePresence>
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 ${
                      activeConversation?.user_id === conversation.user_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <img
                            src={conversation.avatar_url || 'https://via.placeholder.com/40'}
                            alt={conversation.full_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {conversation.full_name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <TimeAgo date={conversation.last_message_time} />
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {conversation.last_message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('social.noConversations')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('social.selectConversation')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    className="md:hidden mr-2 text-gray-500 dark:text-gray-400"
                    onClick={() => setActiveConversation(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={activeConversation.avatar_url || 'https://via.placeholder.com/40'}
                      alt={activeConversation.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {activeConversation.full_name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_id === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <p>{message.content}</p>
                        <div
                          className={`text-xs mt-1 ${
                            message.sender_id === user?.id
                              ? 'text-blue-200'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          <TimeAgo date={message.created_at} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t('social.noMessages')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('social.startConversation')}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mx-4 mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg flex items-center"
                  >
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Friend request banner */}
              {friendshipStatus === 'pending' && (
                <div className="mx-4 mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="flex-1">
                      {t('social.pendingFriendRequest')}
                    </span>
                  </div>
                  <p className="text-xs mt-1">
                    {t('social.messageLimit')}
                  </p>
                </div>
              )}

              {/* Message input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder={friendshipStatus === null ? t('social.sendFirstMessage') : t('social.typeMessage')}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-l-lg focus:outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none disabled:opacity-50"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {friendshipStatus === null && messages.length === 0 && (
                  <div className="mt-3 text-center">
                    <button
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none disabled:opacity-50 inline-flex items-center"
                      onClick={handleSendFriendRequest}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5 mr-2" />
                      )}
                      {t('social.sendFriendRequest')}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {t('social.orSendMessage')}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-12 h-12 text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {t('social.selectConversation')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {t('social.selectConversationDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPage;
