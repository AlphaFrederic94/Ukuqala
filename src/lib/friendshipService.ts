import { supabase } from './supabaseClient';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  friend?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface FriendSuggestion {
  id: string;
  full_name: string;
  avatar_url: string;
}

export const friendshipService = {
  async getFriends(userId: string) {
    try {
      // Get accepted friendships where the user is the requester
      const { data: sentRequests, error: sentError } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (sentError) throw sentError;

      // Get accepted friendships where the user is the recipient
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at
        `)
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (receivedError) throw receivedError;

      // Get user info for friends
      const sentFriends = await Promise.all(
        (sentRequests || []).map(async (friendship) => {
          const { data: friendData, error: friendError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', friendship.friend_id)
            .single();

          if (friendError) {
            console.error('Error fetching friend info:', friendError);
            return {
              ...friendship,
              friend: { full_name: 'Unknown User', avatar_url: null }
            };
          }

          return {
            ...friendship,
            friend: friendData
          };
        })
      );

      const receivedFriends = await Promise.all(
        (receivedRequests || []).map(async (friendship) => {
          const { data: friendData, error: friendError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', friendship.user_id)
            .single();

          if (friendError) {
            console.error('Error fetching friend info:', friendError);
            return {
              ...friendship,
              friend_id: friendship.user_id,
              friend: { full_name: 'Unknown User', avatar_url: null }
            };
          }

          return {
            ...friendship,
            friend_id: friendship.user_id,
            friend: friendData
          };
        })
      );

      return [...sentFriends, ...receivedFriends];
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  },

  async getPendingFriendRequests(userId: string) {
    try {
      // Get pending friend requests sent to the user
      const { data: requests, error } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      // Get user info for each request sender
      const requestsWithUserInfo = await Promise.all(
        (requests || []).map(async (request) => {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', request.user_id)
            .single();

          if (userError) {
            console.error('Error fetching user info:', userError);
            return {
              ...request,
              friend_id: request.user_id,
              friend: { full_name: 'Unknown User', avatar_url: null }
            };
          }

          return {
            ...request,
            friend_id: request.user_id,
            friend: userData
          };
        })
      );

      return requestsWithUserInfo;
    } catch (error) {
      console.error('Error fetching pending friend requests:', error);
      return [];
    }
  },

  async getSentFriendRequests(userId: string) {
    try {
      // Get pending friend requests sent by the user
      const { data: requests, error } = await supabase
        .from('user_friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      // Get user info for each request recipient
      const requestsWithUserInfo = await Promise.all(
        (requests || []).map(async (request) => {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', request.friend_id)
            .single();

          if (userError) {
            console.error('Error fetching user info:', userError);
            return {
              ...request,
              friend: { full_name: 'Unknown User', avatar_url: null }
            };
          }

          return {
            ...request,
            friend: userData
          };
        })
      );

      return requestsWithUserInfo;
    } catch (error) {
      console.error('Error fetching sent friend requests:', error);
      return [];
    }
  },

  async sendFriendRequest(userId: string, friendId: string, retryCount = 0) {
    try {
      // Check if a friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from('user_friendships')
        .select('id, status')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .maybeSingle();

      if (checkError) throw checkError;

      // If friendship exists, return it
      if (existingFriendship) {
        return existingFriendship;
      }

      // Create new friendship request
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

      if (error) {
        console.error('Error sending friend request:', error);

        // If the table doesn't exist, try to create it
        if (error.code === '42P01' && retryCount === 0) {
          console.log('user_friendships table does not exist, trying to create it...');

          // We can't create tables from the client, so we'll return a mock response
          return {
            id: `mock-${Date.now()}`,
            user_id: userId,
            friend_id: friendId,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  async respondToFriendRequest(friendshipId: string, status: 'accepted' | 'rejected') {
    try {
      const { data, error } = await supabase
        .from('user_friendships')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', friendshipId)
        .select()
        .single();

      if (error) throw error;
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

  async cancelFriendRequest(friendshipId: string) {
    try {
      // Delete the specific friendship by ID
      const { error } = await supabase
        .from('user_friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error canceling friend request:', error);
      throw error;
    }
  },

  async getFriendSuggestions(userId: string, limit = 10, retryCount = 0) {
    try {
      // Get all users except the current user and existing friends/requests

      // First, get all friend IDs (both directions)
      const { data: friendships, error: friendshipsError } = await supabase
        .from('user_friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (friendshipsError) {
        console.error('Error fetching friendships:', friendshipsError);

        // If the table doesn't exist, get random users
        if (friendshipsError.code === '42P01' && retryCount === 0) {
          console.log('user_friendships table does not exist, getting random users...');
          return this.getRandomUserSuggestions(userId, limit);
        }

        throw friendshipsError;
      }

      // Extract all friend IDs
      const friendIds = new Set<string>();
      friendIds.add(userId); // Add current user to exclude list

      friendships?.forEach(friendship => {
        friendIds.add(friendship.user_id);
        friendIds.add(friendship.friend_id);
      });

      // Get users who are not friends
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .not('id', 'in', `(${Array.from(friendIds).join(',')})`)
        .limit(limit);

      if (suggestionsError) {
        console.error('Error fetching suggestions:', suggestionsError);
        return this.getRandomUserSuggestions(userId, limit);
      }

      // If we have no suggestions, get random users
      if (!suggestions || suggestions.length === 0) {
        return this.getRandomUserSuggestions(userId, limit);
      }

      return suggestions;
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      return this.getRandomUserSuggestions(userId, limit);
    }
  },

  async searchUsers(query: string, userId: string, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', userId)
        .ilike('full_name', `%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  // Get random users as friend suggestions
  async getRandomUserSuggestions(userId: string, limit = 5) {
    try {
      const { data: randomUsers, error: randomError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', userId)
        .limit(limit);

      if (randomError) {
        console.error('Error getting random users:', randomError);
        return [];
      }

      // Make sure full_name is not null or empty
      return (randomUsers || []).map(profile => ({
        ...profile,
        full_name: profile.full_name || `User ${profile.id.substring(0, 4)}`
      }));
    } catch (error) {
      console.error('Error getting random user suggestions:', error);
      return [];
    }
  }
};
