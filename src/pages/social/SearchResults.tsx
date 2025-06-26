import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import UserSearch from '../../components/social/UserSearch';
import EnhancedPostCard from '../../components/social/EnhancedPostCard';
import EnhancedCommentSection from '../../components/social/EnhancedCommentSection';
import { 
  Search, 
  Users, 
  Hash, 
  FileText, 
  Image as ImageIcon,
  Calendar,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Filter
} from 'lucide-react';

const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts' | 'hashtags'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  
  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);
  
  // Perform search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsLoading(false);
      return;
    }
    
    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Search for users
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .ilike('full_name', `%${searchQuery}%`)
          .limit(10);
          
        if (userError) throw userError;
        setUserResults(userData || []);
        
        // Initialize following status
        const initialFollowingStatus: Record<string, boolean> = {};
        userData?.forEach(user => {
          initialFollowingStatus[user.id] = Math.random() > 0.5; // Randomly set following status
        });
        setFollowingStatus(initialFollowingStatus);
        
        // Mock post results
        const mockPostResults = [
          {
            id: 'post1',
            user_id: 'user1',
            user: {
              full_name: 'John Doe',
              avatar_url: '/images/default_user.jpg'
            },
            content: `Just learned about a new ${searchQuery} technique that can improve your sleep quality by 50%! #health #sleep #wellness`,
            image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            likes_count: 42,
            comments_count: 7,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
          },
          {
            id: 'post2',
            user_id: 'user2',
            user: {
              full_name: 'Jane Smith',
              avatar_url: '/images/default_user.jpg'
            },
            content: `Here's a quick and healthy ${searchQuery} recipe that takes only 5 minutes to prepare! #nutrition #breakfast #healthyeating`,
            image_url: null,
            likes_count: 28,
            comments_count: 5,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 days ago
          },
          {
            id: 'post3',
            user_id: 'user3',
            user: {
              full_name: 'Mike Johnson',
              avatar_url: '/images/default_user.jpg'
            },
            content: `Just finished my 30-day ${searchQuery} challenge! Feeling stronger and more energetic than ever. #fitness #challenge #health`,
            image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            likes_count: 56,
            comments_count: 12,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days ago
          }
        ];
        setPostResults(mockPostResults);
        
        // Mock hashtag results
        const mockHashtagResults = [
          { name: `${searchQuery}`, count: 1243 },
          { name: `${searchQuery}tips`, count: 567 },
          { name: `${searchQuery}challenge`, count: 389 },
          { name: `daily${searchQuery}`, count: 256 },
          { name: `${searchQuery}life`, count: 198 }
        ];
        setHashtagResults(mockHashtagResults);
      } catch (err: any) {
        console.error('Error performing search:', err);
        setError(err.message || t('social.errorPerformingSearch'));
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [searchQuery, t]);
  
  // Handle search form submission
  const handleSearch = (query: string) => {
    navigate(`/social/search?q=${encodeURIComponent(query)}`);
  };
  
  // Handle like/unlike
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    // Update local state
    setPostResults(prev => 
      prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              liked_by_user: true, 
              likes_count: (post.likes_count || 0) + 1 
            } 
          : post
      )
    );
  };
  
  const handleUnlike = async (postId: string) => {
    if (!user) return;
    
    // Update local state
    setPostResults(prev => 
      prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              liked_by_user: false, 
              likes_count: Math.max(0, (post.likes_count || 0) - 1) 
            } 
          : post
      )
    );
  };
  
  // Handle comment
  const handleComment = (postId: string) => {
    setActiveCommentPostId(postId);
  };
  
  // Handle share
  const handleShare = (postId: string) => {
    // In a real app, you would implement sharing functionality
    console.log('Sharing post:', postId);
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = (userId: string) => {
    setFollowingStatus(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };
  
  // Get filtered results based on active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'people':
        return { users: userResults, posts: [], hashtags: [] };
      case 'posts':
        return { users: [], posts: postResults, hashtags: [] };
      case 'hashtags':
        return { users: [], posts: [], hashtags: hashtagResults };
      default:
        return { users: userResults, posts: postResults, hashtags: hashtagResults };
    }
  };
  
  const { users, posts, hashtags } = getFilteredResults();
  
  return (
    <NewSocialLayout>
      <div className="space-y-6">
        {/* Search Header */}
        <div className="social-card p-4">
          <button 
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('common.back')}
          </button>
          
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Search className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            {t('social.searchResults')}
          </h1>
          
          <UserSearch 
            placeholder={t('social.searchPeopleTopicsEvents')}
            showFollowButtons={false}
            className="mb-4"
          />
          
          {/* Tabs */}
          <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800">
            <button 
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'all' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              {t('social.all')}
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'people' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('people')}
            >
              <Users className="w-4 h-4 mr-1" />
              {t('social.people')}
              {userResults.length > 0 && (
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2">
                  {userResults.length}
                </span>
              )}
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'posts' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('posts')}
            >
              <FileText className="w-4 h-4 mr-1" />
              {t('social.posts')}
              {postResults.length > 0 && (
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2">
                  {postResults.length}
                </span>
              )}
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'hashtags' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('hashtags')}
            >
              <Hash className="w-4 h-4 mr-1" />
              {t('social.hashtags')}
              {hashtagResults.length > 0 && (
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2">
                  {hashtagResults.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Search Results */}
        {isLoading ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{t('social.searching')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="social-card p-6">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
              <p className="font-medium">{t('common.error')}</p>
              <p className="mt-1">{error}</p>
              <button 
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={() => navigate('/social')}
              >
                {t('social.backToFeed')}
              </button>
            </div>
          </div>
        ) : !searchQuery.trim() ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('social.enterSearchQuery')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {t('social.searchDescription')}
              </p>
            </div>
          </div>
        ) : users.length === 0 && posts.length === 0 && hashtags.length === 0 ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('social.noResultsFound')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {t('social.tryDifferentSearch')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* People Results */}
            {users.length > 0 && (
              <div className="social-card p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <Users className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  {t('social.people')}
                  {activeTab === 'all' && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {users.length} {users.length === 1 ? t('social.result') : t('social.results')}
                    </span>
                  )}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      whileHover={{ y: -5 }}
                      className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/social/profile/${user.id}`)}
                        >
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div 
                          className="ml-3 flex-1 cursor-pointer"
                          onClick={() => navigate(`/social/profile/${user.id}`)}
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white">{user.full_name}</h3>
                          {user.bio && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <button 
                          className={`px-3 py-1 text-sm rounded-full flex items-center ${
                            followingStatus[user.id] 
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          onClick={() => handleFollowToggle(user.id)}
                        >
                          {followingStatus[user.id] ? (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              {t('social.following')}
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              {t('social.follow')}
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {activeTab === 'all' && users.length > 3 && (
                  <div className="mt-4 text-center">
                    <button 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => setActiveTab('people')}
                    >
                      {t('social.viewAllPeople')}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Hashtag Results */}
            {hashtags.length > 0 && (
              <div className="social-card p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <Hash className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  {t('social.hashtags')}
                  {activeTab === 'all' && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {hashtags.length} {hashtags.length === 1 ? t('social.result') : t('social.results')}
                    </span>
                  )}
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {hashtags.map((hashtag, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/social/hashtag/${hashtag.name}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-2">
                        <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">#{hashtag.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hashtag.count} {t('social.posts')}</span>
                    </motion.button>
                  ))}
                </div>
                
                {activeTab === 'all' && hashtags.length > 4 && (
                  <div className="mt-4 text-center">
                    <button 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => setActiveTab('hashtags')}
                    >
                      {t('social.viewAllHashtags')}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Post Results */}
            {posts.length > 0 && (
              <div className="space-y-6">
                {activeTab === 'all' && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    {t('social.posts')}
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {posts.length} {posts.length === 1 ? t('social.result') : t('social.results')}
                    </span>
                  </h2>
                )}
                
                {posts.map((post) => (
                  <EnhancedPostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                    onComment={handleComment}
                    onShare={handleShare}
                    isCommentSectionOpen={activeCommentPostId === post.id}
                  />
                ))}
                
                {activeTab === 'all' && posts.length > 2 && (
                  <div className="text-center">
                    <button 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => setActiveTab('posts')}
                    >
                      {t('social.viewAllPosts')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Comment Modal */}
      <AnimatePresence>
        {activeCommentPostId && (
          <EnhancedCommentSection
            postId={activeCommentPostId}
            onClose={() => setActiveCommentPostId(null)}
          />
        )}
      </AnimatePresence>
    </NewSocialLayout>
  );
};

export default SearchResults;
