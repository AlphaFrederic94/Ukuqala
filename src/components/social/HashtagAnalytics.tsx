import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { hashtagService } from '../../lib/hashtagService';
import { Loader2, TrendingUp, Hash } from 'lucide-react';

interface HashtagData {
  id: string;
  name: string;
  count: number;
}

const HashtagAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [hashtags, setHashtags] = useState<HashtagData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        setIsLoading(true);
        const data = await hashtagService.getHashtagAnalytics(20);
        setHashtags(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching hashtag analytics:', err);
        setError(t('social.errorFetchingHashtags'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHashtags();
  }, [t]);

  // Calculate max count for scaling
  const maxCount = Math.max(...hashtags.map(tag => tag.count), 1);

  // Generate a color based on count (higher count = more intense color)
  const getTagColor = (count: number) => {
    const intensity = Math.min(0.3 + (count / maxCount) * 0.7, 1);
    return `rgba(59, 130, 246, ${intensity})`;
  };

  // Calculate font size based on count (higher count = larger font)
  const getTagSize = (count: number) => {
    const minSize = 0.8;
    const maxSize = 1.8;
    const size = minSize + ((count / maxCount) * (maxSize - minSize));
    return `${size}rem`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('social.hashtagAnalytics')}
          </h3>
        </div>
      </div>

      <div className="p-4">
        {hashtags.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            {t('social.noHashtagsFound')}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            {hashtags.map((tag) => (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative group"
              >
                <a
                  href={`/social/hashtag/${tag.name}`}
                  className="inline-flex items-center rounded-full px-3 py-1 transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: getTagColor(tag.count),
                    fontSize: getTagSize(tag.count),
                    color: 'white',
                  }}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag.name}
                </a>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {tag.count} {tag.count === 1 ? t('social.post') : t('social.posts')}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagAnalytics;
