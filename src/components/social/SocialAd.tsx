import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, Info } from 'lucide-react';

interface SocialAdProps {
  ad: {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    user?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
    created_at: string;
    expires_at?: string;
  };
}

const SocialAd: React.FC<SocialAdProps> = ({ ad }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 relative"
    >
      <div className="absolute top-2 right-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full flex items-center">
        <Info className="w-3 h-3 mr-1" />
        {t('social.sponsored')}
      </div>
      
      {ad.image_url && (
        <div className="w-full h-40 bg-gray-100 dark:bg-gray-700">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
          {ad.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {ad.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {ad.user && (
              <>
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                  <img
                    src={ad.user.avatar_url || 'https://via.placeholder.com/32'}
                    alt={ad.user.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {ad.user.full_name}
                </span>
              </>
            )}
          </div>
          
          <button className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
            {t('social.learnMore')}
            <ExternalLink className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SocialAd;
