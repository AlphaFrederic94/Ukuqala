import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  User, Calendar, Droplet, Mail, Phone, MapPin,
  MessageSquare, UserPlus, UserCheck, UserX, ArrowLeft,
  Loader2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try Firebase first
        try {
          const firebaseProfile = await socialService.getUserById(userId);
          if (firebaseProfile) {
            setProfile({
              id: firebaseProfile.id,
              full_name: firebaseProfile.displayName,
              email: firebaseProfile.email,
              avatar_url: firebaseProfile.photoURL,
              // These fields might not be available in Firebase
              blood_group: firebaseProfile.bloodGroup,
              date_of_birth: firebaseProfile.dateOfBirth,
              phone: firebaseProfile.phone,
              address: firebaseProfile.address
            });

            // Get friendship status
            const status = await socialService.getFriendshipStatus(user.id, userId);
            setFriendshipStatus(status);

            setLoading(false);
            return;
          }
        } catch (firebaseError) {
          console.error('Error fetching Firebase profile:', firebaseError);
        }

        // Try Supabase if Firebase fails or returns no profile
        // Only select columns that exist in the profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, created_at')
          .eq('id', userId)
          .single();

        if (error) throw error;

        setProfile(data);

        // Get friendship status from Supabase
        const { data: friendship, error: friendshipError } = await supabase
          .from('user_friendships')
          .select('status')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
          .maybeSingle();

        if (!friendshipError && friendship) {
          // If the current user is the friend, and status is pending, it means they received a request
          if (friendship.status === 'pending' && friendship.friend_id === user.id) {
            setFriendshipStatus('received');
          } else {
            setFriendshipStatus(friendship.status);
          }
        } else {
          setFriendshipStatus(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(t('social.errorFetchingProfile'));
      } finally {
        setLoading(false);
      }
    };

    if (userId && user) {
      fetchUserProfile();
    }
  }, [userId, user, socialService, t]);

  // Handle friend request
  const handleFriendRequest = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Try Firebase first
      try {
        await socialService.sendFriendRequest(user.id, userId);
        setFriendshipStatus('pending');
        setIsProcessing(false);
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

      setFriendshipStatus('pending');
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError(t('social.errorSendingFriendRequest'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Accept friend request
  const acceptFriendRequest = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Try Firebase first
      try {
        await socialService.acceptFriendRequest(userId, user.id);
        setFriendshipStatus('accepted');
        setIsProcessing(false);
        return;
      } catch (firebaseError) {
        console.error('Error accepting Firebase friend request:', firebaseError);
      }

      // Try Supabase if Firebase fails
      const { error } = await supabase
        .from('user_friendships')
        .update({ status: 'accepted' })
        .eq('user_id', userId)
        .eq('friend_id', user.id);

      if (error) throw error;

      setFriendshipStatus('accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError(t('social.errorAcceptingFriendRequest'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Start chat
  const startChat = () => {
    navigate(`/social/messages/${userId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {t('social.errorOccurred')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.goBack')}
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <User className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {t('social.userNotFound')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('social.userProfileNotFound')}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.goBack')}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('common.goBack')}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Profile header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-700">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=random&size=128`}
                alt={profile.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Profile actions */}
        <div className="flex justify-end px-8 pt-4 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={startChat}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {t('social.message')}
            </button>

            {!friendshipStatus && (
              <button
                onClick={handleFriendRequest}
                disabled={isProcessing}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5 mr-2" />
                )}
                {t('social.addFriend')}
              </button>
            )}

            {friendshipStatus === 'pending' && (
              <button
                disabled
                className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg opacity-70 cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {t('social.requestSent')}
              </button>
            )}

            {friendshipStatus === 'received' && (
              <button
                onClick={acceptFriendRequest}
                disabled={isProcessing}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="w-5 h-5 mr-2" />
                )}
                {t('social.acceptRequest')}
              </button>
            )}

            {friendshipStatus === 'accepted' && (
              <button
                disabled
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg opacity-70 cursor-not-allowed"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                {t('social.friends')}
              </button>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="px-8 pt-16 pb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {profile.full_name || 'User'}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {profile.email && (
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('profile.email')}
                  </div>
                  <div className="text-gray-800 dark:text-gray-200">
                    {profile.email}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('profile.joinedOn')}
                </div>
                <div className="text-gray-800 dark:text-gray-200">
                  {formatDate(profile.created_at)}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </motion.div>
  );
};

export default UserProfilePage;
