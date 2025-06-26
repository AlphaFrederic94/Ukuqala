import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { channelService, ChatGroup, ChatGroupMessage, ChatGroupMember } from '../../lib/channelService';
import { supabase } from '../../lib/supabaseClient';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import {
  Users,
  ArrowLeft,
  Send,
  Smile,
  Image,
  Paperclip,
  Info,
  Loader2,
  Dumbbell,
  Utensils,
  Heart,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const ChannelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [channel, setChannel] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatGroupMessage[]>([]);
  const [members, setMembers] = useState<ChatGroupMember[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchChannelData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching channel data for ID:', id);

        // Fetch channel details
        const channelData = await channelService.getChannelById(id);
        if (!channelData) {
          console.error('Channel not found');
          navigate('/social');
          return;
        }

        console.log('Channel data:', channelData);
        setChannel(channelData);

        // Fetch channel members
        const membersData = await channelService.getChannelMembers(id);
        console.log('Channel members:', membersData);
        setMembers(membersData);

        // Check if user is a member
        const userIsMember = membersData.some(member => member.user_id === user.id);
        console.log('User is member:', userIsMember);
        setIsMember(userIsMember);

        // Fetch messages
        const messagesData = await channelService.getChannelMessages(id);
        console.log('Channel messages:', messagesData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching channel data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('channel_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_group_messages',
          filter: `group_id=eq.${id}`
        },
        async (payload) => {
          console.log('New channel message:', payload);

          // Fetch user data for the message
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            user: userData
          };

          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    // Set up real-time subscription for members
    const membersSubscription = supabase
      .channel('channel_members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_group_members',
          filter: `group_id=eq.${id}`
        },
        async () => {
          // Refresh members list
          const membersData = await channelService.getChannelMembers(id);
          setMembers(membersData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(membersSubscription);
    };
  }, [id, user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'fitness':
        return <Dumbbell className="w-6 h-6 text-blue-500" />;
      case 'food':
        return <Utensils className="w-6 h-6 text-green-500" />;
      case 'anatomy':
        return <Heart className="w-6 h-6 text-red-500" />;
      default:
        return <Info className="w-6 h-6 text-gray-500" />;
    }
  };

  const handleJoinChannel = async () => {
    if (!user || !id || isJoining) return;

    setIsJoining(true);
    setErrorMessage(null);

    try {
      console.log('Joining channel:', id);
      const { isNewMember } = await channelService.joinChannel(id, user.id);
      console.log('Joined channel, new member:', isNewMember);

      setIsMember(true);

      // Show success message if this is a new membership
      if (isNewMember) {
        setJoinSuccess(true);
        // Hide success message after 5 seconds
        setTimeout(() => setJoinSuccess(false), 5000);

        // Send a welcome message from the user using the channelService
        await channelService.sendMessage(id, user.id, '👋 Hello everyone! I just joined the channel.');
      }

      // Refresh data
      const messagesData = await channelService.getChannelMessages(id);
      setMessages(messagesData);

      const membersData = await channelService.getChannelMembers(id);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error joining channel:', error);
      setErrorMessage(error.message || 'Failed to join channel. Please try again.');
      // Hide error message after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !id || !messageText.trim() || !isMember || isSending) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      console.log('Sending message to channel:', id, 'from user:', user.id);

      // Use the channelService to send the message
      await channelService.sendMessage(id, user.id, messageText.trim());
      
      console.log('Message sent successfully');
      setMessageText('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setErrorMessage(error.message || 'Failed to send message. Please try again.');
      // Hide error message after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSticker = async (sticker: string) => {
    if (!user || !id || !isMember || isSending) return;

    setIsSending(true);
    setShowStickers(false);
    setErrorMessage(null);

    try {
      console.log('Sending sticker to channel:', id, 'from user:', user.id);

      // Use the channelService to send the sticker
      await channelService.sendMessage(id, user.id, sticker, true);
      
      console.log('Sticker sent successfully');
    } catch (error: any) {
      console.error('Error sending sticker:', error);
      setErrorMessage(error.message || 'Failed to send sticker. Please try again.');
      // Hide error message after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  // Stickers
  const stickers = [
    "👋",
    "❤️",
    "👍",
    "🎉",
    "😊",
    "💪",
    "🥗",
    "🏃‍♂️",
    "🧘‍♀️",
    "🍎",
    "🥦",
    "🥑"
  ];

  if (isLoading) {
    return (
      <NewSocialLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </NewSocialLayout>
    );
  }

  if (!channel) {
    return (
      <NewSocialLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('social.channelNotFound')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('social.channelNotFoundDescription')}
          </p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => navigate('/social')}
          >
            {t('common.goBack')}
          </button>
        </div>
      </NewSocialLayout>
    );
  }

  return (
    <NewSocialLayout>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Channel header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => navigate('/social')}
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="flex items-center">
              {getChannelIcon(channel.type)}
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {channel.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {members.length} {t('social.members')}
                </p>
              </div>
            </div>
          </div>
          <button
            className={`p-2 rounded-full ${showMembers ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
            onClick={() => setShowMembers(!showMembers)}
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 text-center"
            >
              <div className="flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{errorMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-[calc(100vh-16rem)]">
          {/* Messages area */}
          <div className="flex-1 flex flex-col">
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 relative">
              {/* Success message */}
              <AnimatePresence>
                {joinSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg shadow-md flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>You've successfully joined this channel!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    {getChannelIcon(channel.type)}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('social.noMessagesYet')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    {t('social.beFirstToMessage')}
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.user_id !== user?.id && (
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                          <img
                            src={message.user?.avatar_url || 'https://via.placeholder.com/40'}
                            alt={message.user?.full_name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`max-w-[70%] ${message.user_id === user?.id ? 'text-right' : 'text-left'}`}>
                        {message.user_id !== user?.id && (
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {message.user?.full_name || 'User'}
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            message.is_sticker
                              ? 'bg-transparent text-xl'
                              : message.user_id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(new Date(message.created_at), 'h:mm a')}
                        </div>
                      </div>
                      {message.user_id === user?.id && (
                        <div className="w-8 h-8 rounded-full overflow-hidden ml-2 flex-shrink-0">
                          <img
                            src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40'}
                            alt={user?.user_metadata?.full_name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input or Join button */}
            {isMember ? (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-2 pr-24 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-white"
                    placeholder={t('social.typeMessage')}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowStickers(!showStickers)}
                    >
                      <Smile className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => {/* Handle image upload */}}
                    >
                      <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => {/* Handle file attachment */}}
                    >
                      <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Stickers panel */}
                <AnimatePresence>
                  {showStickers && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {stickers.map((sticker, index) => (
                          <button
                            key={index}
                            className="p-2 text-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-2xl"
                            onClick={() => handleSendSticker(sticker)}
                          >
                            {sticker}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-center">
                <div className="text-center max-w-md">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You can see messages, but you need to join this channel to participate in the conversation.
                  </p>
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-md hover:shadow-lg transition-all duration-300 mx-auto"
                    onClick={handleJoinChannel}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Users className="w-5 h-5 mr-2" />
                    )}
                    {t('social.joinChannel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Members sidebar */}
          <AnimatePresence>
            {showMembers && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('social.members')} ({members.length})
                  </h3>
                </div>
                <div className="overflow-y-auto h-full p-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        <img
                          src={member.user?.avatar_url || 'https://via.placeholder.com/40'}
                          alt={member.user?.full_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.user?.full_name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('social.joinedOn')} {format(new Date(member.joined_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </NewSocialLayout>
  );
};

export default ChannelPage;
