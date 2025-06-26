import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Users, UserCheck, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { friendshipService, Friendship, FriendSuggestion } from '../../lib/friendshipService';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import FriendCard from '../../components/social/FriendCard';

const Friends: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'friends' | 'suggestions' | 'requests' | 'sent'>('friends');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSuggestion[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load friends
        const friendsData = await friendshipService.getFriends(user.id);
        setFriends(friendsData);

        // Load friend suggestions
        const suggestionsData = await friendshipService.getFriendSuggestions(user.id, 10);
        setSuggestions(suggestionsData);

        // Load pending friend requests
        const requestsData = await friendshipService.getPendingFriendRequests(user.id);
        setPendingRequests(requestsData);

        // Load sent friend requests
        const sentData = await friendshipService.getSentFriendRequests(user.id);
        setSentRequests(sentData);
      } catch (err: any) {
        console.error('Error loading friends data:', err);
        setError(err.message || t('social.errorLoadingFriends'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up real-time subscription for friendships
    const friendshipsSubscription = supabase
      .channel('user_friendships_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_friendships',
          filter: `or(user_id.eq.${user.id},friend_id.eq.${user.id})`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendshipsSubscription);
    };
  }, [user, t]);

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const results = await friendshipService.searchUsers(searchQuery, user.id);

      // Check if we have results
      if (results.length === 0) {
        // Try a more flexible search if no results found
        const flexibleResults = await friendshipService.searchUsers(searchQuery.split(' ')[0], user.id);
        setSearchResults(flexibleResults);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;

    try {
      await friendshipService.sendFriendRequest(user.id, friendId);

      // Update UI
      if (activeTab === 'suggestions') {
        setSuggestions(suggestions.filter(friend => friend.id !== friendId));
      } else if (searchQuery) {
        setSearchResults(searchResults.filter(friend => friend.id !== friendId));
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;

    if (window.confirm(t('social.confirmRemoveFriend'))) {
      try {
        await friendshipService.removeFriend(user.id, friendId);
        setFriends(friends.filter(friend => friend.friend_id !== friendId));
      } catch (err) {
        console.error('Error removing friend:', err);
      }
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await friendshipService.respondToFriendRequest(friendshipId, 'accepted');
      setPendingRequests(pendingRequests.filter(request => request.id !== friendshipId));
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await friendshipService.respondToFriendRequest(friendshipId, 'rejected');
      setPendingRequests(pendingRequests.filter(request => request.id !== friendshipId));
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      // Get the friendship details to properly cancel it
      const requestToCancel = sentRequests.find(request => request.id === friendshipId);
      if (requestToCancel && requestToCancel.friend_id) {
        await friendshipService.removeFriend(user?.id || '', requestToCancel.friend_id);
        setSentRequests(sentRequests.filter(request => request.id !== friendshipId));
      } else {
        // Fallback to using the friendship ID directly
        await friendshipService.cancelFriendRequest(friendshipId);
        setSentRequests(sentRequests.filter(request => request.id !== friendshipId));
      }
    } catch (err) {
      console.error('Error canceling friend request:', err);
    }
  };

  const handleMessage = (friendId: string) => {
    navigate(`/social/messages/${friendId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {t('common.retry')}
          </button>
        </div>
      );
    }

    if (searchQuery && searchResults.length === 0 && !isSearching) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('social.noSearchResults')}
        </div>
      );
    }

    if (searchQuery) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchResults.map(result => (
            <FriendCard
              key={result.id}
              id={result.id}
              name={result.full_name}
              avatar={result.avatar_url}
              status="suggestion"
              onAddFriend={handleAddFriend}
            />
          ))}
        </div>
      );
    }

    switch (activeTab) {
      case 'friends':
        return friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map(friend => (
              <FriendCard
                key={friend.id}
                id={friend.friend_id}
                name={friend.friend?.full_name || ''}
                avatar={friend.friend?.avatar_url || ''}
                status="friend"
                onRemoveFriend={handleRemoveFriend}
                onMessage={handleMessage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('social.noFriends')}
          </div>
        );

      case 'suggestions':
        return suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map(suggestion => (
              <FriendCard
                key={suggestion.id}
                id={suggestion.id}
                name={suggestion.full_name}
                avatar={suggestion.avatar_url}
                status="suggestion"
                onAddFriend={handleAddFriend}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('social.noSuggestions')}
          </div>
        );

      case 'requests':
        return pendingRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(request => (
              <FriendCard
                key={request.id}
                id={request.id}
                name={request.friend?.full_name || ''}
                avatar={request.friend?.avatar_url || ''}
                status="pending"
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('social.noFriendRequests')}
          </div>
        );

      case 'sent':
        return sentRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sentRequests.map(request => (
              <FriendCard
                key={request.id}
                id={request.id}
                name={request.friend?.full_name || ''}
                avatar={request.friend?.avatar_url || ''}
                status="sent"
                onCancelRequest={handleCancelRequest}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('social.noSentRequests')}
          </div>
        );

      default:
        return null;
    }
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
          {t('social.friends')}
        </h1>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={t('social.searchUsers')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full p-3 pl-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          {searchQuery && (
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('social.search')
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <div className="mb-6 flex overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center px-4 py-2 rounded-md mr-2 whitespace-nowrap ${
              activeTab === 'friends'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            {t('social.allFriends')} {friends.length > 0 && `(${friends.length})`}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center px-4 py-2 rounded-md mr-2 whitespace-nowrap ${
              activeTab === 'suggestions'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t('social.suggestions')}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center px-4 py-2 rounded-md mr-2 whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            {t('social.requests')} {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center px-4 py-2 rounded-md mr-2 whitespace-nowrap ${
              activeTab === 'sent'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('social.sent')} {sentRequests.length > 0 && `(${sentRequests.length})`}
          </button>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default Friends;
