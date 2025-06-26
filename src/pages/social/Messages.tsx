import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { chatService, Conversation, ChatMessage as ChatMessageType } from '../../lib/chatService';
import { friendshipService } from '../../lib/friendshipService';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import ConversationList from '../../components/social/ConversationList';
import ChatMessage from '../../components/social/ChatMessage';

const Messages: React.FC = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(userId || null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setError(null);

      try {
        const conversationsData = await chatService.getConversations(user.id);
        setConversations(conversationsData);
      } catch (err: any) {
        console.error('Error loading conversations:', err);
        setError(err.message || t('social.errorLoadingConversations'));
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        },
        (payload) => {
          console.log('Message change detected:', payload);
          loadConversations();
          if (activeConversation) {
            loadMessages(activeConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user, t]);

  const loadMessages = async (userId: string) => {
    if (!user) return;

    setIsLoadingMessages(true);
    setError(null);

    try {
      const messagesData = await chatService.getMessages(user.id, userId);
      setMessages(messagesData);

      // Mark conversation as read
      await chatService.markConversationAsRead(user.id, userId);

      // Update unread count in conversations
      setConversations(prev =>
        prev.map(conv =>
          conv.user_id === userId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || t('social.errorLoadingMessages'));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);

      // Load user info
      const loadUserInfo = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', activeConversation)
            .single();

          if (error) throw error;
          setActiveUser(data);
        } catch (err) {
          console.error('Error loading user info:', err);
        }
      };

      loadUserInfo();
    }
  }, [activeConversation, user, t]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      messageInputRef.current?.focus();
    }
  }, [activeConversation]);

  const handleSelectConversation = (userId: string) => {
    setActiveConversation(userId);
    navigate(`/social/messages/${userId}`);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !activeConversation || !newMessage.trim()) return;

    setIsSendingMessage(true);

    try {
      const message = await chatService.sendMessage(user.id, activeConversation, newMessage);

      // Add sender info to the message for display
      const messageWithSender = {
        ...message,
        sender: {
          full_name: user.full_name,
          avatar_url: user.avatar_url || '/images/default_user.jpg'
        }
      };

      setMessages(prev => [...prev, messageWithSender]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;

    setIsSearching(true);

    try {
      const results = await friendshipService.searchUsers(searchQuery, user.id);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = (userId: string) => {
    setActiveConversation(userId);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/social/messages/${userId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/social')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('social.messages')}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex h-[calc(80vh-100px)]">
          {/* Conversations sidebar */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search bar */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('social.searchUsers')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full p-2 pl-8 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                />
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search results or conversations list */}
            <div className="flex-grow overflow-y-auto">
              {searchQuery ? (
                <div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-1">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {t('social.searching')}
                      </div>
                    ) : (
                      searchResults.length > 0 ? t('social.searchResults') : t('social.noResults')
                    )}
                  </div>

                  {searchResults.map(result => (
                    <div
                      key={result.id}
                      onClick={() => handleStartConversation(result.id)}
                      className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img
                          src={result.avatar_url || '/images/default_user.jpg'}
                          alt={result.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {result.full_name}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isLoadingConversations ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onSelectConversation={handleSelectConversation}
                />
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="w-2/3 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat header */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={activeUser?.avatar_url || '/images/default_user.jpg'}
                      alt={activeUser?.full_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {activeUser?.full_name || 'User'}
                    </h3>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-gray-850">
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  ) : messages.length > 0 ? (
                    <div>
                      {messages.map(message => (
                        <ChatMessage key={message.id} message={message} />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {t('social.noMessages')}
                    </div>
                  )}
                </div>

                {/* Message input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex items-center">
                    <input
                      type="text"
                      placeholder={t('social.typeMessage')}
                      value={newMessage}
                      onChange={handleMessageChange}
                      className="flex-grow p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      disabled={isSendingMessage}
                      ref={messageInputRef}
                    />
                    <button
                      type="submit"
                      className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSendingMessage || !newMessage.trim()}
                    >
                      {isSendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">
                {t('social.selectConversation')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
