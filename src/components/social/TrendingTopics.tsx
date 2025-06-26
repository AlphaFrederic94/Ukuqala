import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Hash, Loader2 } from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';

interface TrendingTopic {
  id?: number;
  name?: string;
  tag?: string;
  count: number;
  percentChange?: number;
}

interface TrendingTopicsProps {
  topics?: TrendingTopic[];
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ topics: propTopics }) => {
  const { t } = useTranslation();
  const { socialService } = useFirebase();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<TrendingTopic[]>(propTopics || []);
  const [isLoading, setIsLoading] = useState(!propTopics);

  useEffect(() => {
    // If topics are provided as props, use them
    if (propTopics && propTopics.length > 0) {
      setTopics(propTopics);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch them
    const fetchTrendingTopics = async () => {
      try {
        setIsLoading(true);
        const fetchedTopics = await socialService.getTrendingHashtags(10);
        setTopics(fetchedTopics);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
        // Set some fallback topics
        setTopics([
          { tag: '#medicine', count: 128, percentChange: 24 },
          { tag: '#cardiology', count: 96, percentChange: 15 },
          { tag: '#research', count: 87, percentChange: 8 },
          { tag: '#neurology', count: 76, percentChange: 12 },
          { tag: '#pediatrics', count: 65, percentChange: -3 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingTopics();
  }, [socialService, propTopics]);

  const handleTopicClick = (topic: TrendingTopic) => {
    // Get the tag from either name or tag property
    const tagText = topic.tag || topic.name || '';

    // Remove the # if it exists
    const cleanTag = tagText.startsWith('#') ? tagText.substring(1) : tagText;
    navigate(`/social/hashtag/${cleanTag}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center">
          <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {t('social.trendingTopics')}
          </h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center">
        <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {t('social.trendingTopics')}
        </h3>
      </div>

      <div className="p-3">
        {topics.map((topic, index) => {
          // Get the tag from either name or tag property
          const tagText = topic.tag || topic.name || '';

          return (
            <motion.div
              key={topic.id || tagText || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => handleTopicClick(topic)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {tagText.startsWith('#') ? tagText : `#${tagText}`}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                    {topic.count}
                  </span>
                  {topic.percentChange !== undefined && (
                    <span className={`text-xs ${
                      topic.percentChange > 0
                        ? 'text-green-500'
                        : topic.percentChange < 0
                          ? 'text-red-500'
                          : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {topic.percentChange > 0 ? '+' : ''}
                      {topic.percentChange}%
                    </span>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}

        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/social/trending"
            className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex justify-center py-1"
          >
            {t('social.seeAllTrending')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default TrendingTopics;
