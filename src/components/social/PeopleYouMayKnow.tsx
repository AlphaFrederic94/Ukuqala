import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface UserSuggestion {
  id: string;
  full_name: string;
  avatar_url: string;
  mutual_friends?: number;
  is_friend?: boolean;
}

interface PeopleYouMayKnowProps {
  suggestions: UserSuggestion[];
  onSendFriendRequest: (userId: string) => Promise<void>;
  onIgnoreSuggestion: (userId: string) => void;
}

const PeopleYouMayKnow: React.FC<PeopleYouMayKnowProps> = ({
  suggestions,
  onSendFriendRequest,
  onIgnoreSuggestion
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleSendRequest = async (userId: string) => {
    if (!user) return;
    
    setPendingRequests(prev => ({ ...prev, [userId]: true }));
    
    try {
      await onSendFriendRequest(userId);
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setPendingRequests(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleIgnore = (userId: string) => {
    onIgnoreSuggestion(userId);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/social/profile/${userId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <Users className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t('social.peopleYouMayKnow')}
        </h3>
      </div>
      <div className="p-4">
        <ul className="space-y-4">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="flex items-center justify-between">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => handleProfileClick(suggestion.id)}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-white dark:border-gray-700 shadow-sm">
                  <img
                    src={suggestion.avatar_url || 'https://via.placeholder.com/48'}
                    alt={suggestion.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {suggestion.full_name}
                  </h4>
                  {suggestion.mutual_friends !== undefined && suggestion.mutual_friends > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.mutual_friends} {t('social.mutualFriends')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {suggestion.is_friend ? (
                  <button
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                    disabled
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      onClick={() => handleSendRequest(suggestion.id)}
                      disabled={pendingRequests[suggestion.id]}
                    >
                      {pendingRequests[suggestion.id] ? (
                        <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleIgnore(suggestion.id)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default PeopleYouMayKnow;
