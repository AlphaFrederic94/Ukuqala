// This file has been replaced with a simplified version to fix database connection issues
// The original file is saved as MessagesPage.jsx.bak for reference

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, ArrowLeft, Send, Loader2,
  AlertTriangle, MoreVertical, Phone, Video, Info,
  MessageSquare, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import UserSearch from '../../components/social/UserSearch';
import ChatMessage from '../../components/social/ChatMessage';
import VoiceRecorder from '../../components/social/VoiceRecorder';
import { uploadFile } from '../../lib/storageHelper';

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
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Listen for dark mode changes
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);

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
        console.log("Loading conversations for user:", user.id);

        // Try Firebase first if the function exists
        if (typeof socialService.getConversations === 'function') {
          try {
            console.log("Trying to load conversations from Firebase");
            const firebaseConversations = await socialService.getConversations(user.id);

            if (firebaseConversations && firebaseConversations.length > 0) {
              console.log("Loaded conversations from Firebase:", firebaseConversations);

              // Normalize Firebase conversation format to match our expected format
              const normalizedConversations = firebaseConversations.map(conv => ({
                user_id: conv.userId || conv.user_id,
                full_name: conv.displayName || conv.full_name || 'User',
                avatar_url: conv.photoURL || conv.avatar_url,
                last_message: conv.lastMessage || conv.last_message || '',
                last_message_time: conv.lastMessageTime || conv.last_message_time || new Date().toISOString(),
                unread_count: conv.unreadCount || conv.unread_count || 0
              }));

              setConversations(normalizedConversations);

              // If userId is provided, set active conversation
              if (userId) {
                const conversation = normalizedConversations.find(c => c.user_id === userId);
                if (conversation) {
                  setActiveConversation(conversation);
                } else {
                  await initializeNewConversation(userId);
                }
              }

              setLoading(false);
              return;
            }
          } catch (firebaseError) {
            console.error('Error loading Firebase conversations:', firebaseError);
          }
        }

        // If Firebase failed or returned no results, try Supabase
        console.log("Trying to load conversations from Supabase");

        // Simple direct query to get messages
        const { data: allMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Error loading messages from Supabase:', messagesError);
          setError(t('social.errorLoadingConversations'));
          setLoading(false);
          return;
        }

        if (!allMessages || allMessages.length === 0) {
          console.log("No messages found in Supabase");
          setConversations([]);

          // If userId is provided, initialize a new conversation
          if (userId) {
            await initializeNewConversation(userId);
          }

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
          console.error('Error loading profiles from Supabase:', profilesError);
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
          } else if (!otherUserProfile && !conversationMap[otherUserId]) {
            // If we don't have a profile, create a placeholder
            conversationMap[otherUserId] = {
              user_id: otherUserId,
              full_name: 'User',
              avatar_url: null,
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: message.recipient_id === user.id && !message.is_read ? 1 : 0
            };
          }
        });

        const conversationList = Object.values(conversationMap);
        console.log("Loaded conversations from Supabase:", conversationList);
        setConversations(conversationList);

        // If userId is provided, set active conversation
        if (userId) {
          const conversation = conversationList.find(c => c.user_id === userId);
          if (conversation) {
            setActiveConversation(conversation);
          } else {
            await initializeNewConversation(userId);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        setError(t('social.errorLoadingConversations'));
      } finally {
        setLoading(false);
      }
    };

    // Helper function to initialize a new conversation with a user
    const initializeNewConversation = async (targetUserId) => {
      console.log("Initializing new conversation with user:", targetUserId);

      // Try to get user profile from Firebase first
      if (typeof socialService.getUserById === 'function') {
        try {
          const firebaseUser = await socialService.getUserById(targetUserId);

          // Check if we got a real user profile or just a placeholder
          const isPlaceholder = !firebaseUser.displayName ||
                               firebaseUser.displayName.startsWith('User ') ||
                               !firebaseUser.photoURL;

          if (firebaseUser && !isPlaceholder) {
            console.log("Found user in Firebase:", firebaseUser);
            const newConversation = {
              user_id: targetUserId,
              full_name: firebaseUser.displayName || firebaseUser.full_name || 'User',
              avatar_url: firebaseUser.photoURL || firebaseUser.avatar_url,
              last_message: '',
              last_message_time: new Date().toISOString(),
              unread_count: 0
            };
            setActiveConversation(newConversation);

            // Also add to conversations list
            setConversations(prev => {
              if (!prev.some(c => c.user_id === targetUserId)) {
                return [newConversation, ...prev];
              }
              return prev;
            });

            return;
          } else {
            console.log("Firebase returned a placeholder user, will try Supabase");
          }
        } catch (firebaseError) {
          console.error("Error getting user from Firebase:", firebaseError);
        }
      }

      // If Firebase failed, try Supabase
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', targetUserId)
          .single();

        if (!profileError && userProfile) {
          console.log("Found user in Supabase:", userProfile);
          const newConversation = {
            user_id: userProfile.id,
            full_name: userProfile.full_name || 'User',
            avatar_url: userProfile.avatar_url,
            last_message: '',
            last_message_time: new Date().toISOString(),
            unread_count: 0
          };
          setActiveConversation(newConversation);

          // Also add to conversations list
          setConversations(prev => {
            if (!prev.some(c => c.user_id === targetUserId)) {
              return [newConversation, ...prev];
            }
            return prev;
          });
        } else {
          console.error("User not found in Supabase:", profileError);
          // Create a minimal conversation object with just the ID
          const minimalConversation = {
            user_id: targetUserId,
            full_name: 'User',
            avatar_url: null,
            last_message: '',
            last_message_time: new Date().toISOString(),
            unread_count: 0
          };
          setActiveConversation(minimalConversation);

          // Also add to conversations list
          setConversations(prev => {
            if (!prev.some(c => c.user_id === targetUserId)) {
              return [minimalConversation, ...prev];
            }
            return prev;
          });
        }
      } catch (supabaseError) {
        console.error("Error getting user from Supabase:", supabaseError);
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

        // Set up polling for real-time updates
        const pollingInterval = setInterval(() => {
          loadMessages(conversationId);
        }, 2000); // Poll every 2 seconds

        return () => {
          clearInterval(pollingInterval);
        };
      }
    }
  }, [activeConversation, userId, navigate]);

  // Load messages for a conversation
  const loadMessages = async (otherUserId) => {
    if (!user || !otherUserId) return;

    try {
      console.log("Loading messages for conversation with user:", otherUserId);

      let messagesLoaded = false;

      // Try Firebase first if the function exists
      if (typeof socialService.getMessagesBetweenUsers === 'function') {
        try {
          console.log("Trying to load messages from Firebase");
          const firebaseMessages = await socialService.getMessagesBetweenUsers(user.id, otherUserId);

          if (firebaseMessages && firebaseMessages.length > 0) {
            console.log("Loaded messages from Firebase:", firebaseMessages);

            // Normalize Firebase message format to match our expected format
            const normalizedMessages = firebaseMessages.map(msg => ({
              id: msg.id,
              sender_id: msg.senderId || msg.sender_id,
              recipient_id: msg.recipientId || msg.recipient_id,
              content: msg.content || msg.text || msg.message || '',
              created_at: msg.createdAt || msg.created_at || msg.timestamp || new Date().toISOString(),
              is_read: msg.isRead || msg.is_read || false,
              sender: {
                id: msg.senderId || msg.sender_id,
                full_name: msg.senderName || 'User',
                avatar_url: msg.senderAvatar
              },
              recipient: {
                id: msg.recipientId || msg.recipient_id,
                full_name: msg.recipientName || 'User',
                avatar_url: msg.recipientAvatar
              }
            }));

            setMessages(normalizedMessages);
            scrollToBottom();
            messagesLoaded = true;

            // Mark messages as read in Firebase
            if (typeof socialService.markMessagesAsRead === 'function') {
              try {
                await socialService.markMessagesAsRead(user.id, otherUserId);
              } catch (markError) {
                console.error("Error marking Firebase messages as read:", markError);
              }
            }

            return;
          }
        } catch (firebaseError) {
          console.error('Error loading messages from Firebase:', firebaseError);
        }
      }

      // If Firebase failed or returned no results, try Supabase
      if (!messagesLoaded) {
        console.log("Trying to load messages from Supabase");

        // Try using the RPC function first
        let data;
        let error;

        try {
          console.log("Trying to use get_chat_messages RPC function");
          const rpcResult = await supabase
            .rpc('get_chat_messages', {
              user1_id: user.id,
              user2_id: otherUserId
            });

          if (rpcResult.error) {
            console.error('Error using RPC function:', rpcResult.error);
            throw rpcResult.error;
          }

          // If RPC was successful, transform the data to match our expected format
          if (rpcResult.data && rpcResult.data.length > 0) {
            console.log("Successfully loaded messages using RPC function");

            // Transform the data
            const enhancedMessages = rpcResult.data.map(message => ({
              ...message,
              sender: {
                id: message.sender_id,
                full_name: message.sender_name || 'User',
                avatar_url: message.sender_avatar
              },
              recipient: {
                id: message.recipient_id,
                full_name: message.recipient_name || 'User',
                avatar_url: message.recipient_avatar
              }
            }));

            setMessages(enhancedMessages);
            scrollToBottom();

            // Mark messages as read
            markMessagesAsRead(rpcResult.data, otherUserId);
            return;
          }
        } catch (rpcError) {
          console.error('Falling back to direct query due to RPC error:', rpcError);
        }

        // Fallback to direct query if RPC fails
        console.log("Falling back to direct query");
        const queryResult = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        data = queryResult.data;
        error = queryResult.error;

        if (error) {
          console.error('Error loading messages from Supabase:', error);
          setError(t('social.errorLoadingMessages'));
          return;
        }

        // If there are no messages, just set an empty array and return
        if (!data || data.length === 0) {
          console.log("No messages found in Supabase for this conversation");
          setMessages([]);
          return;
        }

        // Get profiles for messages
        const userIds = new Set();
        data.forEach(msg => {
          userIds.add(msg.sender_id);
          userIds.add(msg.recipient_id);
        });

        // Try to get profiles from Supabase
        let profiles = [];
        try {
          const { data: profileData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', Array.from(userIds));

          if (!profilesError && profileData) {
            profiles = profileData;
          }
        } catch (profileError) {
          console.error('Error loading profiles from Supabase:', profileError);
        }

        // If we couldn't get profiles from Supabase, try Firebase for each user
        if (profiles.length === 0 && typeof socialService.getUserById === 'function') {
          try {
            for (const userId of userIds) {
              try {
                const firebaseUser = await socialService.getUserById(userId);

                // Check if we got a real user profile or just a placeholder
                const isPlaceholder = !firebaseUser.displayName ||
                                     firebaseUser.displayName.startsWith('User ') ||
                                     !firebaseUser.photoURL;

                if (firebaseUser && !isPlaceholder) {
                  profiles.push({
                    id: userId,
                    full_name: firebaseUser.displayName || firebaseUser.full_name || 'User',
                    avatar_url: firebaseUser.photoURL || firebaseUser.avatar_url
                  });
                  console.log(`Added Firebase profile for user ${userId}:`, firebaseUser);
                } else {
                  console.log(`Firebase returned a placeholder for user ${userId}, using default values`);
                }
              } catch (userError) {
                console.error(`Error loading Firebase user ${userId}:`, userError);
              }
            }
          } catch (firebaseProfileError) {
            console.error('Error loading profiles from Firebase:', firebaseProfileError);
          }
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
            } : {
              id: message.sender_id,
              full_name: 'User',
              avatar_url: null
            },
            recipient: recipientProfile ? {
              id: recipientProfile.id,
              full_name: recipientProfile.full_name || 'User',
              avatar_url: recipientProfile.avatar_url
            } : {
              id: message.recipient_id,
              full_name: 'User',
              avatar_url: null
            }
          };
        });

        console.log("Loaded messages from Supabase:", enhancedMessages);
        setMessages(enhancedMessages);
        scrollToBottom();

        // Mark messages as read in Supabase
        markMessagesAsRead(data, otherUserId);
      }
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
  const sendMessage = async (text = messageText, fileInfo = null) => {
    if (!user || !activeConversation || ((!text.trim() && !selectedFile && !fileInfo) || sendingMessage)) return;

    setSendingMessage(true);
    console.log("Sending message to:", activeConversation.user_id);

    try {
      let fileUrl = fileInfo?.url || null;
      let fileType = fileInfo?.type || null;
      let fileName = fileInfo?.name || null;
      let fileSize = fileInfo?.size || null;

      // If there's a file (but not a pre-uploaded file like voice message), upload it first
      if (selectedFile && !fileInfo) {
        try {
          console.log("Uploading file:", selectedFile.name);

          // Compress image if it's an image
          let fileToUpload = selectedFile;
          if (selectedFile.type.startsWith('image/')) {
            try {
              // Simple client-side image compression
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();

              // Create a promise to handle the image loading
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = URL.createObjectURL(selectedFile);
              });

              // Calculate new dimensions (max 1200px width/height)
              let width = img.width;
              let height = img.height;
              const maxSize = 1200;

              if (width > height && width > maxSize) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              } else if (height > maxSize) {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              // Convert to blob with reduced quality
              const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.7);
              });

              fileToUpload = new File([blob], selectedFile.name, {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
              });

              console.log("Image compressed:",
                `Original: ${(selectedFile.size / 1024).toFixed(1)}KB, ` +
                `Compressed: ${(fileToUpload.size / 1024).toFixed(1)}KB`
              );
            } catch (compressionError) {
              console.error("Error compressing image:", compressionError);
              // Continue with original file if compression fails
            }
          }

          // Try to upload to Supabase Storage using our helper function
          const filePath = `chat/${user.id}/${Date.now()}_${fileToUpload.name}`;

          const { url, error: uploadError } = await uploadFile(fileToUpload, filePath, {
            contentType: fileToUpload.type,
            cacheControl: '3600'
          });

          if (uploadError) {
            throw new Error(`Supabase upload error: ${uploadError.message}`);
          }

          if (!url) {
            throw new Error('Failed to get URL for uploaded file');
          }

          // Set the file URL and metadata
          fileUrl = url;
          fileType = fileToUpload.type;
          fileName = fileToUpload.name;
          fileSize = fileToUpload.size;

          console.log("File uploaded successfully:", fileUrl);
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          setError(t('social.errorUploadingFile'));
          return;
        }
      }

      // Prepare message data
      const messageData = {
        sender_id: user.id,
        recipient_id: activeConversation.user_id,
        content: text.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize
      };

      console.log("Message data:", messageData);

      let messageSent = false;
      let messageId = null;

      // Try Firebase first if the function exists
      if (typeof socialService.sendMessage === 'function') {
        try {
          console.log("Trying to send message via Firebase");
          const result = await socialService.sendMessage(
            user.id,
            activeConversation.user_id,
            text.trim(),
            fileUrl ? {
              url: fileUrl,
              type: fileType,
              name: fileName,
              size: fileSize
            } : null
          );

          if (result && result.id) {
            console.log("Message sent successfully via Firebase:", result);
            messageSent = true;
            messageId = result.id;

            // If Firebase was successful, we'll still try to save to Supabase for redundancy
            try {
              await supabase
                .from('chat_messages')
                .insert({
                  ...messageData,
                  id: messageId // Use the same ID from Firebase if possible
                });
            } catch (redundancyError) {
              console.log("Redundancy save to Supabase failed, but Firebase succeeded:", redundancyError);
              // This is not critical, so we don't need to handle it
            }
          }
        } catch (firebaseError) {
          console.error('Error sending message via Firebase:', firebaseError);
        }
      }

      // If Firebase failed or doesn't exist, try Supabase
      if (!messageSent) {
        console.log("Sending message via Supabase");
        const { data, error } = await supabase
          .from('chat_messages')
          .insert(messageData)
          .select()
          .single();

        if (error) {
          console.error('Error sending message via Supabase:', error);
          setError(t('social.errorSendingMessage'));
          return;
        }

        console.log("Message sent successfully via Supabase:", data);
        messageSent = true;
        messageId = data.id;
        messageData.id = data.id; // Update the message data with the generated ID
      }

      if (!messageSent) {
        throw new Error("Failed to send message through any available channel");
      }

      // Add message to the list
      const newMessage = {
        ...messageData,
        id: messageId,
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

      // Determine last message preview text
      let lastMessagePreview = text.trim();
      if (fileUrl) {
        if (fileType?.startsWith('image/')) {
          lastMessagePreview = lastMessagePreview || t('social.sentImage');
        } else if (fileType?.startsWith('audio/')) {
          lastMessagePreview = lastMessagePreview || t('social.sentAudio');
        } else if (fileType?.startsWith('video/')) {
          lastMessagePreview = lastMessagePreview || t('social.sentVideo');
        } else {
          lastMessagePreview = lastMessagePreview || t('social.sentFile');
        }
      }

      // Update the conversation with the new message
      const updatedConversation = {
        ...activeConversation,
        last_message: lastMessagePreview,
        last_message_time: new Date().toISOString()
      };

      // Update the active conversation
      setActiveConversation(updatedConversation);

      // Update the conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.user_id === activeConversation.user_id);
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = updatedConversation;
          return updated;
        } else {
          // Add new conversation to the list
          return [updatedConversation, ...prev];
        }
      });

      // Add message to the messages list
      setMessages(prev => [...prev, newMessage]);

      // Clear input and selected file
      setMessageText('');
      setSelectedFile(null);
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

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('social.fileTooLarge'));
      return;
    }

    setSelectedFile(file);

    // Preview file if it's an image
    if (file.type.startsWith('image/')) {
      // Show image preview
      console.log('Image selected:', file.name);
    } else {
      // Show file info
      console.log('File selected:', file.name);
    }
  };

  // Handle image capture
  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('social.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    console.log('Image captured:', file.name);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  // Toggle info panel
  const toggleInfoPanel = () => {
    setShowInfoPanel(prev => !prev);
  };

  // Handle user selection from search
  const handleUserSelect = async (selectedUser) => {
    setShowSearch(false);
    console.log("Selected user:", selectedUser);

    if (!selectedUser || !selectedUser.id) {
      console.error("Invalid user selected");
      return;
    }

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(c => c.user_id === selectedUser.id);
      if (existingConversation) {
        console.log("Using existing conversation:", existingConversation);
        setActiveConversation(existingConversation);
        return;
      }

      // If no existing conversation, try to get complete user profile
      let userProfile = selectedUser;
      let profileFound = false;

      // Try Firebase first
      if (typeof socialService.getUserById === 'function') {
        try {
          console.log("Fetching user profile from Firebase");
          const firebaseUser = await socialService.getUserById(selectedUser.id);

          // Check if we got a real user profile or just a placeholder
          const isPlaceholder = !firebaseUser.displayName ||
                               firebaseUser.displayName.startsWith('User ') ||
                               !firebaseUser.photoURL;

          if (firebaseUser && !isPlaceholder) {
            userProfile = {
              id: selectedUser.id,
              ...firebaseUser,
              // Ensure we have standard field names
              full_name: firebaseUser.displayName || firebaseUser.full_name,
              avatar_url: firebaseUser.photoURL || firebaseUser.avatar_url
            };
            profileFound = true;
            console.log("Found user profile in Firebase:", userProfile);
          } else {
            console.log("Firebase returned a placeholder user, will try Supabase");
          }
        } catch (firebaseError) {
          console.error("Error fetching user from Firebase:", firebaseError);
        }
      }

      // If not found in Firebase, try Supabase
      if (!profileFound && (!userProfile.full_name || !userProfile.avatar_url)) {
        try {
          console.log("Fetching user profile from Supabase");
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .eq('id', selectedUser.id)
            .single();

          if (!error && data) {
            userProfile = {
              ...userProfile,
              ...data
            };
            profileFound = true;
            console.log("Found user profile in Supabase:", userProfile);
          }
        } catch (supabaseError) {
          console.error("Error fetching user from Supabase:", supabaseError);
        }
      }

      // Create new conversation with the best data we have
      const newConversation = {
        user_id: userProfile.id,
        full_name: userProfile.full_name || userProfile.displayName || userProfile.email?.split('@')[0] || 'User',
        avatar_url: userProfile.avatar_url || userProfile.photoURL,
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: 0
      };

      console.log("Creating new conversation:", newConversation);
      setActiveConversation(newConversation);

      // Add this conversation to the conversations list
      setConversations(prev => {
        // Check if it already exists (just to be safe)
        if (!prev.some(c => c.user_id === newConversation.user_id)) {
          return [newConversation, ...prev];
        }
        return prev;
      });

      // Focus the message input after a short delay
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 300);
    } catch (error) {
      console.error("Error initializing conversation:", error);
    }
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
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-800">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('social.lastSeen')} {formatConversationDate(new Date().toISOString())}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={t('social.search')}
                  >
                    <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
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
                  <div className="relative">
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label={t('social.more')}
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-cover bg-center"
                style={{
                  backgroundImage: `url('/assets/chat-background${isDarkMode ? '-dark' : ''}.svg')`
                }}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg">
                      {t('social.noMessagesYet')}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg">
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
                {/* File preview */}
                {selectedFile && (
                  <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      {selectedFile.type.startsWith('image/') ? (
                        <div className="w-12 h-12 rounded overflow-hidden mr-2">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500 dark:text-blue-300">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                        </div>
                      )}
                      <div className="text-sm">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setSelectedFile(null)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500 dark:text-gray-400">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {/* Attachment button */}
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    aria-label={t('social.attachment')}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.mp3,.mp4"
                  />

                  {/* Camera button */}
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    aria-label={t('social.camera')}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    onChange={handleImageCapture}
                    accept="image/*"
                    capture="environment"
                  />

                  {/* Voice recorder */}
                  <VoiceRecorder
                    onSend={(audioUrl, audioInfo) => {
                      // Create a message with the audio file
                      sendMessage('', {
                        url: audioUrl,
                        type: audioInfo.type,
                        name: audioInfo.name,
                        size: audioInfo.size
                      });
                    }}
                    onCancel={() => {}}
                  />

                  {/* Message input */}
                  <div className="flex-1 relative">
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
                      className="w-full bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-gray-200 pr-10"
                      ref={messageInputRef}
                    />

                    {/* Emoji button */}
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                      aria-label={t('social.emoji')}
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                      </svg>
                    </button>

                    {/* Emoji picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-8 gap-1">
                          {['😊', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '😍',
                            '😭', '😘', '🥰', '😎', '🤔', '😢', '😡', '👏',
                            '🤗', '🥺', '🤣', '😄', '😅', '😉', '😋', '😴'].map(emoji => (
                            <button
                              key={emoji}
                              className="w-8 h-8 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              onClick={() => handleEmojiSelect(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send button */}
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    className={`p-2 rounded-full ${
                      !messageText.trim() || sendingMessage
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
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
