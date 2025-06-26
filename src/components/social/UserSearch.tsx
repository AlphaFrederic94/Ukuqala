import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, User, Users, X, UserPlus, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface UserSearchProps {
  onUserSelect?: (user: any) => void;
  placeholder?: string;
  showFollowButtons?: boolean;
  className?: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ 
  onUserSelect, 
  placeholder, 
  showFollowButtons = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentUserSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (err) {
        console.error('Error parsing recent searches:', err);
        setRecentSearches([]);
      }
    }
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .ilike('full_name', `%${query}%`)
          .limit(10);
          
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimeout = setTimeout(() => {
      if (query.trim()) {
        searchUsers();
      }
    }, 300);
    
    return () => clearTimeout(debounceTimeout);
  }, [query]);
  
  // Handle user selection
  const handleUserSelect = (user: any) => {
    // Add to recent searches
    const updatedSearches = [
      user,
      ...recentSearches.filter(item => item.id !== user.id).slice(0, 4)
    ];
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentUserSearches', JSON.stringify(updatedSearches));
    
    // Clear input and results
    setQuery('');
    setResults([]);
    setIsFocused(false);
    
    // Call onUserSelect if provided
    if (onUserSelect) {
      onUserSelect(user);
    } else {
      // Navigate to user profile
      navigate(`/social/profile/${user.id}`);
    }
  };
  
  // Clear recent searches
  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('recentUserSearches');
  };
  
  // Remove a single recent search
  const removeRecentSearch = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const updatedSearches = recentSearches.filter(user => user.id !== userId);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentUserSearches', JSON.stringify(updatedSearches));
  };
  
  // Toggle follow status (placeholder)
  const toggleFollow = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setFollowingStatus(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
    
    // In a real app, you would call a service to follow/unfollow the user
    console.log(`${followingStatus[userId] ? 'Unfollowing' : 'Following'} user:`, userId);
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="social-input pl-10 pr-10"
          placeholder={placeholder || t('social.searchUsers')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (!query.trim() && recentSearches.length > 0) {
              setShowRecent(true);
            }
          }}
        />
        {query && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {isFocused && (query.trim() || showRecent) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('social.searching')}</p>
              </div>
            ) : query.trim() ? (
              results.length > 0 ? (
                <div className="py-2">
                  {results.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{user.full_name.replace(/\s+/g, '').toLowerCase()}</p>
                      </div>
                      {showFollowButtons && (
                        <button
                          className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                            followingStatus[user.id]
                              ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          onClick={(e) => toggleFollow(e, user.id)}
                        >
                          {followingStatus[user.id] ? (
                            <span className="flex items-center">
                              <UserCheck className="w-4 h-4 mr-1" />
                              {t('social.following')}
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <UserPlus className="w-4 h-4 mr-1" />
                              {t('social.follow')}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">{t('social.noUsersFound')}</p>
                </div>
              )
            ) : showRecent && recentSearches.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('social.recentSearches')}</h3>
                  <button 
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={clearRecentSearches}
                  >
                    {t('social.clearAll')}
                  </button>
                </div>
                {recentSearches.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                    </div>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={(e) => removeRecentSearch(e, user.id)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            
            {!isLoading && query.trim() && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  onClick={() => navigate(`/social/search?q=${encodeURIComponent(query)}`)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t('social.searchForQuery', { query })}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSearch;
