import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../lib/socialService';
import { supabase } from '../../lib/supabaseClient';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import EnhancedPostCard from '../../components/social/EnhancedPostCard';
import EnhancedCommentSection from '../../components/social/EnhancedCommentSection';
import HashtagAnalytics from '../../components/social/HashtagAnalytics';
import { hashtagService } from '../../lib/hashtagService';
import { Hash, BarChart2, Bell, Filter, Grid, List, Calendar, ArrowLeft } from 'lucide-react';

const HashtagPage: React.FC = () => {
  const { tag } = useParams<{ tag: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'top'>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFollowing, setIsFollowing] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [relatedTags, setRelatedTags] = useState<string[]>([]);

  // Load hashtag posts
  useEffect(() => {
    if (!tag || !user) return;

    const loadHashtagPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch posts with the hashtag from the database
        // First try to find posts with the hashtag in the hashtags array
        const { data: postsWithHashtagArray, error: hashtagArrayError } = await supabase
          .from('social_posts')
          .select('*')
          .contains('hashtags', [tag.startsWith('#') ? tag : `#${tag}`]);

        if (hashtagArrayError) {
          console.error('Error fetching posts with hashtag array:', hashtagArrayError);
        }

        // Then find posts with the hashtag in the content
        const { data: postsWithHashtagContent, error: hashtagContentError } = await supabase
          .from('social_posts')
          .select('*')
          .ilike('content', `%#${tag}%`);

        if (hashtagContentError) {
          console.error('Error fetching posts with hashtag content:', hashtagContentError);
        }

        // Combine and deduplicate posts
        const allPosts = [...(postsWithHashtagArray || []), ...(postsWithHashtagContent || [])];
        const uniquePostIds = new Set();
        const uniquePosts = allPosts.filter(post => {
          if (uniquePostIds.has(post.id)) {
            return false;
          }
          uniquePostIds.add(post.id);
          return true;
        });

        if (uniquePosts.length === 0) {
          setPosts([]);
          setPostsCount(0);
          setRelatedTags([]);
          setIsLoading(false);
          return;
        }

        // Extract all user IDs
        const userIds = [...new Set(uniquePosts.map(post => post.user_id))];

        // Fetch all user profiles in one query
        const { data: userProfilesData, error: userProfilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (userProfilesError) {
          console.error('Error fetching user profiles:', userProfilesError);
        }

        // Create a map of user profiles
        const userProfilesMap = {};
        userProfilesData?.forEach(profile => {
          userProfilesMap[profile.id] = profile;
        });

        // Fetch likes for the current user
        const { data: userLikesData, error: userLikesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', uniquePosts.map(post => post.id));

        if (userLikesError) {
          console.error('Error fetching user likes:', userLikesError);
        }

        // Create a map of liked posts
        const userLikesMap = {};
        userLikesData?.forEach(like => {
          userLikesMap[like.post_id] = true;
        });

        // Fetch likes counts
        const { data: likesCountData, error: likesCountError } = await supabase
          .from('post_likes')
          .select('post_id, count')
          .in('post_id', uniquePosts.map(post => post.id))
          .group('post_id');

        if (likesCountError) {
          console.error('Error fetching likes counts:', likesCountError);
        }

        // Create a map of likes counts
        const likesCountMap = {};
        likesCountData?.forEach(item => {
          likesCountMap[item.post_id] = parseInt(item.count);
        });

        // Fetch comments counts
        const { data: commentsCountData, error: commentsCountError } = await supabase
          .from('post_comments')
          .select('post_id, count')
          .in('post_id', uniquePosts.map(post => post.id))
          .group('post_id');

        if (commentsCountError) {
          console.error('Error fetching comments counts:', commentsCountError);
        }

        // Create a map of comments counts
        const commentsCountMap = {};
        commentsCountData?.forEach(item => {
          commentsCountMap[item.post_id] = parseInt(item.count);
        });

        // Process posts with all the data
        const processedPosts = uniquePosts.map(post => {
          // Get user data or create fallback
          const userData = userProfilesMap[post.user_id] || {
            id: post.user_id,
            full_name: post.user_id.substring(0, 8) + '...',
            avatar_url: `https://ui-avatars.com/api/?name=${post.user_id.substring(0, 2)}&background=random`
          };

          return {
            ...post,
            user: userData,
            likes_count: likesCountMap[post.id] || 0,
            comments_count: commentsCountMap[post.id] || 0,
            liked_by_user: !!userLikesMap[post.id]
          };
        });

        // Find related hashtags
        const hashtagsSet = new Set<string>();
        processedPosts.forEach(post => {
          // Extract hashtags from content
          const contentHashtags = (post.content.match(/#\w+/g) || []);
          contentHashtags.forEach(hashtag => {
            const cleanHashtag = hashtag.substring(1); // Remove the # symbol
            if (cleanHashtag.toLowerCase() !== tag.toLowerCase()) {
              hashtagsSet.add(cleanHashtag);
            }
          });

          // Add hashtags from the hashtags array
          if (post.hashtags && Array.isArray(post.hashtags)) {
            post.hashtags.forEach(hashtag => {
              const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
              if (cleanHashtag.toLowerCase() !== tag.toLowerCase()) {
                hashtagsSet.add(cleanHashtag);
              }
            });
          }
        });

        // Set data
        setPosts(processedPosts);
        setPostsCount(processedPosts.length);
        setRelatedTags(Array.from(hashtagsSet).slice(0, 5)); // Limit to 5 related tags
        setIsFollowing(false); // Default to not following
      } catch (err: any) {
        console.error('Error loading hashtag posts:', err);
        setError(err.message || t('social.errorLoadingHashtagPosts'));
      } finally {
        setIsLoading(false);
      }
    };

    loadHashtagPosts();
  }, [tag, t]);

  // Handle like/unlike
  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      await socialService.likePost(postId, user.id);

      // Update local state
      setPosts(prev =>
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
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleUnlike = async (postId: string) => {
    if (!user) return;

    try {
      await socialService.unlikePost(postId, user.id);

      // Update local state
      setPosts(prev =>
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
    } catch (err) {
      console.error('Error unliking post:', err);
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

  // Handle delete
  const handleDelete = async (postId: string) => {
    if (!user) return;
    if (!window.confirm(t('social.confirmDeletePost'))) return;

    try {
      await socialService.deletePost(postId);

      // Update local state
      setPosts(prev => prev.filter(post => post.id !== postId));
      setPostsCount(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Toggle follow hashtag
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'trending':
        // In a real app, you would have a trending algorithm
        return (b.comments_count || 0) + (b.likes_count || 0) - ((a.comments_count || 0) + (a.likes_count || 0));
      case 'top':
        return (b.likes_count || 0) - (a.likes_count || 0);
      default:
        return 0;
    }
  });

  if (!tag) {
    return (
      <NewSocialLayout>
        <div className="social-card p-6">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <p className="font-medium">{t('common.error')}</p>
            <p className="mt-1">{t('social.hashtagNotFound')}</p>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => navigate('/social')}
            >
              {t('social.backToFeed')}
            </button>
          </div>
        </div>
      </NewSocialLayout>
    );
  }

  return (
    <NewSocialLayout>
      <div className="space-y-6">
        {/* Hashtag Header */}
        <div className="social-card p-6">
          <button
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('common.back')}
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Hash className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">#{tag}</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {postsCount} {postsCount === 1 ? t('social.post') : t('social.posts')}
                </p>
              </div>
            </div>

            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                isFollowing
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleFollowToggle}
            >
              {isFollowing ? (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  {t('social.following')}
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  {t('social.follow')}
                </>
              )}
            </button>
          </div>

          {/* Related Hashtags */}
          {relatedTags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('social.relatedHashtags')}
              </h3>

              <div className="flex flex-wrap gap-2">
                {relatedTags.map((relatedTag) => (
                  <button
                    key={relatedTag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm flex items-center"
                    onClick={() => navigate(`/social/hashtag/${relatedTag}`)}
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {relatedTag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hashtag Analytics */}
        <div className="social-card">
          <HashtagAnalytics />
        </div>

        {/* Content Controls */}
        <div className="social-card p-4">
          <div className="flex items-center justify-between">
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

            <div className="relative">
              <select
                className="social-input appearance-none pr-8 py-1 pl-3"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="recent">{t('social.recent')}</option>
                <option value="trending">{t('social.trending')}</option>
                <option value="top">{t('social.top')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{t('social.loadingPosts')}</p>
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
        ) : sortedPosts.length === 0 ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('social.noPostsForHashtag', { tag })}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {t('social.beFirstToPostHashtag', { tag })}
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => navigate('/social')}
              >
                {t('social.createPost')}
              </button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-6">
            {sortedPosts.map((post) => (
              <EnhancedPostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onComment={handleComment}
                onShare={handleShare}
                onDelete={handleDelete}
                isCommentSectionOpen={activeCommentPostId === post.id}
              />
            ))}
          </div>
        ) : (
          <div className="social-card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sortedPosts.map((post) => (
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

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-4 text-white">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                        <span>{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                        <span>{post.comments_count || 0}</span>
                      </div>
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

export default HashtagPage;
