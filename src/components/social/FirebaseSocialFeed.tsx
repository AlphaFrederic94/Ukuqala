import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Loader2, Send, Reply, Bookmark, BookmarkCheck, Edit, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import SafeTimeAgo from '../ui/SafeTimeAgo';
import HashtagHighlighter from './HashtagHighlighter';
import { supabase } from '../../lib/supabaseClient';
import CommentReplyForm from './CommentReplyForm';
import { hashtagService } from '../../lib/hashtagService';

const FirebaseSocialFeed: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  const navigate = useNavigate();

  // State for posts
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const postMenuRef = useRef<HTMLDivElement>(null);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up real-time post subscription
  useEffect(() => {
    console.log('Setting up real-time post subscription');

    // Initial fetch
    const fetchInitialPosts = async () => {
      try {
        const fetchedPosts = await socialService.getPosts(20);
        console.log('Fetched initial posts:', fetchedPosts.length);
        setPosts(fetchedPosts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching initial posts:', error);
        setIsLoading(false);
      }
    };

    fetchInitialPosts();

    // Set up real-time subscription
    const unsubscribe = socialService.subscribeToPostUpdates((updatedPosts) => {
      console.log('Real-time post update received:', updatedPosts.length);
      setPosts(updatedPosts);
    });

    return () => {
      console.log('Cleaning up post subscription');
      unsubscribe();
    };
  }, [socialService]);

  // Handle click outside post menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setShowPostMenu(null);
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

  // Fetch saved posts
  useEffect(() => {
    if (!user) return;

    const fetchSavedPosts = async () => {
      try {
        const savedPostsData = await socialService.getSavedPosts(user.id);
        console.log('Fetched saved posts from Firebase:', savedPostsData.length);
        setSavedPosts(savedPostsData.map(post => post.postId));
      } catch (error) {
        console.error('Error fetching saved posts:', error);
        // Initialize with empty array to prevent errors
        setSavedPosts([]);
      }
    };

    fetchSavedPosts();
  }, [user, socialService]);

  // Load comments for a post
  const loadComments = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      console.log('Loading comments for post:', postId);
      setIsLoadingComments(true);

      const comments = await socialService.getComments(postId);
      console.log('Comments loaded:', comments.length, 'comments', comments);

      setComments(prev => ({
        ...prev,
        [postId]: comments
      }));

      setIsLoadingComments(false);
    } catch (error) {
      console.error('Error loading comments:', error);
      setIsLoadingComments(false);
    }
  }, [user, socialService]);

  // Toggle comment section
  const toggleCommentSection = useCallback((postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      loadComments(postId);

      // Play typing sound
      const audio = new Audio('/sounds/message-typing.mp3');
      audio.volume = 0.5; // Lower volume for typing sound
      audio.play().catch(e => console.error('Error playing typing sound:', e));
    }
  }, [activeCommentPostId, loadComments]);

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
        console.log('Post unliked successfully in Firebase');
      } else {
        await socialService.likePost(postId, user.id);
        console.log('Post liked successfully in Firebase');
      }

      // Play sound effect
      const audio = new Audio('/sounds/message-sent.mp3');
      audio.volume = 0.3; // Lower volume
      audio.play().catch(e => console.error('Error playing sound:', e));

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

  // Add comment
  const handleAddComment = useCallback(async (postId: string) => {
    if (!user || !commentText.trim()) return;

    try {
      console.log('Adding comment to post:', postId, 'Content:', commentText.trim());

      // Update comment count in local state immediately for better UX
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          const newCommentCount = (p.comments || p.commentCount || 0) + 1;
          return {
            ...p,
            comments: newCommentCount,
            commentCount: newCommentCount
          };
        }
        return p;
      }));

      const newComment = await socialService.addComment({
        postId,
        userId: user.id,
        content: commentText.trim(),
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        userAvatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0) || 'U'}&background=random`
      });

      console.log('Comment created successfully in Firebase:', newComment);

      // Update local state
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));

      // Play success sound
      const audio = new Audio('/sounds/message-sent.mp3');
      audio.play().catch(e => console.error('Error playing sound:', e));

      // Show confirmation message
      setConfirmationMessage(t('social.commentAddedSuccess'));

      // Clear input
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setErrorMessage(t('social.errorAddingComment'));

      // Revert the comment count update if there was an error
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          const originalCommentCount = Math.max((p.comments || p.commentCount || 0) - 1, 0);
          return {
            ...p,
            comments: originalCommentCount,
            commentCount: originalCommentCount
          };
        }
        return p;
      }));
    }
  }, [user, commentText, socialService, t]);

  // Handle saving a post
  const handleSavePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const isSaved = savedPosts.includes(postId);

      if (isSaved) {
        // Remove from saved posts
        await socialService.unsavePost(postId, user.id);
        console.log('Post unsaved successfully in Firebase');

        // Update local state
        setSavedPosts(prev => prev.filter(id => id !== postId));

        // Show confirmation message
        setConfirmationMessage(t('social.postUnsavedSuccess'));
      } else {
        // Add to saved posts
        await socialService.savePost(postId, user.id);
        console.log('Post saved successfully in Firebase');

        // Update local state
        setSavedPosts(prev => [...prev, postId]);

        // Show confirmation message
        setConfirmationMessage(t('social.postSavedSuccess'));
      }

      // Play sound effect
      const audio = new Audio('/sounds/message-sent.mp3');
      audio.volume = 0.3; // Lower volume
      audio.play().catch(e => console.error('Error playing sound:', e));
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
      setErrorMessage(t('social.errorSavingPost'));
    }
  }, [user, savedPosts, socialService, t]);

  // Handle reply to comment
  const handleReplyToComment = useCallback((commentId: string) => {
    setReplyingToComment(commentId === replyingToComment ? null : commentId);
  }, [replyingToComment]);

  // Handle adding a reply
  const handleAddReply = useCallback((reply: any) => {
    if (!activeCommentPostId) return;

    // Add the reply to the comments list
    setComments(prev => ({
      ...prev,
      [activeCommentPostId]: [...(prev[activeCommentPostId] || []), reply]
    }));

    // Update comment count in the post
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === activeCommentPostId) {
        const newCommentCount = (p.comments || p.commentCount || 0) + 1;
        return {
          ...p,
          comments: newCommentCount,
          commentCount: newCommentCount
        };
      }
      return p;
    }));

    // Reset the replying state
    setReplyingToComment(null);
  }, [activeCommentPostId]);

  // Handle post menu toggle
  const togglePostMenu = useCallback((postId: string) => {
    setShowPostMenu(prev => prev === postId ? null : postId);
  }, []);

  // Start editing post
  const startEditingPost = useCallback((post: any) => {
    setEditingPostId(post.id);
    setEditPostContent(post.content);
    setShowPostMenu(null);
  }, []);

  // Cancel editing post
  const cancelEditingPost = useCallback(() => {
    setEditingPostId(null);
    setEditPostContent('');
  }, []);

  // Save edited post
  const saveEditedPost = useCallback(async (postId: string) => {
    if (!user || !editPostContent.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Process hashtags
      const extractedHashtags = await hashtagService.processHashtagsFromPost(editPostContent);

      await socialService.updatePost(postId, {
        content: editPostContent.trim(),
        hashtags: extractedHashtags
      });

      console.log('Post updated successfully in Firebase');

      // Update local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            content: editPostContent.trim(),
            hashtags: extractedHashtags
          };
        }
        return post;
      }));

      // Reset state
      setEditingPostId(null);
      setEditPostContent('');
      setConfirmationMessage(t('social.postUpdatedSuccess'));

      // Play success sound
      const audio = new Audio('/sounds/message-sent.mp3');
      audio.play().catch(e => console.error('Error playing sound:', e));
    } catch (error) {
      console.error('Error updating post:', error);
      setErrorMessage(t('social.errorUpdatingPost'));
    } finally {
      setIsSubmitting(false);
    }
  }, [user, editPostContent, socialService, t]);

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    if (!user || !window.confirm(t('social.confirmDeletePost'))) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await socialService.deletePost(postId);
      console.log('Post deleted successfully in Firebase');

      // Update local state
      setPosts(prev => prev.filter(post => post.id !== postId));
      setShowPostMenu(null);
      setConfirmationMessage(t('social.postDeletedSuccess'));

      // Play success sound
      const audio = new Audio('/sounds/message-sent.mp3');
      audio.play().catch(e => console.error('Error playing sound:', e));
    } catch (error) {
      console.error('Error deleting post:', error);
      setErrorMessage(t('social.errorDeletingPost'));
    } finally {
      setIsSubmitting(false);
    }
  }, [user, socialService, t]);

  // Process text to highlight hashtags and mentions
  const processText = (text: string) => {
    if (!text) return '';

    // Replace hashtags with links
    const hashtagRegex = /#(\w+)/g;
    let processedText = text.replace(hashtagRegex, '<a href="/social/hashtag/$1" class="hashtag" data-tag="#$1">#$1</a>');

    // Replace mentions with links
    const mentionRegex = /@(\w+)/g;
    processedText = processedText.replace(mentionRegex, '<a href="/social/profile/$1" class="mention">@$1</a>');

    // Replace URLs with links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    processedText = processedText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="url">$1</a>');

    return processedText;
  };

  return (
    <div className="space-y-4">
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
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 rounded-lg shadow-lg flex items-center"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            {errorMessage}
            <button
              className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              onClick={() => setErrorMessage(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                {/* Post header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.userAvatar || 'https://via.placeholder.com/40'}
                      alt={post.userName || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {post.userName || 'User'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <SafeTimeAgo date={post.createdAt?.toDate?.() || new Date(post.created_at || Date.now())} />
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => togglePostMenu(post.id)}
                      disabled={isSubmitting}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Post menu */}
                    {showPostMenu === post.id && (
                      <div
                        ref={postMenuRef}
                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 py-1"
                      >
                        {post.userId === user?.id && (
                          <>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              onClick={() => startEditingPost(post)}
                              disabled={isSubmitting}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {t('social.editPost')}
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                              onClick={() => deletePost(post.id)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('social.deletePost')}
                            </button>
                          </>
                        )}
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + '/social/post/' + post.id);
                            setShowPostMenu(null);
                            setConfirmationMessage(t('social.linkCopied'));
                          }}
                          disabled={isSubmitting}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          {t('social.copyLink')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post content */}
                <div className="px-4 pb-3">
                  {editingPostId === post.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        rows={4}
                        disabled={isSubmitting}
                        placeholder={t('social.writePost')}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                          onClick={cancelEditingPost}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('common.cancel')}
                        </button>
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                          onClick={() => saveEditedPost(post.id)}
                          disabled={isSubmitting || !editPostContent.trim()}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              {t('common.saving')}
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              {t('common.save')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <HashtagHighlighter text={post.content} />

                      {post.imageUrl && (
                        <div className="mt-3">
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            className="w-full h-auto max-h-96 object-contain rounded-lg"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Post stats */}
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Heart className={`w-4 h-4 mr-1 ${post.liked ? 'text-red-500 fill-current' : ''}`} />
                        <span>{post.likes || post.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span>{post.comments || post.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post actions */}
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                  <button
                    className={`flex items-center justify-center w-1/4 py-2 text-sm font-medium ${
                      post.liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                    } hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md`}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${post.liked ? 'fill-current' : ''}`} />
                    {t('social.like')}
                  </button>
                  <button
                    className="flex items-center justify-center w-1/4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                    onClick={() => toggleCommentSection(post.id)}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {t('social.comment')}
                  </button>
                  <button
                    className="flex items-center justify-center w-1/4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'CareAI Social Post',
                          text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
                          url: window.location.origin + '/social/post/' + post.id,
                        }).catch(error => console.error('Error sharing:', error));
                      } else {
                        navigator.clipboard.writeText(window.location.origin + '/social/post/' + post.id);
                        alert('Post link copied to clipboard');
                      }
                    }}
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    {t('social.share')}
                  </button>
                  <button
                    className={`flex items-center justify-center w-1/4 py-2 text-sm font-medium ${
                      savedPosts.includes(post.id) ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                    } hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md`}
                    onClick={() => handleSavePost(post.id)}
                  >
                    {savedPosts.includes(post.id) ? (
                      <BookmarkCheck className="w-5 h-5 mr-2 fill-current" />
                    ) : (
                      <Bookmark className="w-5 h-5 mr-2" />
                    )}
                    {t('social.save')}
                  </button>
                </div>

                {/* Comment section */}
                {activeCommentPostId === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-gray-100 dark:border-gray-700 p-4"
                  >
                    {/* Comment input */}
                    <div className="flex items-center mb-4">
                      <img
                        src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40'}
                        alt="Profile"
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t('social.writeComment')}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentText.trim()}
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Comments list */}
                    {isLoadingComments ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                    ) : comments[post.id]?.length > 0 ? (
                      <div className="space-y-4">
                        {comments[post.id].map((comment) => (
                          <div key={comment.id} className="flex items-start mb-3">
                            <img
                              src={comment.userAvatar || comment.user?.avatar_url || 'https://via.placeholder.com/40'}
                              alt={comment.userName || comment.user?.full_name || 'User'}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                            <div className="flex-1">
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {comment.userName || comment.user?.full_name || 'User'}
                                </div>
                                <HashtagHighlighter text={comment.content} />
                              </div>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 ml-2">
                                <SafeTimeAgo date={comment.createdAt?.toDate?.() || new Date(comment.created_at || Date.now())} />
                                <button
                                  className="ml-3 flex items-center hover:text-blue-500 transition-colors"
                                  onClick={() => handleReplyToComment(comment.id)}
                                >
                                  <Reply className="w-3 h-3 mr-1" />
                                  {t('social.reply')}
                                </button>
                              </div>

                              {/* Reply form */}
                              {replyingToComment === comment.id && (
                                <CommentReplyForm
                                  postId={post.id}
                                  commentId={comment.id}
                                  onReplyAdded={handleAddReply}
                                  onCancel={() => setReplyingToComment(null)}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        {t('social.noComments')}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            {t('social.noPosts')}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseSocialFeed;
