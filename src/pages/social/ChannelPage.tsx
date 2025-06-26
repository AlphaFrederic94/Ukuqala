import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import firebaseSocialService from '../../lib/firebaseSocialService';
import firebase from '../../firebase-compat';
import { useToast } from '../../components/ui/Toast';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import FirebaseChannelChat from '../../components/social/FirebaseChannelChat';
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

interface Channel {
  id: string;
  name: string;
  description: string;
  type: string;
  createdAt: any;
  memberCount: number;
}

interface Member {
  id: string;
  userId: string;
  userName?: string;
  userPhotoURL?: string;
  joinedAt: any;
}

interface Message {
  id: string;
  userId: string;
  userName?: string;
  userPhotoURL?: string;
  content: string;
  createdAt: any;
  isSystem?: boolean;
}

const ChannelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [channelPolicies, setChannelPolicies] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchChannelData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching channel data for ID:', id);

        // Initialize Firebase collections
        await firebaseSocialService.initializeFirebaseCollections();
        await firebaseSocialService.initializeDefaultChatGroups();
        await firebaseSocialService.initializeChannelPolicies();

        // Fetch channel details from Firebase
        const db = firebase.firestore();
        const channelDoc = await db.collection('chat_groups').doc(id).get();

        if (!channelDoc.exists) {
          console.error('Channel not found');
          navigate('/social');
          return;
        }

        const channelData = channelDoc.data();
        const processedChannel = {
          id: channelDoc.id,
          name: channelData?.name || 'Unknown Channel',
          description: channelData?.description || '',
          type: channelData?.type || 'general',
          createdAt: channelData?.createdAt,
          memberCount: channelData?.memberCount || 0
        };

        console.log('Channel data:', processedChannel);
        setChannel(processedChannel);

        // Fetch channel policies
        const policies = await firebaseSocialService.getChannelPolicies(processedChannel.type);
        setChannelPolicies(policies);

        // Check if user is subscribed to this channel
        const isSubscribed = await firebaseSocialService.isUserSubscribedToChannel(user.id, id);
        setIsMember(isSubscribed);

        // Fetch channel members
        const membersSnapshot = await db.collection('channel_subscriptions')
          .where('channelId', '==', id)
          .get();

        const membersData = [];
        for (const doc of membersSnapshot.docs) {
          const memberData = doc.data();
          // Get user details
          const userProfile = await firebaseSocialService.getUserById(memberData.userId);

          membersData.push({
            id: doc.id,
            userId: memberData.userId,
            userName: userProfile?.displayName || `User ${memberData.userId.substring(0, 4)}`,
            userPhotoURL: userProfile?.photoURL || null,
            joinedAt: memberData.subscribedAt
          });
        }

        console.log('Channel members:', membersData);
        setMembers(membersData);

        // Fetch messages
        const messagesSnapshot = await db.collection('chat_group_messages')
          .where('groupId', '==', id)
          .orderBy('createdAt', 'asc')
          .get();

        const messagesData = [];
        for (const doc of messagesSnapshot.docs) {
          const messageData = doc.data();

          // Get user details for non-system messages
          let userName = '';
          let userPhotoURL = null;

          if (messageData.userId !== 'system') {
            const userProfile = await firebaseSocialService.getUserById(messageData.userId);
            userName = userProfile?.displayName || `User ${messageData.userId.substring(0, 4)}`;
            userPhotoURL = userProfile?.photoURL || null;
          }

          messagesData.push({
            id: doc.id,
            userId: messageData.userId,
            userName,
            userPhotoURL,
            content: messageData.content,
            createdAt: messageData.createdAt,
            isSystem: messageData.userId === 'system'
          });
        }

        console.log('Channel messages:', messagesData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching channel data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load channel data',
          status: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();

    // Set up real-time listener for messages
    const unsubscribe = firebase.firestore().collection('chat_group_messages')
      .where('groupId', '==', id)
      .orderBy('createdAt', 'asc')
      .onSnapshot(async (snapshot) => {
        const changes = snapshot.docChanges();

        for (const change of changes) {
          if (change.type === 'added') {
            const messageData = change.doc.data();
            const existingMessage = messages.find(m => m.id === change.doc.id);

            if (!existingMessage) {
              // Get user details for non-system messages
              let userName = '';
              let userPhotoURL = null;

              if (messageData.userId !== 'system') {
                const userProfile = await firebaseSocialService.getUserById(messageData.userId);
                userName = userProfile?.displayName || `User ${messageData.userId.substring(0, 4)}`;
                userPhotoURL = userProfile?.photoURL || null;
              }

              const newMessage = {
                id: change.doc.id,
                userId: messageData.userId,
                userName,
                userPhotoURL,
                content: messageData.content,
                createdAt: messageData.createdAt,
                isSystem: messageData.userId === 'system'
              };

              setMessages(prev => [...prev, newMessage]);

              // Play sound for new messages
              if (audioRef.current && messageData.userId !== user.id) {
                audioRef.current.play().catch(e => console.error('Error playing sound:', e));
              }
            }
          }
        }
      });

    return () => {
      unsubscribe();
    };
  }, [id, user, navigate, toast, messages]);

  // Handle joining a channel
  const handleJoinChannel = async () => {
    if (!user || !id || isJoining) return;

    setIsJoining(true);
    setErrorMessage(null);

    try {
      const result = await firebaseSocialService.subscribeToChannel(user.id, id);

      if (result.success) {
        setIsMember(true);
        toast({
          title: 'Success',
          description: result.message,
          status: 'success'
        });

        // Refresh members list
        const membersSnapshot = await firebase.firestore().collection('channel_subscriptions')
          .where('channelId', '==', id)
          .get();

        const membersData = [];
        for (const doc of membersSnapshot.docs) {
          const memberData = doc.data();
          const userProfile = await firebaseSocialService.getUserById(memberData.userId);

          membersData.push({
            id: doc.id,
            userId: memberData.userId,
            userName: userProfile?.displayName || `User ${memberData.userId.substring(0, 4)}`,
            userPhotoURL: userProfile?.photoURL || null,
            joinedAt: memberData.subscribedAt
          });
        }

        setMembers(membersData);

        // Update channel member count
        if (channel) {
          setChannel({
            ...channel,
            memberCount: (channel.memberCount || 0) + 1
          });
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('Error joining channel:', error);
      setErrorMessage('Failed to join channel. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!user || !id || !messageText.trim() || isSending || !isMember) return;

    setIsSending(true);

    try {
      await firebaseSocialService.sendChatGroupMessage(id, user.id, messageText.trim());
      setMessageText('');

      // Play sent sound
      const sentAudio = new Audio('/assets/sounds/message-sent.mp3');
      sentAudio.play().catch(e => console.error('Error playing sound:', e));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getChannelIcon = (type?: string) => {
    switch (type) {
      case 'fitness':
        return <Dumbbell className="w-6 h-6 text-blue-500" />;
      case 'food':
        return <Utensils className="w-6 h-6 text-green-500" />;
      case 'anatomy':
        return <Heart className="w-6 h-6 text-red-500" />;
      default:
        return <Users className="w-6 h-6 text-gray-500" />;
    }
  };

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
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowMembers(!showMembers)}
          >
            <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(100vh-16rem)]">
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {/* Messages area with custom background */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{
                backgroundImage: 'url(/assets/images/chat/chat-background.svg)',
                backgroundRepeat: 'repeat',
                backgroundSize: '400px'
              }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mb-2" />
                  <p>{t('social.noMessages', 'No messages yet')}</p>
                  {!isMember && (
                    <button
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      onClick={handleJoinChannel}
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                          {t('social.joining', 'Joining...')}
                        </>
                      ) : (
                        t('social.joinChannel', 'Join Channel')
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'} ${message.isSystem ? 'justify-center' : ''}`}
                    >
                      {message.isSystem ? (
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2 max-w-[80%] text-center text-sm text-gray-600 dark:text-gray-300">
                          {message.content}
                        </div>
                      ) : message.userId === user?.id ? (
                        <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                          <div>{message.content}</div>
                          <div className="text-xs text-blue-100 text-right mt-1">
                            {message.createdAt && new Date(message.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex">
                          <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                            <img
                              src={message.userPhotoURL || `https://ui-avatars.com/api/?name=${message.userName?.substring(0, 2) || 'U'}&background=random`}
                              alt={message.userName || 'User'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${message.userName?.substring(0, 2) || 'U'}&background=random`;
                              }}
                            />
                          </div>
                          <div>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 max-w-[80%]">
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {message.userName || `User ${message.userId.substring(0, 4)}`}
                              </div>
                              <div className="text-gray-800 dark:text-gray-200">{message.content}</div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 mt-1">
                              {message.createdAt && new Date(message.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            {isMember ? (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full p-3 pr-12 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      placeholder={t('social.typeMessage', 'Type a message...')}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={isSending}
                    />
                    <div className="absolute right-2 top-2 flex space-x-1">
                      <button
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                        type="button"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      <button
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                        type="button"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            ) : (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-3">
                    {t('social.joinToChat', 'Join this channel to start chatting')}
                  </p>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={handleJoinChannel}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                        {t('social.joining', 'Joining...')}
                      </>
                    ) : (
                      t('social.joinChannel', 'Join Channel')
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Audio element for message sound */}
            <audio ref={audioRef} src="/assets/sounds/message-received.mp3" />
          </div>

          {/* Info sidebar */}
          <AnimatePresence>
            {showMembers && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {showInfo ? t('social.channelInfo', 'Channel Info') : t('social.members', 'Members')}
                    {!showInfo && `(${members.length})`}
                  </h3>
                  <button
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    onClick={() => setShowInfo(!showInfo)}
                  >
                    {showInfo ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {showInfo ? (
                  <div className="overflow-y-auto h-full p-4">
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('social.about', 'About')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {channel?.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('social.createdOn', 'Created On')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {channel?.createdAt ? (
                          format(new Date(channel.createdAt.toDate()), 'MMMM d, yyyy')
                        ) : (
                          t('social.unknown', 'Unknown')
                        )}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('social.channelPolicies', 'Channel Policies')}
                      </h4>
                      {channelPolicies.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                          {channelPolicies.map((policy, index) => (
                            <li key={index}>{policy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                          {t('social.noPolicies', 'No specific policies for this channel.')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-y-auto h-full p-4">
                    {members.length > 0 ? (
                      members.map((member) => (
                        <div key={member.id} className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                            <img
                              src={member.userPhotoURL || `https://ui-avatars.com/api/?name=${member.userName?.substring(0, 2) || 'U'}&background=random`}
                              alt={member.userName || 'User'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${member.userName?.substring(0, 2) || 'U'}&background=random`;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {member.userName || `User ${member.userId.substring(0, 4)}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('social.joinedOn', 'Joined on')} {member.joinedAt ? (
                                format(new Date(member.joinedAt.toDate()), 'MMM d, yyyy')
                              ) : (
                                t('social.recently', 'Recently')
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{t('social.noMembers', 'No members yet')}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </NewSocialLayout>
  );
};

export default ChannelPage;
