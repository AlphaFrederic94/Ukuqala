import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';

interface SuggestedUser {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  mutualFriends?: number;
  isFollowing?: boolean;
}

const SuggestedUsers: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const fetchedUsers = await socialService.getSuggestedUsers(user.id, 5);
        setUsers(fetchedUsers);
        
        // Initialize following status
        const statusMap: Record<string, boolean> = {};
        fetchedUsers.forEach(u => {
          statusMap[u.id] = u.isFollowing || false;
        });
        setFollowingStatus(statusMap);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        // Set some fallback users
        const fallbackUsers = [
          {
            id: '1',
            name: 'Dr. Sarah Johnson',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            bio: 'Cardiologist at Mayo Clinic',
            mutualFriends: 3,
            isFollowing: false
          },
          {
            id: '2',
            name: 'Dr. Michael Chen',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            bio: 'Neurologist at Johns Hopkins',
            mutualFriends: 5,
            isFollowing: false
          },
          {
            id: '3',
            name: 'Dr. Emily Rodriguez',
            avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
            bio: 'Pediatrician at Children\'s Hospital',
            mutualFriends: 2,
            isFollowing: false
          }
        ];
        
        setUsers(fallbackUsers);
        
        // Initialize following status for fallback users
        const statusMap: Record<string, boolean> = {};
        fallbackUsers.forEach(u => {
          statusMap[u.id] = u.isFollowing || false;
        });
        setFollowingStatus(statusMap);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, [user, socialService]);
  
  const handleFollow = async (userId: string) => {
    if (!user || isProcessing[userId]) return;
    
    try {
      setIsProcessing(prev => ({ ...prev, [userId]: true }));
      
      if (followingStatus[userId]) {
        // Unfollow
        await socialService.unfollowUser(user.id, userId);
        
        // Update state
        setFollowingStatus(prev => ({ ...prev, [userId]: false }));
      } else {
        // Follow
        await socialService.followUser(user.id, userId);
        
        // Update state
        setFollowingStatus(prev => ({ ...prev, [userId]: true }));
        
        // Play sound effect
        const audio = new Audio('/sounds/follow.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.error('Error playing sound:', e));
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center">
          <Users className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {t('social.suggestedUsers')}
          </h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (!users || users.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center">
        <Users className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {t('social.suggestedUsers')}
        </h3>
      </div>
      
      <div className="p-3">
        {users.map((suggestedUser, index) => (
          <motion.div
            key={suggestedUser.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg transition-colors"
          >
            <Link
              to={`/social/profile/${suggestedUser.id}`}
              className="flex items-center flex-grow"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100 dark:border-blue-900">
                <img
                  src={suggestedUser.avatar}
                  alt={suggestedUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3">
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {suggestedUser.name}
                </div>
                {suggestedUser.bio && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {suggestedUser.bio}
                  </div>
                )}
                {suggestedUser.mutualFriends !== undefined && suggestedUser.mutualFriends > 0 && (
                  <div className="text-xs text-blue-500 mt-0.5">
                    {t('social.mutualFriends', { count: suggestedUser.mutualFriends })}
                  </div>
                )}
              </div>
            </Link>
            
            <button
              onClick={() => handleFollow(suggestedUser.id)}
              disabled={isProcessing[suggestedUser.id]}
              className={`ml-2 flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                followingStatus[suggestedUser.id]
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors`}
            >
              {isProcessing[suggestedUser.id] ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : followingStatus[suggestedUser.id] ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  {t('social.following')}
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 mr-1" />
                  {t('social.follow')}
                </>
              )}
            </button>
          </motion.div>
        ))}
        
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/social/discover"
            className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex justify-center py-1"
          >
            {t('social.discoverMore')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsers;
