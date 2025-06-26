import { supabase } from './supabaseClient';
import { friendService } from './friendService';

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  recipient?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface ChatContact {
  id: string;
  full_name: string;
  avatar_url: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_friend: boolean;
}

export const messageService = {
  // Send a message
  async sendMessage(senderId: string, recipientId: string, content: string) {
    try {
      // Check if the sender can send a message to the recipient
      const canSend = await friendService.canSendMessage(senderId, recipientId);
      if (!canSend) {
        throw new Error('You need to be friends to send more messages');
      }

      // Create the message
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Create a notification for the recipient
      const { data: senderData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', senderId)
        .single();

      const senderName = senderData?.full_name || 'Someone';

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'new_message',
          title: 'New Message',
          message: `${senderName} sent you a message`,
          link: `/social/messages/${senderId}`,
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating message notification:', notificationError);
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  // Get messages between two users
  async getMessages(userId: string, otherUserId: string) {
    try {
      // Get messages between the two users with user details
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(id, full_name, avatar_url),
          recipient:profiles!chat_messages_recipient_id_fkey(id, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting messages:', error);
        throw error;
      }

      // Mark unread messages as read
      const unreadMessageIds = data
        ?.filter(msg => msg.recipient_id === userId && !msg.is_read)
        .map(msg => msg.id) || [];

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds);
      }

      return data;
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  },

  // Mark messages as read
  async markMessagesAsRead(userId: string, otherUserId: string) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      throw error;
    }
  },

  // Get unread message count
  async getUnreadMessageCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread message count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadMessageCount:', error);
      throw error;
    }
  },

  // Get recent conversations
  async getRecentConversations(userId: string) {
    try {
      // Get all messages involving this user
      const { data: sentMessages, error: sentError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          is_read,
          recipient:profiles!chat_messages_recipient_id_fkey(id, full_name, avatar_url)
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          is_read,
          sender:profiles!chat_messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Get all friends
      const friends = await friendService.getFriends(userId);
      const friendIds = new Set(friends.map(f => f.friend_id));

      // Combine and process the data
      const contactMap = new Map();

      // Process sent messages
      for (const message of sentMessages || []) {
        const contactId = message.recipient.id;
        if (!contactMap.has(contactId)) {
          contactMap.set(contactId, {
            id: contactId,
            full_name: message.recipient.full_name,
            avatar_url: message.recipient.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
            is_friend: friendIds.has(contactId)
          });
        }
      }

      // Process received messages
      for (const message of receivedMessages || []) {
        const contactId = message.sender.id;
        if (!contactMap.has(contactId)) {
          contactMap.set(contactId, {
            id: contactId,
            full_name: message.sender.full_name,
            avatar_url: message.sender.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.is_read ? 0 : 1,
            is_friend: friendIds.has(contactId)
          });
        } else {
          // Update last message if this one is more recent
          const contact = contactMap.get(contactId);
          const currentTime = new Date(contact.last_message_time).getTime();
          const newTime = new Date(message.created_at).getTime();

          if (newTime > currentTime) {
            contact.last_message = message.content;
            contact.last_message_time = message.created_at;
          }

          // Update unread count
          if (!message.is_read) {
            contact.unread_count += 1;
          }
        }
      }

      // Add friends who haven't exchanged messages yet
      for (const friend of friends) {
        if (!contactMap.has(friend.friend_id)) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', friend.friend_id)
            .single();

          if (profile) {
            contactMap.set(friend.friend_id, {
              id: friend.friend_id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              unread_count: 0,
              is_friend: true
            });
          }
        }
      }

      // Convert map to array and sort by last message time
      const contacts = Array.from(contactMap.values()).sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });

      return contacts;
    } catch (error) {
      console.error('Error in getRecentConversations:', error);
      throw error;
    }
  }
};
