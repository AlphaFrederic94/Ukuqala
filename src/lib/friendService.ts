import { supabase } from './supabaseClient';

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export const friendService = {
  async getFriends(userId: string) {
    try {
      // Get accepted friendships where the user is either the requester or the recipient
      const { data: sentRequests, error: sentError } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at,
          friend:profiles!user_friendships_friend_id_fkey(id, full_name, avatar_url)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (sentError) throw sentError;

      const { data: receivedRequests, error: receivedError } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at,
          user:profiles!user_friendships_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (receivedError) throw receivedError;

      // Format the data to have a consistent structure
      const sentFriends = sentRequests.map(req => ({
        id: req.id,
        friend_id: req.friend_id,
        user_id: req.user_id,
        status: req.status,
        created_at: req.created_at,
        updated_at: req.updated_at,
        friend: req.friend
      }));

      const receivedFriends = receivedRequests.map(req => ({
        id: req.id,
        friend_id: req.user_id, // Swap these for consistency
        user_id: req.friend_id, // Swap these for consistency
        status: req.status,
        created_at: req.created_at,
        updated_at: req.updated_at,
        friend: req.user
      }));

      return [...sentFriends, ...receivedFriends];
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  },

  async getPendingRequests(userId: string) {
    try {
      // Get pending requests sent to the user
      const { data, error } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at,
          user:profiles!user_friendships_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  },

  async getSentRequests(userId: string) {
    try {
      // Get pending requests sent by the user
      const { data, error } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at,
          friend:profiles!user_friendships_friend_id_fkey(id, full_name, avatar_url)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      return [];
    }
  },

  async sendFriendRequest(userId: string, friendId: string) {
    try {
      // Check if a request already exists in either direction
      const { data: existingRequests, error: checkError } = await supabase
        .from('user_friendships')
        .select('id, status')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (checkError) throw checkError;

      // If there's an existing request, return it
      if (existingRequests && existingRequests.length > 0) {
        return { data: existingRequests[0], isNew: false };
      }

      // Create a new friend request
      const { data, error } = await supabase
        .from('user_friendships')
        .insert([
          {
            user_id: userId,
            friend_id: friendId,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // We don't create a separate notification for friend requests
      // as they will appear in the friend requests section

      return { data, isNew: true };
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  async respondToFriendRequest(requestId: string, userId: string, accept: boolean) {
    try {
      // Get the request to verify it's for this user
      const { data: request, error: fetchError } = await supabase
        .from('user_friendships')
        .select('user_id, friend_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Verify the request is for this user
      if (request.friend_id !== userId) {
        throw new Error('Unauthorized: This request is not for you');
      }

      // Update the request status
      const newStatus = accept ? 'accepted' : 'rejected';
      const { data, error } = await supabase
        .from('user_friendships')
        .update({ status: newStatus })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Create a notification for the sender
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const notificationMessage = accept
        ? `${userData?.full_name || 'Someone'} accepted your friend request`
        : `${userData?.full_name || 'Someone'} declined your friend request`;

      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          type: accept ? 'friend_accepted' : 'friend_rejected',
          title: accept ? 'Friend Request Accepted' : 'Friend Request Declined',
          message: notificationMessage,
          link: '/social/friends',
          read: false
        });

      return data;
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  },

  async removeFriend(userId: string, friendId: string) {
    try {
      // Delete friendship in both directions
      const { error } = await supabase
        .from('user_friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  },

  async isFriend(userId: string, otherUserId: string) {
    try {
      // Check if they are friends in either direction
      const { data, error } = await supabase
        .from('user_friendships')
        .select('id, status')
        .or(`and(user_id.eq.${userId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${userId})`)
        .eq('status', 'accepted')
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return false;
    }
  },

  async getFriendshipStatus(userId: string, otherUserId: string) {
    try {
      // Check if there's any relationship in either direction
      const { data, error } = await supabase
        .from('user_friendships')
        .select('id, status, user_id, friend_id')
        .or(`and(user_id.eq.${userId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${userId})`)
        .maybeSingle();

      if (error) throw error;

      if (!data) return { status: 'none' };

      // Determine the status from the perspective of the current user
      if (data.status === 'accepted') {
        return { status: 'friends', id: data.id };
      } else if (data.status === 'pending') {
        if (data.user_id === userId) {
          return { status: 'sent', id: data.id };
        } else {
          return { status: 'received', id: data.id };
        }
      } else {
        return { status: 'none' };
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return { status: 'error' };
    }
  },

  async canSendMessage(userId: string, otherUserId: string) {
    try {
      // Check if they are friends
      const isFriend = await this.isFriend(userId, otherUserId);
      if (isFriend) return true;

      // If not friends, check if they've already exchanged messages
      const { data: sentMessages, error: sentError } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('sender_id', userId)
        .eq('recipient_id', otherUserId)
        .limit(2);

      if (sentError) throw sentError;

      // If they've already sent 2 or more messages, they can't send more
      if (sentMessages.length >= 2) return false;

      return true;
    } catch (error) {
      console.error('Error checking message permissions:', error);
      return false;
    }
  }
};
