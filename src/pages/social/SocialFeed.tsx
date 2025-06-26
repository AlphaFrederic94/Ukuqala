import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, RefreshCw, Loader2, Bell, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService, Post } from '../../lib/socialService';
import { friendshipService } from '../../lib/friendshipService';
import { chatService } from '../../lib/chatService';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import EnhancedCreatePostForm from '../../components/social/EnhancedCreatePostForm';
import PostCard from '../../components/social/PostCard';
import CommentSection from '../../components/social/CommentSection';
import FriendCard from '../../components/social/FriendCard';
import SocialShare from '../../components/social/SocialShare';
import AnimatedBackground from '../../components/social/AnimatedBackground';

const SocialFeed: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [lastPostTimestamp, setLastPostTimestamp] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load posts and other data
  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load posts
      const postsData = await socialService.getPosts();

      // Check if current user has liked each post and normalize count objects
      const postsWithLikeStatus = await Promise.all(
        postsData.map(async post => {
          const liked = await socialService.isPostLikedByUser(post.id, user.id);

          // Get user info for the post
          let userInfo = post.user;
          if (!userInfo || !userInfo.full_name) {
            try {
              const { data: userData } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', post.user_id)
                .single();

              if (userData) {
                userInfo = userData;
              }
            } catch (err) {
              console.error('Error fetching user info for post:', err);
            }
          }

          // Normalize likes_count and comments_count if they are objects
          let likesCount = 0;
          if (typeof post.likes_count === 'object' && post.likes_count !== null) {
            likesCount = (post.likes_count as any).count || 0;
          } else if (typeof post.likes_count === 'number') {
            likesCount = post.likes_count;
          }

          let commentsCount = 0;
          if (typeof post.comments_count === 'object' && post.comments_count !== null) {
            commentsCount = (post.comments_count as any).count || 0;
          } else if (typeof post.comments_count === 'number') {
            commentsCount = post.comments_count;
          }

          console.log(`Post ${post.id} - likes: ${likesCount}, comments: ${commentsCount}`);

          const normalizedPost = {
            ...post,
            user: userInfo || { full_name: 'User', avatar_url: null },
            liked_by_user: liked,
            likes_count: likesCount,
            comments_count: commentsCount
          };

          return normalizedPost;
        })
      );

      setPosts(postsWithLikeStatus);

      // Load friend suggestions
      const suggestionsData = await friendshipService.getFriendSuggestions(user.id, 3);
      setFriendSuggestions(suggestionsData);

      // Load pending friend requests
      const requestsData = await friendshipService.getPendingFriendRequests(user.id);
      setPendingRequests(requestsData);

      // Get unread message count
      const unreadCount = await chatService.getUnreadCount(user.id);
      setUnreadMessages(unreadCount);
    } catch (err: any) {
      console.error('Error loading social feed data:', err);
      setError(err.message || t('social.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    // Ensure user profile exists before loading data
    if (user) {
      const ensureUserProfile = async () => {
        try {
          console.log('Checking if profile exists for user:', user.id);
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error checking user profile:', error);
          }

          if (!profileData) {
            console.log('Creating profile for user:', user.id);
            // If profile doesn't exist, create it
            await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  full_name: user?.full_name || 'User',
                  avatar_url: user?.avatar_url || null,
                  email: user?.email || null
                }
              ]);
          } else {
            console.log('User profile exists:', profileData);
          }
        } catch (err) {
          console.error('Error checking/creating user profile:', err);
        }

        // Load data after ensuring profile exists
        loadData();
      };

      ensureUserProfile();

      // Set up real-time subscription for posts
      console.log('Setting up real-time subscriptions for user:', user.id);

      const postsSubscription = supabase
        .channel('social_posts_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'social_posts'
          },
          (payload) => {
            console.log('Post change detected:', payload);
            loadData();
          }
        )
        .subscribe();

      // Set up real-time subscription for friend requests
      const friendshipsSubscription = supabase
        .channel('user_friendships_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_friendships',
            filter: `friend_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Friendship change detected:', payload);
            loadData();
          }
        )
        .subscribe();

      // Set up real-time subscription for messages
      const messagesSubscription = supabase
        .channel('chat_messages_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New message received:', payload);
            chatService.getUnreadCount(user.id).then(count => {
              setUnreadMessages(count);
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(postsSubscription);
        supabase.removeChannel(friendshipsSubscription);
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [user, loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handlePostCreated = () => {
    loadData();
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      console.log('Cannot like post: User not logged in');
      return;
    }

    console.log('Liking post:', postId, 'by user:', user.id);

    try {
      const result = await socialService.likePost(postId, user.id);
      console.log('Like result:', result);

      // Update the post in the local state to reflect the like
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                liked_by_user: true,
                likes_count: typeof post.likes_count === 'number'
                  ? post.likes_count + 1
                  : 1
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
      alert('Failed to like post. Please try again.');
    }
  };

  const handleUnlikePost = async (postId: string) => {
    if (!user) {
      console.log('Cannot unlike post: User not logged in');
      return;
    }

    console.log('Unliking post:', postId, 'by user:', user.id);

    try {
      const result = await socialService.unlikePost(postId, user.id);
      console.log('Unlike result:', result);

      // Update the post in the local state to reflect the unlike
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                liked_by_user: false,
                likes_count: typeof post.likes_count === 'number' && post.likes_count > 0
                  ? post.likes_count - 1
                  : 0
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error unliking post:', err);
      alert('Failed to unlike post. Please try again.');
    }
  };

  const handleCommentClick = (postId: string) => {
    console.log('Comment click on post:', postId);
    console.log('Current active comment section:', activeCommentSection);

    const newActiveSection = activeCommentSection === postId ? null : postId;
    console.log('Setting active comment section to:', newActiveSection);

    setActiveCommentSection(newActiveSection);
  };

  const handleEditPost = (postId: string) => {
    navigate(`/social/edit-post/${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    if (window.confirm(t('social.confirmDeletePost'))) {
      try {
        await socialService.deletePost(postId);
        setPosts(posts.filter(post => post.id !== postId));
      } catch (err) {
        console.error('Error deleting post:', err);
      }
    }
  };

  const handleSharePost = (postId: string) => {
    // Find the post
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Create share text
    const shareText = `${post.user?.full_name} shared: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`;

    // Open share dialog
    const shareUrl = `${window.location.origin}/social/post/${postId}`;

    // Create a temporary element to show the share dialog
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '50%';
    tempDiv.style.left = '50%';
    tempDiv.style.transform = 'translate(-50%, -50%)';
    tempDiv.style.zIndex = '9999';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.borderRadius = '8px';
    tempDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

    // Add share options
    tempDiv.innerHTML = `
      <div>
        <h3 style="margin-bottom: 10px; font-weight: bold;">${t('social.shareVia')}</h3>
        <div style="display: flex; gap: 10px;">
          <button style="padding: 8px 16px; background-color: #1877f2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Facebook
          </button>
          <button style="padding: 8px 16px; background-color: #1da1f2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Twitter
          </button>
          <button style="padding: 8px 16px; background-color: #0077b5; color: white; border: none; border-radius: 4px; cursor: pointer;">
            LinkedIn
          </button>
          <button style="padding: 8px 16px; background-color: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Copy Link
          </button>
        </div>
        <button style="margin-top: 10px; padding: 8px 16px; background-color: #f1f1f1; border: none; border-radius: 4px; cursor: pointer;">
          ${t('common.cancel')}
        </button>
      </div>
    `;

    document.body.appendChild(tempDiv);

    // Add event listeners
    const buttons = tempDiv.querySelectorAll('button');

    // Facebook
    buttons[0].addEventListener('click', () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
      document.body.removeChild(tempDiv);
    });

    // Twitter
    buttons[1].addEventListener('click', () => {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      document.body.removeChild(tempDiv);
    });

    // LinkedIn
    buttons[2].addEventListener('click', () => {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
      document.body.removeChild(tempDiv);
    });

    // Copy Link
    buttons[3].addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrl);
      alert(t('social.copied'));
      document.body.removeChild(tempDiv);
    });

    // Cancel
    buttons[4].addEventListener('click', () => {
      document.body.removeChild(tempDiv);
    });

    // Close when clicking outside
    document.addEventListener('click', function closeShare(e) {
      if (!tempDiv.contains(e.target as Node)) {
        document.body.removeChild(tempDiv);
        document.removeEventListener('click', closeShare);
      }
    });
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;

    try {
      await friendshipService.sendFriendRequest(user.id, friendId);
      // Remove from suggestions
      setFriendSuggestions(friendSuggestions.filter(friend => friend.id !== friendId));
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await friendshipService.respondToFriendRequest(friendshipId, 'accepted');
      // Remove from pending requests
      setPendingRequests(pendingRequests.filter(request => request.id !== friendshipId));
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await friendshipService.respondToFriendRequest(friendshipId, 'rejected');
      // Remove from pending requests
      setPendingRequests(pendingRequests.filter(request => request.id !== friendshipId));
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  // Check for scroll position to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Set up real-time listener for new posts
  useEffect(() => {
    if (posts.length > 0 && posts[0]?.created_at) {
      setLastPostTimestamp(posts[0].created_at);

      // Subscribe to new posts
      const newPostsSubscription = supabase
        .channel('new_posts_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'social_posts'
          },
          (payload) => {
            // Check if this is a newer post than what we have
            if (lastPostTimestamp && payload.new && payload.new.created_at > lastPostTimestamp) {
              setNewPostsAvailable(true);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(newPostsSubscription);
      };
    }
  }, [posts, lastPostTimestamp]);

  // Load new posts when user clicks the notification
  const handleLoadNewPosts = () => {
    setNewPostsAvailable(false);
    loadData();
    // Scroll to top of feed
    if (feedRef.current) {
      feedRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatedBackground>
      <div className="container mx-auto px-4 py-6 relative">
        <div className="flex flex-col md:flex-row gap-6">
        {/* Main content */}
        <div className="w-full md:w-2/3" ref={feedRef}>
          <div className="mb-6 flex justify-between items-center">
            <motion.h1
              className="text-2xl font-bold text-gray-900 dark:text-white social-text-gradient-blue"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {t('social.feed')}
            </motion.h1>
            <motion.button
              onClick={handleRefresh}
              className="flex items-center text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
              disabled={isRefreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {isRefreshing ? (
                <Loader2 className="w-5 h-5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-1" />
              )}
              {t('social.refresh')}
            </motion.button>
          </div>

          {/* New posts notification */}
          <AnimatePresence>
            {newPostsAvailable && (
              <motion.div
                className="mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center justify-between shadow-md cursor-pointer"
                onClick={handleLoadNewPosts}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-blue-700 dark:text-blue-300 font-medium">{t('social.newPostsAvailable')}</span>
                </div>
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create post form */}
          <EnhancedCreatePostForm onPostCreated={handlePostCreated} />

          {/* Posts list */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <motion.p
                className="text-gray-500 dark:text-gray-400 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {t('social.loadingPosts')}
              </motion.p>
            </div>
          ) : posts.length > 0 ? (
            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {posts.map(post => (
                <motion.div
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                  }}
                >
                  <PostCard
                    post={post}
                    onLike={handleLikePost}
                    onUnlike={handleUnlikePost}
                    onComment={handleCommentClick}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    onShare={handleSharePost}
                  />
                  <CommentSection
                    postId={post.id}
                    isOpen={activeCommentSection === post.id}
                    onCommentAdded={() => {
                      // Update the post's comment count in the local state
                      setPosts(prevPosts =>
                        prevPosts.map(p =>
                          p.id === post.id
                            ? {
                                ...p,
                                comments_count: typeof p.comments_count === 'number'
                                  ? p.comments_count + 1
                                  : 1
                              }
                            : p
                        )
                      );
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-12 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-gray-500 dark:text-gray-400">
                {error || t('social.noPosts')}
              </p>
              {!error && (
                <motion.button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('social.refresh')}
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-1/3 space-y-6">
          {/* Messages button */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
          >
            <button
              onClick={() => navigate('/social/messages')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="ml-3 font-medium text-gray-900 dark:text-white">
                  {t('social.messages')}
                </span>
              </div>
              {unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
          </motion.div>

          {/* Friend requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('social.friendRequests')}
              </h2>
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <FriendCard
                    key={request.id}
                    id={request.id}
                    name={request.friend.full_name}
                    avatar={request.friend.avatar_url}
                    status="pending"
                    onAcceptRequest={handleAcceptRequest}
                    onRejectRequest={handleRejectRequest}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Friend suggestions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('social.peopleMayKnow')}
              </h2>
              <button
                onClick={() => navigate('/social/friends')}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {t('social.seeAll')}
              </button>
            </div>

            {friendSuggestions.length > 0 ? (
              <div className="space-y-3">
                {friendSuggestions.map(friend => (
                  <FriendCard
                    key={friend.id}
                    id={friend.id}
                    name={friend.full_name}
                    avatar={friend.avatar_url}
                    status="suggestion"
                    onAddFriend={handleAddFriend}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                {t('social.noSuggestions')}
              </p>
            )}
          </div>

          {/* Friends link */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
          >
            <button
              onClick={() => navigate('/social/friends')}
              className="w-full flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-500">
                <Users className="w-5 h-5" />
              </div>
              <span className="ml-3 font-medium text-gray-900 dark:text-white">
                {t('social.manageFriends')}
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="fixed bottom-6 right-6 p-3 bg-blue-500 text-white rounded-full shadow-lg z-50"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
    </AnimatedBackground>
  );
};

export default SocialFeed;
