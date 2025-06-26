import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import SocialBackground from './SocialBackground';
import { hashtagService } from '../../lib/hashtagService';
import { notificationService } from '../../lib/notificationService';
import {
  Home,
  Users,
  Bell,
  MessageCircle,
  Search,
  Compass,
  Bookmark,
  Settings,
  Menu,
  X,
  ChevronDown,
  Hash,
  Zap,
  BarChart2,
  Calendar,
  Heart,
  Image,
  Smile,
  MapPin,
  AtSign,
  Sun,
  Moon
} from 'lucide-react';

// Import our new social theme
import '../../styles/socialTheme.css';

interface NewSocialLayoutProps {
  children: React.ReactNode;
}

const NewSocialLayout: React.FC<NewSocialLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isLoadingTrendingTopics, setIsLoadingTrendingTopics] = useState(true);

  // Check if dark mode is enabled
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Search for users
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (userError) throw userError;

      // Search for hashtags (in a real app, you'd have a hashtags table)
      const mockHashtags = trendingTopics
        .filter(topic => topic.name.includes(query.toLowerCase()))
        .map(topic => ({
          id: topic.id,
          name: topic.name,
          type: 'hashtag',
          count: topic.count
        }));

      setSearchResults([
        ...(userData || []).map(user => ({ ...user, type: 'user' })),
        ...mockHashtags
      ]);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Load trending topics
  useEffect(() => {
    const loadTrendingTopics = async () => {
      try {
        setIsLoadingTrendingTopics(true);
        const topics = await hashtagService.getTrendingHashtags(5);
        setTrendingTopics(topics);
      } catch (error) {
        console.error('Error loading trending topics:', error);
        // Set default trending topics if there's an error
        setTrendingTopics([
          { id: '1', name: 'health', count: 1243 },
          { id: '2', name: 'wellness', count: 987 },
          { id: '3', name: 'nutrition', count: 756 },
          { id: '4', name: 'fitness', count: 632 },
          { id: '5', name: 'mentalhealth', count: 521 },
        ]);
      } finally {
        setIsLoadingTrendingTopics(false);
      }
    };

    loadTrendingTopics();
  }, []);

  // Load unread notifications count
  useEffect(() => {
    if (!user) return;

    const loadUnreadNotifications = async () => {
      try {
        const count = await notificationService.getUnreadNotificationCount(user.id);
        setUnreadNotifications(count);
      } catch (error) {
        console.error('Error loading unread notifications:', error);
      }
    };

    loadUnreadNotifications();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribeToNotifications(user.id, (notification) => {
      if (!notification.read) {
        setUnreadNotifications(prev => prev + 1);

        // Play notification sound
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.error('Error playing notification sound:', e));
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  // Load suggested users
  useEffect(() => {
    const loadSuggestedUsers = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .neq('id', user.id)
          .limit(5);

        if (error) throw error;

        setSuggestedUsers(data || []);
      } catch (error) {
        console.error('Error loading suggested users:', error);
      }
    };

    loadSuggestedUsers();
  }, [user]);

  // Navigation items
  const navItems = [
    { icon: <Home className="w-6 h-6" />, label: t('social.home'), path: '/social' },
    { icon: <Users className="w-6 h-6" />, label: t('social.friends'), path: '/social/friends' },
    { icon: <MessageCircle className="w-6 h-6" />, label: t('social.messages'), path: '/social/messages', badge: unreadMessages },
    { icon: <Bell className="w-6 h-6" />, label: t('social.notifications'), path: '/social/notifications', badge: unreadNotifications },
    { icon: <Compass className="w-6 h-6" />, label: t('social.explore'), path: '/social/explore' },
    { icon: <Bookmark className="w-6 h-6" />, label: t('social.saved'), path: '/social/saved' },
    { icon: <Settings className="w-6 h-6" />, label: t('social.settings'), path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 transition-colors duration-300 relative">
      <SocialBackground />
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="social-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center ml-2 md:ml-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">CareAI Social</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex relative flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="social-input pl-10"
                  placeholder={t('social.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                />

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {isSearchFocused && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
                      <div className="p-2">
                        {searchResults.map((result) => (
                          <div
                            key={`${result.type}-${result.id}`}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                            onClick={() => {
                              if (result.type === 'user') {
                                navigate(`/social/profile/${result.id}`);
                              } else if (result.type === 'hashtag') {
                                navigate(`/social/hashtag/${result.name}`);
                              }
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                          >
                            {result.type === 'user' ? (
                              <>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                  {result.avatar_url ? (
                                    <img src={result.avatar_url} alt={result.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                      {result.full_name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{result.full_name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('social.user')}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                  <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">#{result.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{result.count} {t('social.posts')}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* User Menu and Actions */}
            <div className="flex items-center">
              <button
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 relative"
                onClick={() => navigate('/social/notifications')}
              >
                <Bell className="w-6 h-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <button
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 relative ml-2"
                onClick={() => navigate('/social/messages')}
              >
                <MessageCircle className="w-6 h-6" />
                {unreadMessages > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </button>

              <button
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ml-2"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>

              <div className="ml-4 relative">
                <button
                  className="flex items-center space-x-2 focus:outline-none"
                  onClick={() => navigate('/profile')}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 p-0.5">
                    <img
                      src={user?.avatar_url || '/images/default_user.jpg'}
                      alt={user?.full_name || 'User'}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.full_name || 'User'}
                  </span>
                  <ChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="px-4 py-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="social-input pl-10"
                  placeholder={t('social.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                />
              </div>

              <nav className="mt-4">
                {navItems.map((item, index) => (
                  <button
                    key={index}
                    className="flex items-center w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mb-1 relative"
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="text-blue-600 dark:text-blue-400">{item.icon}</span>
                    <span className="ml-4 font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="absolute right-4 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="social-container py-6">
        <div className="social-layout">
          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden md:block space-y-6">
            <div className="social-card p-4">
              <nav className="space-y-1">
                {navItems.map((item, index) => (
                  <button
                    key={index}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mb-1 relative ${
                      location.pathname === item.path
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className={location.pathname === item.path ? 'text-blue-600 dark:text-blue-400' : ''}>{item.icon}</span>
                    <span className="ml-4">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="absolute right-4 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="social-card p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-blue-500" />
                {t('social.trendingTopics')}
              </h3>

              {isLoadingTrendingTopics ? (
                <div className="py-4 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : trendingTopics.length > 0 ? (
                <div className="space-y-3">
                  {trendingTopics.map((topic) => (
                    <button
                      key={topic.id}
                      className="flex items-center w-full px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      onClick={() => navigate(`/social/hashtag/${topic.name}`)}
                    >
                      <Hash className="w-4 h-4 text-blue-500" />
                      <span className="ml-2 font-medium">#{topic.name}</span>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{topic.count}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p>{t('social.noTrendingTopics')}</p>
                </div>
              )}

              <button
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
                onClick={() => navigate('/social/explore')}
              >
                {t('social.seeMoreTopics')}
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Right Sidebar - Desktop Only */}
          <aside className="hidden lg:block space-y-6">
            <div className="social-card p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                {t('social.suggestedPeople')}
              </h3>
              <div className="space-y-4">
                {suggestedUsers.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      {suggestedUser.avatar_url ? (
                        <img src={suggestedUser.avatar_url} alt={suggestedUser.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          {suggestedUser.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{suggestedUser.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('social.suggestedForYou')}</p>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                      {t('social.follow')}
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
                onClick={() => navigate('/social/friends')}
              >
                {t('social.seeMorePeople')}
              </button>
            </div>

            <div className="social-card p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                {t('social.upcomingEvents')}
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="bg-blue-500 text-white p-3">
                    <p className="font-semibold">{t('social.healthWebinar')}</p>
                    <p className="text-sm opacity-90">June 15, 2023 • 3:00 PM</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('social.webinarDescription')}
                    </p>
                    <div className="mt-3 flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">12 {t('social.peopleGoing')}</span>
                      <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        {t('social.interested')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
                onClick={() => navigate('/social/events')}
              >
                {t('social.seeAllEvents')}
              </button>
            </div>

            <div className="p-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:underline">{t('common.about')}</a>
                <a href="#" className="hover:underline">{t('common.privacy')}</a>
                <a href="#" className="hover:underline">{t('common.terms')}</a>
                <a href="#" className="hover:underline">{t('common.help')}</a>
              </div>
              <p className="mt-2">© 2023 CareAI Social. {t('common.allRightsReserved')}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default NewSocialLayout;
