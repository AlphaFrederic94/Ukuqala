import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, RefreshCw, Filter, Clock, Heart, MessageCircle,
  Bookmark, Share2, MoreHorizontal, User, Check, AlertTriangle,
  Send, Image as ImageIcon, X, Edit2, Trash2, Edit
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import HashtagInput from './HashtagInput.jsx';
import ImageViewer from './ImageViewer.jsx';
import UserSearchSidebar from './UserSearchSidebar.jsx';
import MessageNotifications from './MessageNotifications.jsx';
import ChatFloatingButton from './ChatFloatingButton.jsx';
import { formatDistanceToNow } from 'date-fns';

const SimpleModernSocialFeed = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();

  // State for posts
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);

  // State for comments
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // State for creating posts
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  const [postHashtags, setPostHashtags] = useState([]);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // State for trending topics
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  // State for post editing and deletion
  const [activePostMenu, setActivePostMenu] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for comment editing and replying
  const [editingComment, setEditingComment] = useState(null);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // State for liked posts
  const [likedPosts, setLikedPosts] = useState([]);

  // State for image viewer
  const [viewingImage, setViewingImage] = useState(null);

  // Handle keyboard events for image viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewingImage && e.key === 'Escape') {
        setViewingImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewingImage]);

  // Refs
  const fileInputRef = useRef(null);
  const commentInputRef = useRef(null);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching posts...');

      // Try different methods to fetch posts
      let fetchedPosts = [];

      try {
        // First try getPosts from Firebase
        fetchedPosts = await socialService.getPosts(20);
        console.log('Fetched posts from Firebase:', fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts from Firebase:', error);

        // Try to create a test post if no posts are found
        if (!fetchedPosts || fetchedPosts.length === 0) {
          try {
            console.log('Creating a test post...');
            await socialService.createTestPost(user.id);
            // Try fetching again
            fetchedPosts = await socialService.getPosts(20);
          } catch (testPostError) {
            console.error('Error creating test post:', testPostError);
          }
        }
      }

      // If we still have no posts, create a sample post locally
      if (!fetchedPosts || fetchedPosts.length === 0) {
        console.log('Creating sample posts locally');

        // Create sample post IDs
        const samplePostId1 = 'sample-1';
        const samplePostId2 = 'sample-2';

        // Create sample posts
        fetchedPosts = [
          {
            id: samplePostId1,
            userId: user.id,
            userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            userAvatar: user.user_metadata?.avatar_url || '/images/default_avatar.png',
            content: 'This is a sample post with hashtags #medicine #health',
            hashtags: ['#medicine', '#health'],
            imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
            createdAt: new Date(),
            likes: 5,
            comments: 2
          },
          {
            id: samplePostId2,
            userId: user.id,
            userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            userAvatar: user.user_metadata?.avatar_url || '/images/default_avatar.png',
            content: 'Another sample post about #healthcare and #research',
            hashtags: ['#healthcare', '#research'],
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            likes: 3,
            comments: 1
          }
        ];

        // Create sample comments for the posts
        const sampleComments = {
          [samplePostId1]: [
            {
              id: 'comment-1',
              userId: 'user-1',
              userName: 'Dr. Sarah Johnson',
              userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              text: 'Great post! I found the information about #health very useful.',
              createdAt: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
              id: 'comment-2',
              userId: 'user-2',
              userName: 'Dr. Michael Chen',
              userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              text: 'I agree with your points about medicine. Have you read the latest research?',
              createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
            }
          ],
          [samplePostId2]: [
            {
              id: 'comment-3',
              userId: 'user-3',
              userName: 'Dr. Lisa Rodriguez',
              userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
              text: 'The research you mentioned is groundbreaking! #research',
              createdAt: new Date(Date.now() - 7200000) // 2 hours ago
            }
          ]
        };

        // Set the sample comments
        setComments(sampleComments);
      }

      console.log('Final posts to display:', fetchedPosts);
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error in fetchPosts:', err);
      setError(err.message || t('social.errorFetchingPosts'));
    } finally {
      setIsLoading(false);
    }
  }, [user, socialService, t]);

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

  // Fetch liked posts
  useEffect(() => {
    if (!user) return;

    const fetchLikedPosts = async () => {
      try {
        const likedPostsData = await socialService.getLikedPosts(user.id);
        setLikedPosts(likedPostsData.map(like => like.postId));

        // Update the posts with liked status
        setPosts(prevPosts => prevPosts.map(post => ({
          ...post,
          liked: likedPostsData.some(like => like.postId === post.id)
        })));
      } catch (error) {
        console.error('Error fetching liked posts:', error);
        setLikedPosts([]);
      }
    };

    fetchLikedPosts();
  }, [user, socialService]);

  // Fetch trending topics
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        setIsLoadingTopics(true);
        const topics = await socialService.getTrendingHashtags(5);
        setTrendingTopics(topics);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
        // Set default trending topics
        setTrendingTopics([
          { id: '1', name: '#MedicalResearch', count: 128 },
          { id: '2', name: '#COVID19', count: 96 },
          { id: '3', name: '#HealthcareHeroes', count: 87 },
          { id: '4', name: '#MedicalEducation', count: 76 },
          { id: '5', name: '#PatientCare', count: 65 }
        ]);
      } finally {
        setIsLoadingTopics(false);
      }
    };

    fetchTrendingTopics();
  }, [socialService]);

  // Removed mock suggested users fetch

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);

    // Show confirmation
    setConfirmationMessage(t('social.feedRefreshed'));

    // Clear confirmation message after 3 seconds
    setTimeout(() => {
      setConfirmationMessage(null);
    }, 3000);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      // Handle Firebase Timestamp objects
      if (typeof dateString === 'object' && dateString.seconds) {
        return formatDistanceToNow(new Date(dateString.seconds * 1000), { addSuffix: true });
      }

      // Handle regular date strings
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, typeof dateString);
      return 'recently';
    }
  };

  // Handle like post
  const handleLikePost = async (postId) => {
    if (!user) return;

    try {
      // Check if post is already liked
      const isLiked = likedPosts.includes(postId);

      // Update local state immediately for better UX
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          const newLikeCount = isLiked ? Math.max((p.likes || 0) - 1, 0) : (p.likes || 0) + 1;

          return {
            ...p,
            liked: !isLiked,
            likes: newLikeCount
          };
        }
        return p;
      }));

      // Update liked posts state
      if (isLiked) {
        setLikedPosts(prev => prev.filter(id => id !== postId));
      } else {
        setLikedPosts(prev => [...prev, postId]);
      }

      // Then update in the database
      if (isLiked) {
        await socialService.unlikePost(postId, user.id);
      } else {
        await socialService.likePost(postId, user.id);

        // Only try to play sound if the file exists
        try {
          // Check if the sound file exists before trying to play it
          fetch('/sounds/like.mp3')
            .then(response => {
              if (response.ok) {
                const audio = new Audio('/sounds/like.mp3');
                audio.volume = 0.3;
                audio.play().catch(e => {
                  // Silently handle play errors - often due to user interaction requirements
                  console.log('Note: Sound could not be played automatically');
                });
              } else {
                console.log('Sound file not available - skipping sound effect');
              }
            })
            .catch(() => {
              console.log('Sound file not available - skipping sound effect');
            });
        } catch (soundError) {
          // Silently handle errors
          console.log('Sound playback not supported');
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);

      // Revert the local state change if there was an error
      const isLiked = likedPosts.includes(postId);

      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          const originalLikeCount = isLiked ?
            Math.max((p.likes || 0) - 1, 0) :
            (p.likes || 0) + 1;

          return {
            ...p,
            liked: isLiked,
            likes: originalLikeCount
          };
        }
        return p;
      }));

      // Revert liked posts state
      if (isLiked) {
        setLikedPosts(prev => prev.filter(id => id !== postId));
      } else {
        setLikedPosts(prev => [...prev, postId]);
      }

      // Show error message
      setError(t('social.errorLikingPost'));
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Handle save post
  const handleSavePost = async (postId) => {
    if (!user) return;

    try {
      if (savedPosts.includes(postId)) {
        await socialService.unsavePost(postId, user.id);
        setSavedPosts(savedPosts.filter(id => id !== postId));
      } else {
        await socialService.savePost(postId, user.id);
        setSavedPosts([...savedPosts, postId]);
      }
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
    }
  };

  // Handle comment toggle
  const handleCommentToggle = async (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);
    setIsLoadingComments(true);

    try {
      // Always fetch fresh comments when toggling
      console.log('Fetching comments for post:', postId);

      // Try different methods to get comments
      let fetchedComments = [];

      try {
        // First try getComments
        fetchedComments = await socialService.getComments(postId);
      } catch (error) {
        console.error('Error with getComments:', error);

        // Fallback to getPostComments
        try {
          fetchedComments = await socialService.getPostComments(postId);
        } catch (error2) {
          console.error('Error with getPostComments:', error2);

          // Final fallback to getCommentsByPostId
          try {
            fetchedComments = await socialService.getCommentsByPostId(postId);
          } catch (error3) {
            console.error('Error with getCommentsByPostId:', error3);
            // Give up and use empty array
          }
        }
      }

      console.log('Fetched comments:', fetchedComments);

      setComments(prev => ({
        ...prev,
        [postId]: fetchedComments || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Set empty array for this post's comments
      setComments(prev => ({
        ...prev,
        [postId]: []
      }));
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (postId) => {
    if (!user || !commentText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const commentData = {
        postId,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        userAvatar: user.user_metadata?.avatar_url || '/images/default_avatar.png',
        text: commentText.trim(),
        content: commentText.trim(), // Some APIs use 'content' instead of 'text'
        parentId: replyingToComment ? replyingToComment.id : null // For replies
      };

      console.log('Submitting comment:', commentData);

      // Try different methods to add a comment
      let newComment = null;

      try {
        // First try addComment
        newComment = await socialService.addComment(commentData);
      } catch (error) {
        console.error('Error with addComment:', error);

        // Fallback to createComment
        try {
          newComment = await socialService.createComment(postId, user.id, commentText.trim());
        } catch (error2) {
          console.error('Error with createComment:', error2);

          // Final fallback to createCommentWithParams
          try {
            newComment = await socialService.createCommentWithParams(commentData);
          } catch (error3) {
            console.error('Error with createCommentWithParams:', error3);
            // Create a local comment object as last resort
            newComment = {
              id: `local-${Date.now()}`,
              ...commentData,
              createdAt: new Date()
            };
          }
        }
      }

      console.log('New comment created:', newComment);

      // Update local state with the new comment
      const formattedComment = {
        id: newComment.id || `local-${Date.now()}`,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        userAvatar: user.user_metadata?.avatar_url || '/images/default_avatar.png',
        text: commentText.trim(),
        content: commentText.trim(),
        createdAt: new Date(),
        parentId: replyingToComment ? replyingToComment.id : null
      };

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), formattedComment]
      }));

      // Update post comment count
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: (p.comments || 0) + 1
          };
        }
        return p;
      }));

      // Reset form
      setCommentText('');
      setReplyingToComment(null);

      // Show confirmation
      setConfirmationMessage(t('social.commentAdded'));
      setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);

      // Only try to play sound if the file exists
      try {
        // Check if the sound file exists before trying to play it
        fetch('/sounds/comment.mp3')
          .then(response => {
            if (response.ok) {
              const audio = new Audio('/sounds/comment.mp3');
              audio.volume = 0.3;
              audio.play().catch(e => {
                // Silently handle play errors - often due to user interaction requirements
                console.log('Note: Comment sound could not be played automatically');
              });
            } else {
              console.log('Comment sound file not available - skipping sound effect');
            }
          })
          .catch(() => {
            console.log('Comment sound file not available - skipping sound effect');
          });
      } catch (soundError) {
        // Silently handle errors
        console.log('Sound playback not supported');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(t('social.errorAddingComment'));
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle edit comment
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.text || comment.content || '');
    setActiveCommentMenu(null);
  };

  // Handle update comment
  const handleUpdateComment = async (postId, commentId) => {
    if (!user || !editCommentText.trim()) return;

    try {
      // Update comment in database
      await socialService.updateComment(commentId, editCommentText.trim());

      // Update local state
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].map(c =>
          c.id === commentId
            ? { ...c, text: editCommentText.trim(), content: editCommentText.trim() }
            : c
        )
      }));

      // Reset editing state
      setEditingComment(null);
      setEditCommentText('');

      // Show confirmation
      setConfirmationMessage(t('social.commentUpdated'));
      setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating comment:', error);
      setError(t('social.errorUpdatingComment'));
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (postId, commentId) => {
    if (!user) return;

    // Confirm deletion
    if (!window.confirm(t('social.confirmDeleteComment'))) {
      return;
    }

    setIsDeletingComment(true);
    setActiveCommentMenu(null);

    try {
      // Delete comment from database
      await socialService.deleteComment(commentId);

      // Update local state
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(c => c.id !== commentId)
      }));

      // Update post comment count
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: Math.max((p.comments || 0) - 1, 0)
          };
        }
        return p;
      }));

      // Show confirmation
      setConfirmationMessage(t('social.commentDeleted'));
      setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(t('social.errorDeletingComment'));
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsDeletingComment(false);
    }
  };

  // Handle reply to comment
  const handleReplyToComment = (comment) => {
    setReplyingToComment(comment);
    setActiveCommentMenu(null);

    // Focus on comment input
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  // Handle share post
  const handleSharePost = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Create share URL
      const shareUrl = `${window.location.origin}/social/post/${postId}`;

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.userName}`,
          text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          url: shareUrl
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);

        // Show confirmation
        setConfirmationMessage(t('social.linkCopied'));

        // Clear confirmation message after 3 seconds
        setTimeout(() => {
          setConfirmationMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  // Handle image upload for new post
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('social.imageTooLarge'));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError(t('social.invalidImageType'));
      return;
    }

    setNewPostImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewPostImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!user) return;
    if (!newPostContent.trim() && !newPostImage) {
      setError(t('social.emptyPost'));
      return;
    }

    setIsSubmittingPost(true);
    setError(null);

    try {
      // Extract hashtags from content
      const contentText = newPostContent.replace(/<[^>]*>/g, ' ');
      const hashtagRegex = /#(\w+)/g;
      const extractedTags = contentText.match(hashtagRegex) || [];
      const allHashtags = [...new Set([...postHashtags, ...extractedTags])];

      // Upload image if selected
      let imageUrl = null;
      if (newPostImage) {
        imageUrl = await socialService.uploadPostImage(newPostImage, user.id);
      }

      if (editingPost) {
        // Update existing post
        await socialService.updatePost(editingPost.id, {
          content: newPostContent.trim(),
          imageUrl: imageUrl || editingPost.imageUrl,
          hashtags: allHashtags
        });

        // Show confirmation
        setConfirmationMessage(t('social.postUpdated'));

        // Reset editing state
        setEditingPost(null);
      } else {
        // Create new post
        await socialService.createPost({
          userId: user.id,
          content: newPostContent.trim(),
          imageUrl: imageUrl,
          hashtags: allHashtags,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          userAvatar: user.user_metadata?.avatar_url || '/images/default_avatar.png'
        });

        // Show confirmation
        setConfirmationMessage(t('social.postCreated'));
      }

      // Reset form
      setNewPostContent('');
      setNewPostImage(null);
      setNewPostImagePreview('');
      setPostHashtags([]);

      // Clear confirmation message after 3 seconds
      setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);

      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error('Error creating/updating post:', error);
      setError(error.message || t('social.errorCreatingPost'));
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Handle edit post
  const handleEditPost = (post) => {
    // Close the post menu
    setActivePostMenu(null);

    // Set the post data in the form
    setEditingPost(post);
    setNewPostContent(post.content);
    setPostHashtags(post.hashtags || []);

    if (post.imageUrl) {
      setNewPostImagePreview(post.imageUrl);
    }

    // Scroll to the top to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete post
  const handleDeletePost = async (postId) => {
    if (!user) return;

    // Close the post menu
    setActivePostMenu(null);

    // Confirm deletion
    if (!window.confirm(t('social.confirmDeletePost'))) {
      return;
    }

    setIsDeleting(true);

    try {
      await socialService.deletePost(postId);

      // Remove the post from the local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));

      // Show confirmation
      setConfirmationMessage(t('social.postDeleted'));

      // Clear confirmation message after 3 seconds
      setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error.message || t('social.errorDeletingPost'));

      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsDeleting(false);
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
            className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg flex items-center z-50"
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
            className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg flex items-center z-50"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create/Edit post form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
            {/* Form header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={user?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=U&background=random"}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {editingPost ? t('social.editingPost') : t('social.createPost')}
                  </h3>
                </div>
              </div>

              {editingPost && (
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setNewPostContent('');
                    setNewPostImage(null);
                    setNewPostImagePreview('');
                    setPostHashtags([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Post content input */}
            <div className="mb-3">
              <textarea
                placeholder={t('social.whatsOnYourMind')}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Hashtags input */}
            <div className="mb-3">
              <HashtagInput
                hashtags={postHashtags}
                onChange={setPostHashtags}
                placeholder={t('social.addHashtags')}
                maxTags={5}
              />
            </div>

            {/* Image preview */}
            {newPostImagePreview && (
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <img
                  src={newPostImagePreview}
                  alt="Post preview"
                  className="w-full h-auto max-h-64 object-cover cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setViewingImage(newPostImagePreview)}
                />
                <button
                  onClick={() => {
                    setNewPostImage(null);
                    setNewPostImagePreview('');
                  }}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100 transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Post actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                >
                  <ImageIcon className="w-5 h-5 mr-1" />
                  <span className="text-sm">{t('social.addImage')}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <button
                onClick={handleCreatePost}
                disabled={isSubmittingPost || (!newPostContent.trim() && !newPostImage)}
                className={`px-4 py-2 rounded-lg text-white ${
                  isSubmittingPost || (!newPostContent.trim() && !newPostImage)
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } transition-colors flex items-center`}
              >
                {isSubmittingPost ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : editingPost ? (
                  <Edit2 className="w-4 h-4 mr-2" />
                ) : null}
                {editingPost ? t('social.updatePost') : t('social.post')}
              </button>
            </div>
          </div>

          {/* Feed controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <button
                className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="ml-2">{t('social.sortBy.latest')}</span>
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">{isRefreshing ? t('social.refreshing') : t('social.refresh')}</span>
            </button>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                {t('social.loadingPosts')}
              </span>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                {t('social.noPosts')}
              </div>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('social.createFirstPost')}
              </button>
            </div>
          ) : (
            /* Posts */
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Post header */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img
                          src={post.userPhotoURL || post.userAvatar || "https://ui-avatars.com/api/?name=U&background=random"}
                          alt={post.userName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=U&background=random";
                          }}
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {post.userName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    {post.userId === user?.id ? (
                      <div className="relative">
                        <button
                          onClick={() => setActivePostMenu(activePostMenu === post.id ? null : post.id)}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Post menu */}
                        {activePostMenu === post.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              {t('social.editPost')}
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-750"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('social.deletePost')}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Post content */}
                  <div className="px-4 pb-2">
                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Post image if available */}
                    {post.imageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden cursor-pointer">
                        <img
                          src={post.imageUrl}
                          alt="Post attachment"
                          className="w-full h-auto max-h-96 object-cover transition-transform hover:scale-[1.02]"
                          onClick={() => setViewingImage(post.imageUrl)}
                        />
                      </div>
                    )}

                    {/* Hashtags */}
                    {post.content && post.content.includes('#') && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(post.hashtags && post.hashtags.length > 0
                          ? post.hashtags
                          : post.content.match(/#\w+/g) || []
                        ).map((tag, index) => (
                          <span
                            key={index}
                            className="text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer"
                          >
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post actions */}
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center ${post.liked ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
                      >
                        <Heart className="w-5 h-5" fill={post.liked ? 'currentColor' : 'none'} />
                        <span className="ml-1 text-xs">{post.likes || 0}</span>
                      </button>
                      <button
                        onClick={() => handleCommentToggle(post.id)}
                        className={`flex items-center ${activeCommentPostId === post.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="ml-1 text-xs">{post.comments || 0}</span>
                      </button>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleSavePost(post.id)}
                        className={`text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 ${savedPosts.includes(post.id) ? 'text-blue-500 dark:text-blue-400' : ''}`}
                      >
                        <Bookmark className="w-5 h-5" fill={savedPosts.includes(post.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleSharePost(post.id)}
                        className="text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Comments section */}
                  {activeCommentPostId === post.id && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                      {isLoadingComments ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Comment list */}
                          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                            {comments[post.id] && comments[post.id].length > 0 ? (
                              comments[post.id].map((comment) => (
                                <div key={comment.id || `temp-${Math.random()}`} className="flex space-x-2">
                                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    <img
                                      src={comment.userAvatar || comment.userPhotoURL || "https://ui-avatars.com/api/?name=U&background=random"}
                                      alt={comment.userName || comment.displayName || 'User'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://ui-avatars.com/api/?name=U&background=random";
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    {editingComment && editingComment.id === comment.id ? (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm">
                                        <div className="font-medium text-xs text-gray-900 dark:text-white mb-1">
                                          {comment.userName || comment.displayName || 'User'}
                                        </div>
                                        <textarea
                                          value={editCommentText}
                                          onChange={(e) => setEditCommentText(e.target.value)}
                                          className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          rows={2}
                                          autoFocus
                                        />
                                        <div className="flex justify-end space-x-2 mt-2">
                                          <button
                                            onClick={() => setEditingComment(null)}
                                            className="text-xs px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                          >
                                            {t('social.cancel')}
                                          </button>
                                          <button
                                            onClick={() => handleUpdateComment(post.id, comment.id)}
                                            className="text-xs px-2 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                                          >
                                            {t('social.update')}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm">
                                        <div className="flex justify-between items-start">
                                          <div className="font-medium text-xs text-gray-900 dark:text-white">
                                            {comment.userName || comment.displayName || 'User'}
                                          </div>

                                          {comment.userId === user?.id && (
                                            <div className="relative">
                                              <button
                                                onClick={() => setActiveCommentMenu(activeCommentMenu === comment.id ? null : comment.id)}
                                                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                                              >
                                                <MoreHorizontal className="w-4 h-4" />
                                              </button>

                                              {activeCommentMenu === comment.id && (
                                                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                                  <button
                                                    onClick={() => handleEditComment(comment)}
                                                    className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750"
                                                  >
                                                    <Edit2 className="w-3 h-3 mr-2" />
                                                    {t('social.editComment')}
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                                    className="flex items-center w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-750"
                                                  >
                                                    <Trash2 className="w-3 h-3 mr-2" />
                                                    {t('social.deleteComment')}
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                          {comment.parentId && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 italic">
                                              {t('social.replyingTo')} {
                                                comments[post.id].find(c => c.id === comment.parentId)?.userName ||
                                                comments[post.id].find(c => c.id === comment.parentId)?.displayName ||
                                                'User'
                                              }
                                            </div>
                                          )}
                                          {comment.text || comment.content || ''}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center text-xs text-gray-500 mt-1 ml-2 space-x-3">
                                      <span>{formatDate(comment.createdAt)}</span>
                                      <button
                                        onClick={() => handleReplyToComment(comment)}
                                        className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                                      >
                                        {t('social.reply')}
                                      </button>
                                    </div>

                                    {/* Show reply indicator */}
                                    {replyingToComment && replyingToComment.id === comment.id && (
                                      <div className="mt-2 ml-2 text-xs text-blue-500 dark:text-blue-400 italic">
                                        {t('social.replyingToComment')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                {t('social.noComments')}
                              </div>
                            )}
                          </div>

                          {/* Comment input */}
                          <div className="flex flex-col space-y-2">
                            {replyingToComment && (
                              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {t('social.replyingTo')} <span className="font-medium">{replyingToComment.userName || replyingToComment.displayName || 'User'}</span>
                                </div>
                                <button
                                  onClick={() => setReplyingToComment(null)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                <img
                                  src={user?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=U&background=random"}
                                  alt="Your avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  ref={commentInputRef}
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder={replyingToComment ? t('social.writeReply') : t('social.writeComment')}
                                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 pr-10 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleCommentSubmit(post.id);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleCommentSubmit(post.id)}
                                  disabled={isSubmittingComment || !commentText.trim()}
                                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                    isSubmittingComment || !commentText.trim()
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-blue-500 hover:text-blue-600'
                                  }`}
                                >
                                  {isSubmittingComment ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <Send className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 hidden lg:block">
          {/* Message Notifications */}
          <MessageNotifications />

          {/* Trending topics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                {t('social.trendingTopics')}
              </h3>
            </div>

            {isLoadingTopics ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={topic.id || index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg cursor-pointer"
                  >
                    <span className="text-blue-600 dark:text-blue-400 text-sm">{topic.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{topic.count} posts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User search and suggestions */}
          <UserSearchSidebar />
        </div>
      </div>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewingImage && (
          <ImageViewer
            imageUrl={viewingImage}
            onClose={() => setViewingImage(null)}
          />
        )}
      </AnimatePresence>

      {/* Chat floating button */}
      <ChatFloatingButton />
    </div>
  );
};

export default SimpleModernSocialFeed;
