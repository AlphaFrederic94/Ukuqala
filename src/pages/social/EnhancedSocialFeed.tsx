import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';

// Import modern components
import ModernSocialFeed from '../../components/social/ModernSocialFeed';
import TrendingTopics from '../../components/social/TrendingTopics';
import SuggestedUsers from '../../components/social/SuggestedUsers';
import HealthNewsWidget from '../../components/social/HealthNewsWidget';
import SocialAd from '../../components/social/SocialAd';

// Import styles
import '../../styles/socialFeed.css';
import '../../styles/healthNewsWidget.css';

const EnhancedSocialFeed: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  
  // State for social ads
  const [socialAds, setSocialAds] = useState<any[]>([]);
  
  // Check if profile exists
  const checkProfileExists = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Checking if profile exists for user:', user.id);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profileData) {
        console.log('Creating profile for user:', user.id);
        await supabase.from('profiles').insert([
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0) || 'U'}&background=random`,
            email: user.email
          }
        ]);
      } else {
        console.log('User profile exists:', profileData);
      }
    } catch (error) {
      console.error('Error checking/creating profile:', error);
    }
  }, [user]);

  // Fetch social ads
  const fetchSocialAds = useCallback(async () => {
    if (!user) return;

    try {
      // Mock ads for now
      setSocialAds([
        {
          id: 1,
          title: 'Health Checkup',
          description: 'Schedule your annual health checkup today',
          image_url: 'https://via.placeholder.com/300x200?text=Health+Checkup',
          link: '/appointments'
        }
      ]);
    } catch (error) {
      console.error('Error in fetchSocialAds:', error);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (user) {
      console.log('Loading social feed data for user:', user.id);
      fetchSocialAds();
      checkProfileExists();
    }
  }, [user, fetchSocialAds, checkProfileExists]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="social-feed-container"
    >
      <div className="container mx-auto px-4 py-6 social-feed-content">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="w-full lg:w-3/4">
            <div className="mb-4">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold text-gray-800 dark:text-white"
              >
                {t('social.feed')}
              </motion.h1>
            </div>
            
            {/* Modern Social Feed */}
            <ModernSocialFeed />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-1/4 space-y-6">
            {/* Suggested Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SuggestedUsers />
            </motion.div>
            
            {/* Social Ads */}
            {socialAds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SocialAd ad={socialAds[0]} />
              </motion.div>
            )}

            {/* Health News Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <HealthNewsWidget />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedSocialFeed;
