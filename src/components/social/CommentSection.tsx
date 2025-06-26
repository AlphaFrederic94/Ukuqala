import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService, Comment } from '../../lib/socialService';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onCommentAdded?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, isOpen, onCommentAdded }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!isOpen) return;

    console.log('Loading comments for post:', postId);
    setIsLoading(true);
    setError(null);

    try {
      const commentsData = await socialService.getCommentsByPostId(postId);
      console.log('Comments data received:', commentsData);

      // Ensure each comment has proper user data
      const commentsWithUserData = await Promise.all(
        commentsData.map(async (comment) => {
          console.log('Processing comment:', comment);

          if (comment.user && comment.user.full_name) {
            console.log('Comment already has user data:', comment.user);
            return comment;
          }

          // Fetch user data if missing
          try {
            console.log('Fetching user data for comment user_id:', comment.user_id);
            const { data: userData, error } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', comment.user_id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching user data:', error);
              return {
                ...comment,
                user: { full_name: 'User', avatar_url: null }
              };
            }

            if (userData) {
              console.log('User data found:', userData);
              return {
                ...comment,
                user: userData
              };
            }
          } catch (error) {
            console.error('Error fetching comment user data:', error);
          }

          console.log('Returning comment with default user data');
          return {
            ...comment,
            user: { full_name: 'User', avatar_url: null }
          };
        })
      );

      console.log('Setting comments with user data:', commentsWithUserData);
      setComments(commentsWithUserData);
    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError(err.message || t('social.errorLoadingComments'));
    } finally {
      setIsLoading(false);
    }
  }, [postId, t, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadComments();

      // Set up real-time subscription for comments
      const commentsSubscription = supabase
        .channel(`comments-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'post_comments',
            filter: `post_id=eq.${postId}`
          },
          (payload) => {
            console.log('Comment change detected:', payload);
            loadComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(commentsSubscription);
      };
    }
  }, [isOpen, postId, loadComments]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComment(e.target.value);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.log('Cannot submit comment: User not logged in');
      return;
    }
    if (!newComment.trim()) {
      console.log('Cannot submit empty comment');
      return;
    }

    console.log('Submitting comment for post:', postId, 'by user:', user.id);
    setIsSubmitting(true);
    setError(null);

    try {
      const comment = await socialService.createComment(postId, user.id, newComment);
      console.log('Comment created:', comment);

      // Add user info to the comment for display
      const commentWithUser = {
        ...comment,
        user: {
          full_name: user?.full_name || 'User',
          avatar_url: user?.avatar_url || '/images/default_user.jpg'
        }
      };

      // Also fetch the user profile from the database to ensure it exists
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

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
        }
      } catch (err) {
        console.error('Error checking/creating user profile:', err);
      }

      console.log('Adding comment with user data to state:', commentWithUser);
      setComments(prev => [...prev, commentWithUser]);
      setNewComment('');

      // Update the comment count in the parent component
      // This is a workaround since we don't have direct access to update the post's comment count
      console.log('Comment added successfully');

      // Notify parent component that a comment was added
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      console.error('Error creating comment:', err);
      setError(err.message || t('social.errorCreatingComment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="border-t border-gray-100 dark:border-gray-700 pt-4 px-5 pb-5 bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm"
    >
      {/* Comments list */}
      <div className="mb-4 max-h-80 overflow-y-auto social-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : comments.length > 0 ? (
          <AnimatePresence>
            {comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex mb-3"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700 shadow-sm">
                  <img
                    src={comment.user?.avatar_url || '/images/default_user.jpg'}
                    alt={comment.user?.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-2 flex-grow">
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="font-medium text-sm text-gray-900 dark:text-white social-text-gradient-blue">
                      {comment.user?.full_name || 'User'}
                    </div>
                    <div className="text-gray-800 dark:text-gray-200 text-sm">
                      {comment.content}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {t('social.noComments')}
            </p>
            <p className="text-blue-500 dark:text-blue-400 text-sm font-medium">
              {t('social.beFirstToComment')}
            </p>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm text-center mt-2">
            {error}
          </div>
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmitComment} className="flex items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700 shadow-sm">
          <img
            src={user?.avatar_url || '/images/default_user.jpg'}
            alt={user?.full_name || 'User'}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="ml-2 flex-grow relative">
          <input
            type="text"
            placeholder={t('social.writeComment')}
            value={newComment}
            onChange={handleCommentChange}
            className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white pr-10 transition-all duration-300"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CommentSection;
