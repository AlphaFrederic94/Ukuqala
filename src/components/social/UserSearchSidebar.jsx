import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Search, User, MessageSquare, UserPlus,
  Clock, Check, Loader2, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { supabase } from '../../lib/supabaseClient';

const UserSearchSidebar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [friendships, setFriendships] = useState({});

  // Load suggested users on component mount
  useEffect(() => {
    if (!user) return;

    const loadSuggestedUsers = async () => {
      setIsLoadingSuggestions(true);

      try {
        // Try Firebase first if the getSuggestedUsers function exists
        if (typeof socialService.getSuggestedUsers === 'function') {
          try {
            const firebaseUsers = await socialService.getSuggestedUsers(user.id, 5);
            if (firebaseUsers && firebaseUsers.length > 0) {
              setSuggestedUsers(firebaseUsers);

              // Get friendship status for each user if the function exists
              if (typeof socialService.getFriendshipStatus === 'function') {
                const friendshipData = {};
                for (const suggestedUser of firebaseUsers) {
                  try {
                    const status = await socialService.getFriendshipStatus(user.id, suggestedUser.id);
                    friendshipData[suggestedUser.id] = status;
                  } catch (statusError) {
                    console.error('Error getting friendship status:', statusError);
                  }
                }
                setFriendships(friendshipData);
              }

              setIsLoadingSuggestions(false);
              return;
            }
          } catch (error) {
            console.error('Error loading Firebase suggested users:', error);
          }
        }

        // Try Supabase if Firebase fails
        // Only select columns that exist in the profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .neq('id', user?.id || '0')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        setSuggestedUsers(data || []);

        // Get friendship status for each user
        if (data && data.length > 0) {
          const friendshipData = {};

          // Try Supabase
          try {
            if (data && data.length > 0) {
              const { data: friendshipResults, error: friendshipError } = await supabase
                .from('user_friendships')
                .select('friend_id, status')
                .eq('user_id', user?.id || '0')
                .in('friend_id', data.map(u => u.id || '0'));

              if (!friendshipError && friendshipResults) {
                friendshipResults.forEach(fs => {
                  if (fs && fs.friend_id) {
                    friendshipData[fs.friend_id] = fs.status;
                  }
                });
              }

              // Check reverse friendships (where the user is the friend)
              const { data: reverseFriendships, error: reverseError } = await supabase
                .from('user_friendships')
                .select('user_id, status')
                .eq('friend_id', user?.id || '0')
                .in('user_id', data.map(u => u.id || '0'));

              if (!reverseError && reverseFriendships) {
                reverseFriendships.forEach(fs => {
                  if (fs && fs.user_id) {
                    friendshipData[fs.user_id] = fs.status === 'pending' ? 'received' : fs.status;
                  }
                });
              }
            }
          } catch (supabaseError) {
            console.error('Error getting Supabase friendships:', supabaseError);
          }

          setFriendships(friendshipData);
        }
      } catch (error) {
        console.error('Error loading suggested users:', error);
        setSuggestedUsers([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSuggestedUsers();
  }, [user, socialService]);

  // Search for users
  const searchUsers = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Try Firebase first if the searchUsers function exists
      if (typeof socialService.searchUsers === 'function') {
        try {
          const firebaseUsers = await socialService.searchUsers(query);
          if (firebaseUsers && firebaseUsers.length > 0) {
            setSearchResults(firebaseUsers);
            setIsSearching(false);
            return;
          }
        } catch (error) {
          console.error('Error searching Firebase users:', error);
        }
      }

      // Try Supabase if Firebase search fails or returns no results
      // Use safer query syntax to avoid SQL injection and 400 errors
      // Only select columns that exist in the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .or(`full_name.ilike.%${query.replace(/[%_]/g, '\\$&')}%,email.ilike.%${query.replace(/[%_]/g, '\\$&')}%`)
        .neq('id', user?.id || '0')
        .limit(5);

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }

      setSearchResults(data || []);

      // Get friendship status for each user
      if (data && data.length > 0) {
        const friendshipData = { ...friendships };

        // Try Supabase
        try {
          const { data: friendshipResults, error: friendshipError } = await supabase
            .from('user_friendships')
            .select('friend_id, status')
            .eq('user_id', user?.id || '0')
            .in('friend_id', data.map(u => u.id || '0'));

          if (!friendshipError && friendshipResults) {
            friendshipResults.forEach(fs => {
              if (fs && fs.friend_id) {
                friendshipData[fs.friend_id] = fs.status;
              }
            });
          }

          // Check reverse friendships (where the user is the friend)
          const { data: reverseFriendships, error: reverseError } = await supabase
            .from('user_friendships')
            .select('user_id, status')
            .eq('friend_id', user?.id || '0')
            .in('user_id', data.map(u => u.id || '0'));

          if (!reverseError && reverseFriendships) {
            reverseFriendships.forEach(fs => {
              if (fs && fs.user_id) {
                friendshipData[fs.user_id] = fs.status === 'pending' ? 'received' : fs.status;
              }
            });
          }
        } catch (supabaseError) {
          console.error('Error getting Supabase friendships:', supabaseError);
        }

        setFriendships(friendshipData);
      }
    } catch (error) {
      console.error('Error in searchUsers:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  // View user profile
  const viewUserProfile = (userId) => {
    navigate(`/social/profile/${userId}`);
  };

  // Start a chat with user
  const startChat = (userId) => {
    navigate(`/social/messages/${userId}`);
  };

  // Send friend request
  const sendFriendRequest = async (userId) => {
    try {
      // Try Firebase first if the function exists
      if (typeof socialService.sendFriendRequest === 'function') {
        try {
          await socialService.sendFriendRequest(user.id, userId);
          setFriendships(prev => ({ ...prev, [userId]: 'pending' }));
          return;
        } catch (firebaseError) {
          console.error('Error sending Firebase friend request:', firebaseError);
        }
      }

      // Try Supabase if Firebase fails
      const { error } = await supabase
        .from('user_friendships')
        .insert({
          user_id: user?.id,
          friend_id: userId,
          status: 'pending'
        });

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      setFriendships(prev => ({ ...prev, [userId]: 'pending' }));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  // Render user card
  const renderUserCard = (userItem) => {
    return (
      <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg">
        <div
          className="flex items-center cursor-pointer flex-grow"
          onClick={() => viewUserProfile(userItem.id)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            <img
              src={userItem.avatar_url || userItem.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.full_name || userItem.displayName || 'User')}&background=random`}
              alt={userItem.full_name || userItem.displayName || 'User'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.full_name || userItem.displayName || 'User')}&background=random`;
              }}
            />
          </div>
          <div className="ml-3 overflow-hidden">
            <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {userItem.full_name || userItem.displayName || 'User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userItem.email || userItem.specialty || userItem.bio || t('social.activePoster')}
            </div>
          </div>
        </div>

        <div className="flex space-x-1 ml-2">
          <button
            onClick={() => startChat(userItem.id)}
            className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
            title={t('social.message')}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {!friendships[userItem.id] && (
            <button
              onClick={() => sendFriendRequest(userItem.id)}
              className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
              title={t('social.addFriend')}
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}

          {friendships[userItem.id] === 'pending' && (
            <button
              className="p-1 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full cursor-not-allowed"
              title={t('social.requestPending')}
            >
              <Clock className="w-4 h-4" />
            </button>
          )}

          {friendships[userItem.id] === 'accepted' && (
            <button
              className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full cursor-not-allowed"
              title={t('social.alreadyFriends')}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center mb-3">
        <User className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {t('social.findPeople')}
        </h3>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={t('social.searchByNameOrEmail')}
          className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 pr-10 text-gray-800 dark:text-gray-200 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery ? (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </div>

      {/* Search results */}
      {searchQuery.trim().length >= 2 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('social.searchResults')}
          </h4>

          {isSearching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div key={result.id}>{renderUserCard(result)}</div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
              {t('social.noUsersFound')}
            </div>
          )}
        </div>
      )}

      {/* Suggested users */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {searchQuery.trim().length >= 2 ? t('social.otherPeople') : t('social.suggestedUsers')}
        </h4>

        {isLoadingSuggestions ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : suggestedUsers.length > 0 ? (
          <div className="space-y-2">
            {suggestedUsers.map((suggestedUser) => (
              <div key={suggestedUser.id}>{renderUserCard(suggestedUser)}</div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
            {t('social.noSuggestedUsers')}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearchSidebar;
