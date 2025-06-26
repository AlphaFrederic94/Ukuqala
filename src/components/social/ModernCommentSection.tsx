import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import {
  Send,
  Smile,
  Image as ImageIcon,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  Heart,
  Loader2,
  X
} from 'lucide-react';
import TimeAgo from 'react-timeago';

interface ModernCommentSectionProps {
  postId: string;
}

const ModernCommentSection: React.FC<ModernCommentSectionProps> = ({ postId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();

  // State
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Refs
  const commentInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;

      try {
        setIsLoading(true);
        const fetchedComments = await socialService.getComments(postId);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError(t('social.errorFetchingComments'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();

    // Set up real-time listener
    const unsubscribe = socialService.subscribeToComments(postId, (updatedComments) => {
      setComments(updatedComments);
    });

    return () => {
      unsubscribe();
    };
  }, [postId, socialService, t]);

  // Focus input when replying
  useEffect(() => {
    if (replyTo && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [replyTo]);

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !commentText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const commentData = {
        postId,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        userAvatar: user.user_metadata?.avatar_url || '/images/default_avatar.png',
        text: commentText.trim(),
        parentId: replyTo?.id || null
      };

      await socialService.addComment(commentData);

      // Play sound effect
      const audio = new Audio('/sounds/comment.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.error('Error playing sound:', e));

      // Reset form
      setCommentText('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(t('social.errorAddingComment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment edit
  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await socialService.updateComment(commentId, editText.trim());
      setEditingCommentId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      setError(t('social.errorUpdatingComment'));
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t('social.confirmDeleteComment'))) return;

    try {
      await socialService.deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(t('social.errorDeletingComment'));
    }
  };

  // Handle like comment
  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      // Update local state immediately for better UX
      setComments(prevComments => prevComments.map(c => {
        if (c.id === commentId) {
          const newLikeCount = c.liked ? Math.max((c.likes || 0) - 1, 0) : (c.likes || 0) + 1;
          return { ...c, liked: !c.liked, likes: newLikeCount };
        }
        return c;
      }));

      // Then update in the database
      if (comment.liked) {
        await socialService.unlikeComment(commentId, user.id);
      } else {
        await socialService.likeComment(commentId, user.id);
      }
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
    }
  };

  // Render comment
  const renderComment = (comment: any, isReply = false) => {
    const isEditing = editingCommentId === comment.id;
    const canModify = user && (comment.userId === user.id);

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isReply ? 'ml-8 mt-2' : 'mt-3'}`}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={comment.userAvatar || '/images/default_avatar.png'}
            alt={comment.userName}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="ml-2 flex-grow">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {comment.userName}
              </span>

              {canModify && (
                <div className="relative">
                  <button
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full"
                    onClick={() => {
                      if (isEditing) {
                        setEditingCommentId(null);
                      } else {
                        setEditingCommentId(comment.id);
                        setEditText(comment.text);
                      }
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
                      >
                        <button
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditText(comment.text);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          {t('social.edit')}
                        </button>

                        <button
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('social.delete')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-1">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  autoFocus
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    onClick={() => setEditingCommentId(null)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleEditComment(comment.id)}
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line">
                {comment.text}
              </p>
            )}
          </div>

          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400 space-x-3">
            <TimeAgo date={comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)} />

            <button
              className="hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => setReplyTo({ id: comment.id, userName: comment.userName })}
            >
              {t('social.reply')}
            </button>

            <button
              className={`flex items-center ${comment.liked ? 'text-red-500' : 'hover:text-gray-700 dark:hover:text-gray-300'}`}
              onClick={() => handleLikeComment(comment.id)}
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.liked ? 'fill-current' : ''}`} />
              {comment.likes || 0}
            </button>

            {comment.edited && (
              <span className="italic">{t('social.edited')}</span>
            )}
          </div>

          {/* Render replies */}
          {comment.replies && comment.replies.map((reply: any) => renderComment(reply, true))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 p-4">
      {/* Reply indicator */}
      {replyTo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md mb-3 flex justify-between items-center">
          <span className="text-sm text-blue-600 dark:text-blue-400">
            {t('social.replyingTo')} <span className="font-medium">{replyTo.userName}</span>
          </span>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={() => setReplyTo(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmitComment} className="flex items-center">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={user?.user_metadata?.avatar_url || '/images/default_avatar.png'}
            alt={user?.user_metadata?.full_name || 'User'}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-grow mx-2 relative">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={replyTo ? t('social.writeReply') : t('social.writeComment')}
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={!commentText.trim() || isSubmitting}
          className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Comments list */}
      <div className="mt-3">
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {t('social.loadingComments')}
            </span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            {t('social.noComments')}
          </div>
        ) : (
          <div>
            {/* Only show top-level comments here */}
            {comments
              .filter(comment => !comment.parentId)
              .map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernCommentSection;
