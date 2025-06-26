import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, X, MessageSquare, UserPlus, Check, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { supabase } from '../../lib/supabaseClient';

const UserSearch = ({ onSelect }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [friendships, setFriendships] = useState({});

  const searchRef = useRef(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Try Firebase first
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

      // Try Supabase if Firebase search fails or returns no results
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, blood_group, date_of_birth')
        .or(`full_name.ilike.%${query}%, email.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }

      setSearchResults(data || []);

      // Get friendship status for each user
      if (data && data.length > 0) {
        const friendshipData = {};

        // Try Firebase first
        try {
          for (const searchUser of data) {
            const status = await socialService.getFriendshipStatus(user.id, searchUser.id);
            friendshipData[searchUser.id] = status;
          }
        } catch (firebaseError) {
          console.error('Error getting Firebase friendships:', firebaseError);

          // Try Supabase if Firebase fails
          try {
            const { data: friendshipResults, error: friendshipError } = await supabase
              .from('user_friendships')
              .select('friend_id, status')
              .eq('user_id', user.id)
              .in('friend_id', data.map(u => u.id));

            if (!friendshipError && friendshipResults) {
              friendshipResults.forEach(fs => {
                friendshipData[fs.friend_id] = fs.status;
              });
            }

            // Check reverse friendships (where the user is the friend)
            const { data: reverseFriendships, error: reverseError } = await supabase
              .from('user_friendships')
              .select('user_id, status')
              .eq('friend_id', user.id)
              .in('user_id', data.map(u => u.id));

            if (!reverseError && reverseFriendships) {
              reverseFriendships.forEach(fs => {
                friendshipData[fs.user_id] = fs.status === 'pending' ? 'received' : fs.status;
              });
            }
          } catch (supabaseError) {
            console.error('Error getting Supabase friendships:', supabaseError);
          }
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
    setIsOpen(false);
  };

  // Start a chat with user
  const startChat = async (userId) => {
    try {
      // Get user details from search results
      let selectedUser = searchResults.find(user => user.id === userId);

      // If user not found in search results, try to get from Firebase
      if (!selectedUser && typeof socialService.getUserById === 'function') {
        try {
          console.log("Fetching user from Firebase:", userId);
          const firebaseUser = await socialService.getUserById(userId);
          if (firebaseUser) {
            selectedUser = {
              id: userId,
              ...firebaseUser
            };
          }
        } catch (firebaseError) {
          console.error("Error fetching user from Firebase:", firebaseError);
        }
      }

      // If still not found, try Supabase
      if (!selectedUser) {
        try {
          console.log("Fetching user from Supabase:", userId);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (!error && data) {
            selectedUser = data;
          }
        } catch (supabaseError) {
          console.error("Error fetching user from Supabase:", supabaseError);
        }
      }

      // If onSelect prop is provided, use it to select the user
      if (onSelect && selectedUser) {
        console.log("Selecting user:", selectedUser);
        onSelect(selectedUser);
        setIsOpen(false);
        return;
      }

      // Default behavior - navigate to messages
      navigate(`/social/messages/${userId}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Send friend request
  const sendFriendRequest = async (userId) => {
    try {
      // Try Firebase first
      try {
        await socialService.sendFriendRequest(user.id, userId);
        setFriendships(prev => ({ ...prev, [userId]: 'pending' }));
        return;
      } catch (firebaseError) {
        console.error('Error sending Firebase friend request:', firebaseError);
      }

      // Try Supabase if Firebase fails
      const { error } = await supabase
        .from('user_friendships')
        .insert({
          user_id: user.id,
          friend_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      setFriendships(prev => ({ ...prev, [userId]: 'pending' }));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div
        className="flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {t('social.searchUsers')}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={t('social.searchByNameOrEmail')}
                  className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 pr-10 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((result) => (
                    <div key={result.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center justify-between">
                      <div className="flex items-center cursor-pointer" onClick={() => viewUserProfile(result.id)}>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                          <img
                            src={result.avatar_url || result.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.full_name || result.displayName || 'User')}&background=random`}
                            alt={result.full_name || result.displayName || 'User'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {result.full_name || result.displayName || 'User'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => startChat(result.id)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                          title={t('social.message')}
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>

                        {!friendships[result.id] && (
                          <button
                            onClick={() => sendFriendRequest(result.id)}
                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                            title={t('social.addFriend')}
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        )}

                        {friendships[result.id] === 'pending' && (
                          <button
                            className="p-2 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full cursor-not-allowed"
                            title={t('social.requestPending')}
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                        )}

                        {friendships[result.id] === 'accepted' && (
                          <button
                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full cursor-not-allowed"
                            title={t('social.alreadyFriends')}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  {t('social.noUsersFound')}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSearch;
