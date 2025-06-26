import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import EnhancedPostCard from '../../components/social/EnhancedPostCard';
import EnhancedCommentSection from '../../components/social/EnhancedCommentSection';
import { Bookmark, Grid, List, Trash2, Filter, Search } from 'lucide-react';

const SavedPosts: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'images' | 'text'>('all');

  // Import Firebase services
  const { socialService } = useFirebase();

  // Load saved posts from Firebase
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Get saved posts from Firebase
        const savedPostIds = await socialService.getSavedPostIds(user.id);

        if (savedPostIds.length === 0) {
          setSavedPosts([]);
          setIsLoading(false);
          return;
        }

        // Fetch full post data for each saved post
        const postsData = await Promise.all(
          savedPostIds.map(async (savedPost) => {
            const post = await socialService.getPostById(savedPost.postId);
            const userData = await socialService.getUserById(post.userId);

            // Check if the current user has liked this post
            const isLiked = await socialService.checkIfLiked(post.id, user.id);

            return {
              ...post,
              user: userData,
              liked_by_user: isLiked,
              saved_at: savedPost.savedAt
            };
          })
        );

        // Sort by saved date (newest first)
        const sortedPosts = postsData.sort((a, b) => {
          const dateA = new Date(a.saved_at).getTime();
          const dateB = new Date(b.saved_at).getTime();
          return dateB - dateA;
        });

        setSavedPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPosts();
  }, [user, socialService]);

  // Handle like/unlike
  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      // Call Firebase to like the post
      await socialService.likePost(postId, user.id);

      // Update local state
      setSavedPosts(prev =>
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
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUnlike = async (postId: string) => {
    if (!user) return;

    try {
      // Call Firebase to unlike the post
      await socialService.unlikePost(postId, user.id);

      // Update local state
      setSavedPosts(prev =>
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
    } catch (error) {
      console.error('Error unliking post:', error);
    }
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

  // Handle unsave
  const handleUnsave = async (postId: string) => {
    if (!user) return;
    if (!window.confirm(t('social.confirmUnsavePost'))) return;

    try {
      // Call Firebase to unsave the post
      await socialService.unsavePost(postId, user.id);

      // Update local state
      setSavedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error unsaving post:', error);
    }
  };

  // Filter posts based on search query and filter type
  const filteredPosts = savedPosts.filter(post => {
    // Filter by search query
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.user.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by type
    const matchesType = filterBy === 'all' ||
                       (filterBy === 'images' && post.image_url) ||
                       (filterBy === 'text' && !post.image_url);

    return matchesSearch && matchesType;
  });

  return (
    <NewSocialLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="social-card p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Bookmark className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              {t('social.savedPosts')}
            </h1>

            <div className="flex items-center space-x-2">
              <button
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="social-input pl-10"
                placeholder={t('social.searchSavedPosts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="social-input appearance-none pr-8 py-2 pl-3"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
              >
                <option value="all">{t('social.allPosts')}</option>
                <option value="images">{t('social.postsWithImages')}</option>
                <option value="text">{t('social.textOnlyPosts')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Saved Posts */}
        {isLoading ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{t('social.loadingSavedPosts')}</p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Bookmark className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || filterBy !== 'all'
                  ? t('social.noMatchingSavedPosts')
                  : t('social.noSavedPosts')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {searchQuery || filterBy !== 'all'
                  ? t('social.tryDifferentSearch')
                  : t('social.savedPostsDescription')}
              </p>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="relative">
                <EnhancedPostCard
                  post={post}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onComment={handleComment}
                  onShare={handleShare}
                  isCommentSectionOpen={activeCommentPostId === post.id}
                />

                <button
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  onClick={() => handleUnsave(post.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="social-card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                  onClick={() => setActiveCommentPostId(post.id)}
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.content.substring(0, 20)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-5 text-center">
                        {post.content}
                      </p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsave(post.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex-shrink-0">
                        <img
                          src={post.user.avatar_url}
                          alt={post.user.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="ml-2 text-white text-sm font-medium truncate">{post.user.full_name}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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

export default SavedPosts;
