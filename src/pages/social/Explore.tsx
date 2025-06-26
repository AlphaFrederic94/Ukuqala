import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import UserSearch from '../../components/social/UserSearch';
import {
  Compass,
  BarChart2,
  Users,
  Hash,
  Calendar,
  Image as ImageIcon,
  Grid,
  Search,
  MapPin,
  Globe,
  UserPlus
} from 'lucide-react';

const Explore: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  // Load mock data
  useEffect(() => {
    // Mock trending topics
    const mockTrendingTopics = [
      { id: 1, name: 'health', count: 1243 },
      { id: 2, name: 'wellness', count: 987 },
      { id: 3, name: 'nutrition', count: 756 },
      { id: 4, name: 'fitness', count: 632 },
      { id: 5, name: 'mentalhealth', count: 521 },
      { id: 6, name: 'selfcare', count: 489 },
      { id: 7, name: 'mindfulness', count: 412 },
      { id: 8, name: 'healthcare', count: 387 },
      { id: 9, name: 'medicine', count: 356 },
      { id: 10, name: 'doctor', count: 298 },
    ];

    // Mock suggested users
    const mockSuggestedUsers = [
      { id: 'user1', full_name: 'John Doe', avatar_url: '/images/default_user.jpg', bio: 'Health enthusiast and fitness coach' },
      { id: 'user2', full_name: 'Jane Smith', avatar_url: '/images/default_user.jpg', bio: 'Nutritionist and wellness expert' },
      { id: 'user3', full_name: 'Mike Johnson', avatar_url: '/images/default_user.jpg', bio: 'Medical doctor specializing in cardiology' },
      { id: 'user4', full_name: 'Sarah Williams', avatar_url: '/images/default_user.jpg', bio: 'Mental health advocate and therapist' },
      { id: 'user5', full_name: 'David Brown', avatar_url: '/images/default_user.jpg', bio: 'Yoga instructor and meditation guide' },
    ];

    // Mock trending posts
    const mockTrendingPosts = [
      {
        id: 'post1',
        user_name: 'John Doe',
        user_avatar: '/images/default_user.jpg',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        likes_count: 245,
        comments_count: 32
      },
      {
        id: 'post2',
        user_name: 'Jane Smith',
        user_avatar: '/images/default_user.jpg',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        likes_count: 189,
        comments_count: 24
      },
      {
        id: 'post3',
        user_name: 'Mike Johnson',
        user_avatar: '/images/default_user.jpg',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        likes_count: 156,
        comments_count: 18
      },
      {
        id: 'post4',
        user_name: 'Sarah Williams',
        user_avatar: '/images/default_user.jpg',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        likes_count: 132,
        comments_count: 15
      },
      {
        id: 'post5',
        user_name: 'David Brown',
        user_avatar: '/images/default_user.jpg',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        likes_count: 118,
        comments_count: 12
      },
      {
        id: 'post6',
        user_name: 'Emily Davis',
        user_avatar: '/images/default_user.jpg',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        likes_count: 105,
        comments_count: 9
      },
    ];

    // Mock upcoming events
    const mockUpcomingEvents = [
      {
        id: 'event1',
        title: 'Health & Wellness Webinar',
        date: '2023-06-15T15:00:00Z',
        location: 'Online',
        attendees_count: 156
      },
      {
        id: 'event2',
        title: 'Nutrition Workshop',
        date: '2023-06-20T10:00:00Z',
        location: 'Community Center',
        attendees_count: 89
      },
      {
        id: 'event3',
        title: 'Mental Health Awareness Day',
        date: '2023-06-25T09:00:00Z',
        location: 'City Park',
        attendees_count: 213
      }
    ];

    // Set state with mock data
    setTimeout(() => {
      setTrendingTopics(mockTrendingTopics);
      setSuggestedUsers(mockSuggestedUsers);
      setTrendingPosts(mockTrendingPosts);
      setUpcomingEvents(mockUpcomingEvents);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <NewSocialLayout>
        <div className="social-card p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">{t('social.loadingExplore')}</p>
          </div>
        </div>
      </NewSocialLayout>
    );
  }

  return (
    <NewSocialLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="social-card p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Compass className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              {t('social.explore')}
            </h1>
          </div>

          {/* Search */}
          <div className="mt-4">
            <UserSearch
              placeholder={t('social.searchPeopleTopicsEvents')}
              showFollowButtons={true}
            />
          </div>
        </div>

        {/* Trending Topics */}
        <div className="social-card p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <BarChart2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('social.trendingTopics')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {trendingTopics.map((topic) => (
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-shadow"
                onClick={() => navigate(`/social/hashtag/${topic.name}`)}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-2">
                  <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">#{topic.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{topic.count} {t('social.posts')}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Suggested Users */}
        <div className="social-card p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Users className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('social.suggestedPeople')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {suggestedUsers.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ y: -5 }}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{user.full_name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{user.bio}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors flex items-center"
                    onClick={() => navigate(`/social/profile/${user.id}`)}
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    {t('social.follow')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => navigate('/social/friends')}
            >
              {t('social.seeMorePeople')}
            </button>
          </div>
        </div>

        {/* Trending Posts */}
        <div className="social-card p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('social.trendingPosts')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {trendingPosts.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
                onClick={() => navigate(`/social/post/${post.id}`)}
              >
                <img
                  src={post.image_url}
                  alt={post.user_name}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={post.user_avatar}
                        alt={post.user_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="ml-2 text-white text-sm font-medium">{post.user_name}</span>
                  </div>

                  <div className="flex items-center mt-2 text-white text-xs">
                    <span className="flex items-center mr-3">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                      </svg>
                      {post.likes_count}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                      </svg>
                      {post.comments_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="social-card p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Calendar className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('social.upcomingEvents')}
          </h2>

          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -2 }}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900 dark:text-white text-lg">{event.title}</h3>

                <div className="mt-2 flex items-center text-gray-600 dark:text-gray-400 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {new Date(event.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="mt-1 flex items-center text-gray-600 dark:text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{event.location}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {event.attendees_count} {t('social.peopleGoing')}
                  </span>

                  <button
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    onClick={() => navigate(`/social/event/${event.id}`)}
                  >
                    {t('social.interested')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => navigate('/social/events')}
            >
              {t('social.seeAllEvents')}
            </button>
          </div>
        </div>
      </div>
    </NewSocialLayout>
  );
};

export default Explore;
