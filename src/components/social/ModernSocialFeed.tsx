import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { 
  Loader2, 
  RefreshCw, 
  Filter, 
  TrendingUp, 
  Clock, 
  Users, 
  ChevronDown,
  Check,
  AlertTriangle
} from 'lucide-react';
import ModernPostCard from './ModernPostCard';
import ModernCreatePost from './ModernCreatePost';
import TrendingTopics from './TrendingTopics';
import SuggestedUsers from './SuggestedUsers';

interface ModernSocialFeedProps {
  filter?: string;
  hashtag?: string;
  userId?: string;
}

const ModernSocialFeed: React.FC<ModernSocialFeedProps> = ({
  filter = 'latest',
  hashtag,
  userId
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  
  // State
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'following'>(filter as any);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [createPostExpanded, setCreatePostExpanded] = useState(false);
  
  // Refs
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle click outside sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Clear confirmation message after timeout
  useEffect(() => {
    if (confirmationMessage) {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
      
      confirmationTimeoutRef.current = setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
      
      return () => {
        if (confirmationTimeoutRef.current) {
          clearTimeout(confirmationTimeoutRef.current);
        }
      };
    }
  }, [confirmationMessage]);
  
  // Fetch posts based on filter
  const fetchPosts = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let fetchedPosts: any[] = [];
      
      if (hashtag) {
        // Fetch posts by hashtag
        fetchedPosts = await socialService.getPostsByHashtag(hashtag);
      } else if (userId) {
        // Fetch posts by user
        fetchedPosts = await socialService.getPostsByUser(userId);
      } else {
        // Fetch posts based on sort option
        switch (sortBy) {
          case 'latest':
            fetchedPosts = await socialService.getPosts(20);
            break;
          case 'trending':
            fetchedPosts = await socialService.getTrendingPosts(20);
            break;
          case 'following':
            fetchedPosts = await socialService.getFollowingPosts(user.id, 20);
            break;
          default:
            fetchedPosts = await socialService.getPosts(20);
        }
      }
      
      console.log(`Fetched ${fetchedPosts.length} posts with filter: ${sortBy}`);
      setPosts(fetchedPosts);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message || t('social.errorFetchingPosts'));
    } finally {
      setIsLoading(false);
    }
  }, [user, socialService, sortBy, hashtag, userId, t]);
  
  // Initial fetch
  useEffect(() => {
    fetchPosts();
    
    // Set up real-time subscription
    const unsubscribe = socialService.subscribeToPostUpdates((updatedPosts) => {
      console.log('Real-time post update received:', updatedPosts.length);
      setPosts(updatedPosts);
    });
    
    return () => {
      unsubscribe();
    };
  }, [fetchPosts, socialService]);
  
  // Fetch saved posts
  useEffect(() => {
    if (!user) return;
    
    const fetchSavedPosts = async () => {
      try {
        const savedPostsData = await socialService.getSavedPosts(user.id);
        setSavedPosts(savedPostsData.map(post => post.postId));
      } catch (error) {
        console.error('Error fetching saved posts:', error);
        setSavedPosts([]);
      }
    };
    
    fetchSavedPosts();
  }, [user, socialService]);
  
  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
    
    // Show confirmation
    setConfirmationMessage(t('social.feedRefreshed'));
    
    // Play refresh sound
    const audio = new Audio('/sounds/refresh.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.error('Error playing sound:', e));
  };
  
  // Handle like
  const handleLike = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      // Update local state immediately for better UX
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          const newLikeCount = p.liked ?
            Math.max((p.likes || p.likeCount || 0) - 1, 0) :
            (p.likes || p.likeCount || 0) + 1;
          
          return {
            ...p,
            liked: !p.liked,
            likes: newLikeCount,
            likeCount: newLikeCount
          };
        }
        return p;
      }));
      
      // Then update in the database
      if (post.liked) {
        await socialService.unlikePost(postId, user.id);
      } else {
        await socialService.likePost(postId, user.id);
        
        // Play sound effect
        const audio = new Audio('/sounds/like.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.error('Error playing sound:', e));
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      
      // Revert the local state change if there was an error
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          const originalLikeCount = p.liked ?
            (p.likes || p.likeCount || 0) + 1 :
            Math.max((p.likes || p.likeCount || 0) - 1, 0);
          
          return {
            ...p,
            liked: !p.liked,
            likes: originalLikeCount,
            likeCount: originalLikeCount
          };
        }
        return p;
      }));
    }
  }, [posts, user, socialService]);
  
  // Handle comment
  const handleComment = useCallback((postId: string) => {
    setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
  }, [activeCommentPostId]);
  
  // Handle save post
  const handleSavePost = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      const isSaved = savedPosts.includes(postId);
      
      if (isSaved) {
        // Remove from saved posts
        await socialService.unsavePost(postId, user.id);
        
        // Update local state
        setSavedPosts(prev => prev.filter(id => id !== postId));
        
        // Show confirmation message
        setConfirmationMessage(t('social.postUnsavedSuccess'));
      } else {
        // Add to saved posts
        await socialService.savePost(postId, user.id);
        
        // Update local state
        setSavedPosts(prev => [...prev, postId]);
        
        // Show confirmation message
        setConfirmationMessage(t('social.postSavedSuccess'));
        
        // Play sound effect
        const audio = new Audio('/sounds/bookmark.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.error('Error playing sound:', e));
      }
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
      setError(t('social.errorSavingPost'));
    }
  }, [user, savedPosts, socialService, t]);
  
  // Handle edit post
  const handleEditPost = useCallback((post: any) => {
    // Implement edit post functionality
    console.log('Edit post:', post);
  }, []);
  
  // Handle delete post
  const handleDeletePost = useCallback(async (postId: string) => {
    if (!user || !window.confirm(t('social.confirmDeletePost'))) return;
    
    try {
      await socialService.deletePost(postId);
      
      // Update local state
      setPosts(prev => prev.filter(post => post.id !== postId));
      setConfirmationMessage(t('social.postDeletedSuccess'));
      
      // Play success sound
      const audio = new Audio('/sounds/delete.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.error('Error playing sound:', e));
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(t('social.errorDeletingPost'));
    }
  }, [user, socialService, t]);
  
  // Get sort icon
  const getSortIcon = () => {
    switch (sortBy) {
      case 'latest':
        return <Clock className="w-5 h-5" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5" />;
      case 'following':
        return <Users className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Confirmation message */}
      <AnimatePresence>
        {confirmationMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-lg shadow-lg flex items-center"
          >
            <Check className="w-5 h-5 mr-2" />
            {confirmationMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 rounded-lg shadow-lg flex items-center"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create post */}
          {user && (
            <ModernCreatePost
              onPostCreated={fetchPosts}
              minimized={!createPostExpanded}
              onExpand={() => setCreatePostExpanded(true)}
            />
          )}
          
          {/* Feed controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>{t(`social.sortBy.${sortBy}`)}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showSortOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSortBy('latest');
                          setShowSortOptions(false);
                          fetchPosts();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Clock className="w-4 h-4 mr-3" />
                        {t('social.sortBy.latest')}
                        {sortBy === 'latest' && (
                          <Check className="w-4 h-4 ml-auto text-green-500" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          setSortBy('trending');
                          setShowSortOptions(false);
                          fetchPosts();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-3" />
                        {t('social.sortBy.trending')}
                        {sortBy === 'trending' && (
                          <Check className="w-4 h-4 ml-auto text-green-500" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          setSortBy('following');
                          setShowSortOptions(false);
                          fetchPosts();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Users className="w-4 h-4 mr-3" />
                        {t('social.sortBy.following')}
                        {sortBy === 'following' && (
                          <Check className="w-4 h-4 ml-auto text-green-500" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{t('social.refresh')}</span>
            </button>
          </div>
          
          {/* Posts */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                {t('social.loadingPosts')}
              </span>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {t('social.noPosts')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hashtag
                  ? t('social.noPostsWithHashtag', { hashtag })
                  : userId
                    ? t('social.noPostsFromUser')
                    : t('social.noPostsYet')}
              </p>
              {!userId && !hashtag && (
                <button
                  onClick={() => setCreatePostExpanded(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('social.createFirstPost')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <ModernPostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onSave={handleSavePost}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  savedPosts={savedPosts}
                  showComments={activeCommentPostId === post.id}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4 hidden lg:block">
          <TrendingTopics />
          <SuggestedUsers />
        </div>
      </div>
    </div>
  );
};

export default ModernSocialFeed;
