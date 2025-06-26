import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  UserPlus, Users, Check, X, Search, Loader2,
  MessageSquare, User, ArrowLeft, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const Friends = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('requests');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch pending friend requests
        const { data: requestsData, error: requestsError } = await supabase
          .rpc('get_pending_friend_requests');

        if (requestsError) {
          console.error('Error fetching friend requests:', requestsError);

          // Fallback to direct query if RPC fails
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_friendships')
            .select(`
              id,
              user_id,
              created_at,
              profiles:user_id (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('friend_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (fallbackError) throw fallbackError;

          // Transform the data to match the RPC output format
          const transformedData = fallbackData?.map(item => ({
            id: item.id,
            user_id: item.user_id,
            user_name: item.profiles?.full_name || 'User',
            user_avatar: item.profiles?.avatar_url,
            created_at: item.created_at
          })) || [];

          setPendingRequests(transformedData);
        } else {
          setPendingRequests(requestsData || []);
        }

        // Fetch friends list - using simpler query to avoid foreign key issues
        const { data: friendsData, error: friendsError } = await supabase
          .from('user_friendships')
          .select('id, user_id, friend_id, created_at, status')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        // If we have friends, get their profiles
        let profiles = [];
        if (!friendsError && friendsData && friendsData.length > 0) {
          // Get all user IDs that we need profiles for
          const userIds = new Set();
          friendsData.forEach(friendship => {
            if (friendship.user_id !== user.id) userIds.add(friendship.user_id);
            if (friendship.friend_id !== user.id) userIds.add(friendship.friend_id);
          });

          // Fetch profiles for these users
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', Array.from(userIds));

          if (profilesData) {
            profiles = profilesData;
          }
        }

        if (friendsError) throw friendsError;

        // Transform the data to get the other user's info
        const transformedFriends = friendsData?.map(item => {
          const isUserTheRequester = item.user_id === user.id;
          const otherUserId = isUserTheRequester ? item.friend_id : item.user_id;
          const otherUserProfile = profiles.find(p => p.id === otherUserId);

          return {
            id: item.id,
            friend_id: otherUserId,
            friend_name: otherUserProfile?.full_name || 'User',
            friend_avatar: otherUserProfile?.avatar_url,
            created_at: item.created_at
          };
        }) || [];

        setFriends(transformedFriends);
      } catch (err) {
        console.error('Error fetching friends data:', err);
        setError(t('social.errorLoadingFriends', 'Error loading friends data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const friendshipsSubscription = supabase
      .channel('public:user_friendships')
      .on('INSERT', payload => {
        if (payload.new && payload.new.friend_id === user.id && payload.new.status === 'pending') {
          // Refresh pending requests
          fetchData();
        }
      })
      .on('UPDATE', payload => {
        if (payload.new && (payload.new.user_id === user.id || payload.new.friend_id === user.id)) {
          // Refresh both lists
          fetchData();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(friendshipsSubscription);
    };
  }, [user, t]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;

      // Check which users already have a friendship
      const { data: existingFriendships, error: friendshipError } = await supabase
        .from('user_friendships')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendshipError) throw friendshipError;

      // Create a set of user IDs that already have a friendship
      const friendshipUsers = new Set();
      existingFriendships?.forEach(friendship => {
        const otherId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
        friendshipUsers.add(otherId);
      });

      // Filter out users that already have a friendship
      const filteredResults = data?.filter(profile => !friendshipUsers.has(profile.id)) || [];
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
      setError(t('social.errorSearchingUsers', 'Error searching for users'));
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId) => {
    try {
      // Try using the RPC function first
      try {
        const { error } = await supabase.rpc('send_friend_request', {
          p_friend_id: friendId
        });

        if (error) throw error;
      } catch (rpcError) {
        console.error('RPC method failed:', rpcError);

        // Fallback to direct insert
        const { error } = await supabase
          .from('user_friendships')
          .insert({
            user_id: user.id,
            friend_id: friendId,
            status: 'pending'
          });

        if (error) throw error;
      }

      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.id !== friendId));
      setSuccess(t('social.friendRequestSent', 'Friend request sent successfully!'));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(t('social.errorSendingFriendRequest', 'Error sending friend request'));
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      // Try using the RPC function first
      try {
        const { error } = await supabase.rpc('accept_friend_request', {
          p_friendship_id: requestId
        });

        if (error) throw error;
      } catch (rpcError) {
        console.error('RPC method failed:', rpcError);

        // Fallback to direct update
        const { error } = await supabase
          .from('user_friendships')
          .update({ status: 'accepted' })
          .eq('id', requestId)
          .eq('friend_id', user.id);

        if (error) throw error;
      }

      setSuccess(t('social.friendRequestAccepted', 'Friend request accepted!'));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(t('social.errorAcceptingFriendRequest', 'Error accepting friend request'));
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      // Try using the RPC function first
      try {
        const { error } = await supabase.rpc('reject_friend_request', {
          p_friendship_id: requestId
        });

        if (error) throw error;
      } catch (rpcError) {
        console.error('RPC method failed:', rpcError);

        // Fallback to direct update
        const { error } = await supabase
          .from('user_friendships')
          .update({ status: 'rejected' })
          .eq('id', requestId)
          .eq('friend_id', user.id);

        if (error) throw error;
      }

      setSuccess(t('social.friendRequestRejected', 'Friend request rejected'));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      setError(t('social.errorRejectingFriendRequest', 'Error rejecting friend request'));
    }
  };

  const startChat = (friendId) => {
    navigate(`/social/messages/${friendId}`);
  };

  const viewProfile = (friendId) => {
    navigate(`/social/profile/${friendId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/social')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('social.friends', 'Friends')}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check className="w-5 h-5 mr-2" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'requests'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            <div className="flex items-center justify-center">
              <UserPlus className="w-5 h-5 mr-2" />
              {t('social.requests', 'Requests')}
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'friends'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('friends')}
          >
            <div className="flex items-center justify-center">
              <Users className="w-5 h-5 mr-2" />
              {t('social.friendsList', 'Friends')}
              <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {friends.length}
              </span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'find'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('find')}
          >
            <div className="flex items-center justify-center">
              <Search className="w-5 h-5 mr-2" />
              {t('social.findFriends', 'Find Friends')}
            </div>
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'requests' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                {t('social.pendingRequests', 'Pending Requests')}
              </h2>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 rounded-lg"
                    >
                      <div className="flex items-center">
                        <img
                          src={request.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.user_name)}&background=random`}
                          alt={request.user_name}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {request.user_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptFriendRequest(request.id)}
                          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t('social.accept', 'Accept')}
                        </button>
                        <button
                          onClick={() => rejectFriendRequest(request.id)}
                          className="flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('social.decline', 'Decline')}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('social.noFriendRequests', 'No pending friend requests')}
                </div>
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                {t('social.yourFriends', 'Your Friends')}
              </h2>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map(friend => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 rounded-lg"
                    >
                      <div className="flex items-center">
                        <img
                          src={friend.friend_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.friend_name)}&background=random`}
                          alt={friend.friend_name}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {friend.friend_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('social.friendSince', 'Friend since')} {new Date(friend.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => startChat(friend.friend_id)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                          title={t('social.message', 'Message')}
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => viewProfile(friend.friend_id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          title={t('social.viewProfile', 'View Profile')}
                        >
                          <User className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('social.noFriendsYet', 'You have no friends yet')}
                </div>
              )}
            </div>
          )}

          {activeTab === 'find' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                {t('social.findFriends', 'Find Friends')}
              </h2>

              <div className="flex mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('social.searchByName', 'Search by name')}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map(result => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 rounded-lg"
                    >
                      <div className="flex items-center">
                        <img
                          src={result.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.full_name)}&background=random`}
                          alt={result.full_name}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {result.full_name}
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={() => sendFriendRequest(result.id)}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {t('social.addFriend', 'Add Friend')}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('social.noUsersFound', 'No users found matching your search')}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
