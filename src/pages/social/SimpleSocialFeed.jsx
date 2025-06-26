import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SimpleModernSocialFeed from '../../components/social/SimpleModernSocialFeed';

const SimpleSocialFeed = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="social-feed-container"
    >
      <div className="container mx-auto px-4 py-6 social-feed-content">
        <div className="mb-4">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold text-gray-800 dark:text-white"
          >
            {t('social.feed')}
          </motion.h1>
        </div>

        {/* Use the simplified modern social feed component */}
        <SimpleModernSocialFeed />
      </div>
    </motion.div>
  );
};

export default SimpleSocialFeed;
