import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatGroupMessage, ChatGroup } from '../../lib/firebaseSocialService';
import { useTranslation } from 'react-i18next';
import { Send, Image, Smile, PlusCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import firebase from '../../firebase-compat';
import { motion, AnimatePresence } from 'framer-motion';

type Timestamp = firebase.firestore.Timestamp;

interface FirebaseChannelChatProps {
  groupId: string;
}

const FirebaseChannelChat: React.FC<FirebaseChannelChatProps> = ({ groupId }) => {
  const { t } = useTranslation();
  const { socialService } = useFirebase();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatGroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stickers
  const stickers = [
    '👋', '😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '🙏', '👏',
    '😍', '🤔', '😎', '🤗', '😢', '😴', '🤢', '😡', '🤯', '🥳'
  ];

  // Fetch group details and messages
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        // Get all groups
        const groups = await socialService.getChatGroups();
        const foundGroup = groups.find(g => g.id === groupId);

        if (foundGroup) {
          setGroup(foundGroup);
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
      }
    };

    fetchGroupDetails();
  }, [groupId, socialService]);

  // Subscribe to messages
  useEffect(() => {
    if (!groupId) return;

    setLoading(true);

    const unsubscribe = socialService.subscribeToChatGroupMessages(
      groupId,
      (fetchedMessages) => {
        // Sort messages by creation time (oldest first)
        const sortedMessages = [...fetchedMessages].sort((a, b) => {
          const dateA = a.createdAt instanceof firebase.firestore.Timestamp ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime());
          const dateB = b.createdAt instanceof firebase.firestore.Timestamp ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime());
          return dateA - dateB;
        });

        setMessages(sortedMessages);
        setLoading(false);
      }
    );

    // Join the group if not already a member
    if (user) {
      socialService.joinChatGroup(groupId, user.id)
        .then(joined => {
          if (joined) {
            console.log('Joined the group');
          }
        })
        .catch(error => {
          console.error('Error joining group:', error);
        });
    }

    return () => {
      unsubscribe();
    };
  }, [groupId, socialService, user]);

  // Subscribe to member count changes
  useEffect(() => {
    if (!groupId) return;

    const memberCountUnsubscribe = firebase.firestore()
      .collection('chat_group_members')
      .where('groupId', '==', groupId)
      .onSnapshot(snapshot => {
        // Update the group with the current member count
        setGroup(prevGroup => {
          if (!prevGroup) return null;
          return {
            ...prevGroup,
            memberCount: snapshot.docs.length
          };
        });
      });

    return () => {
      memberCountUnsubscribe();
    };
  }, [groupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !selectedImage)) return;

    try {
      if (selectedImage) {
        // Upload image
        const path = `social/chat/${groupId}/${Date.now()}_${selectedImage.name}`;
        const imageUrl = await socialService.uploadFile(selectedImage, path);

        // Send message with image URL
        await socialService.sendChatGroupMessage(
          groupId,
          user.id,
          imageUrl,
          true
        );

        setSelectedImage(null);
      }

      if (newMessage.trim()) {
        // Send text message
        await socialService.sendChatGroupMessage(
          groupId,
          user.id,
          newMessage.trim(),
          false
        );

        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Send sticker
  const handleSendSticker = async (sticker: string) => {
    if (!user) return;

    try {
      await socialService.sendChatGroupMessage(
        groupId,
        user.id,
        sticker,
        true
      );

      setShowStickers(false);
    } catch (error) {
      console.error('Error sending sticker:', error);
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Format date
  const formatDate = (date: Date | Timestamp) => {
    if (date instanceof firebase.firestore.Timestamp) {
      return formatDistanceToNow(date.toDate(), { addSuffix: true });
    }
    return formatDistanceToNow(date instanceof Date ? date : new Date(date), { addSuffix: true });
  };

  // Check if message is from current user
  const isCurrentUser = (userId: string) => {
    return user?.id === userId;
  };

  // Check if message is a sticker
  const isSticker = (message: ChatGroupMessage) => {
    return message.isSticker && (
      message.content.length <= 4 || // Emoji stickers are usually 1-2 characters
      message.content.startsWith('http') // Image stickers have URLs
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Group header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {group?.name?.charAt(0) || '?'}
          </div>
          <div className="ml-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">{group?.name || 'Loading...'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {group?.memberCount || 0} {t('social.members', 'members')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 relative">
        {/* WhatsApp-style background pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">💬</div>
            <p>{t('social.noMessages', 'No messages yet')}</p>
            <p className="text-sm mt-2">
              {t('social.beTheFirst', 'Be the first to send a message!')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isUser = isCurrentUser(message.userId);
              const isMessageSticker = isSticker(message);

              return (
                <div
                  key={message.id || index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                    {!isUser && (
                      <div className="flex-shrink-0 mr-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                          {message.userId.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-xs ${
                        isUser
                          ? 'bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                      } ${
                        isMessageSticker ? 'p-2' : 'p-3'
                      } shadow-sm`}
                    >
                      {isMessageSticker ? (
                        message.content.startsWith('http') ? (
                          <img
                            src={message.content}
                            alt="Sticker"
                            className="max-w-[150px] max-h-[150px] rounded"
                          />
                        ) : (
                          <span className="text-4xl">{message.content}</span>
                        )
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected"
              className="h-20 rounded"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Image className="w-5 h-5" />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowStickers(!showStickers)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Smile className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showStickers && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700 grid grid-cols-5 gap-2 w-64"
                >
                  {stickers.map((sticker, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendSticker(sticker)}
                      className="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {sticker}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('social.typeMessage', 'Type a message...')}
            className="flex-1 mx-2 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200"
          />

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !selectedImage}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseChannelChat;
