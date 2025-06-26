import { supabase } from './supabaseClient';
import { ChatMessage } from './messageService';
import { ChatGroupMessage } from './channelService';
import { Notification } from './notificationService';

export const subscriptionService = {
  // Subscribe to direct messages between two users
  subscribeToDirectMessages(
    userId: string,
    otherUserId: string,
    callback: (message: ChatMessage) => void
  ) {
    return supabase
      .channel(`direct-messages:${userId}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId}))`
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();
  },

  // Subscribe to group messages in a channel
  subscribeToChannelMessages(
    channelId: string,
    callback: (message: ChatGroupMessage) => void
  ) {
    return supabase
      .channel(`channel-messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_group_messages',
          filter: `group_id=eq.${channelId}`
        },
        async (payload) => {
          // Fetch the user details for the message
          const message = payload.new as ChatGroupMessage;
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', message.user_id)
            .single();

          if (userData) {
            message.user = userData;
          }

          callback(message);
        }
      )
      .subscribe();
  },

  // Subscribe to channel members
  subscribeToChannelMembers(
    channelId: string,
    callback: () => void
  ) {
    return supabase
      .channel(`channel-members:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chat_group_members',
          filter: `group_id=eq.${channelId}`
        },
        () => {
          callback();
        }
      )
      .subscribe();
  },

  // Subscribe to friend requests
  subscribeToFriendRequests(
    userId: string,
    callback: () => void
  ) {
    return supabase
      .channel(`friend-requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_friendships',
          filter: `or(user_id.eq.${userId},friend_id.eq.${userId})`
        },
        () => {
          callback();
        }
      )
      .subscribe();
  },

  // Subscribe to notifications
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  },

  // Unsubscribe from a channel
  unsubscribe(subscription: any) {
    if (subscription) {
      try {
        // Check if the subscription has an unsubscribe method
        if (typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (typeof subscription === 'function') {
          // Some subscriptions might be functions themselves
          subscription();
        } else {
          // Try to remove the channel from Supabase
          try {
            supabase.removeChannel(subscription);
          } catch (error) {
            console.warn('Error removing Supabase channel:', error);
          }
        }
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
    }
  }
};
