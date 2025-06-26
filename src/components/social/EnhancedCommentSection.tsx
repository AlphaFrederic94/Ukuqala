import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../lib/socialService';
import {
  Heart,
  Reply,
  MoreHorizontal,
  Trash2,
  Edit,
  Send,
  Smile,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AtSign
} from 'lucide-react';
import SimpleTimeAgo from './SimpleTimeAgo';
import SimpleLinkify from './SimpleLinkify';
import SimpleEmojiPicker from './SimpleEmojiPicker';

interface EnhancedCommentSectionProps {
  postId: string;
  onClose: () => void;
}

const EnhancedCommentSection: React.FC<EnhancedCommentSectionProps> = ({ postId, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showAllComments, setShowAllComments] = useState(true);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const commentInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Load comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const commentsData = await socialService.getCommentsByPostId(postId);
        setComments(commentsData);
      } catch (err: any) {
        console.error('Error fetching comments:', err);
        setError(err.message || t('social.errorFetchingComments'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [postId, t]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (commentSectionRef.current && !isLoading) {
      commentSectionRef.current.scrollTop = commentSectionRef.current.scrollHeight;
    }
  }, [comments, isLoading]);

  // Handle emoji selection
  const handleEmojiClick = (emoji: string) => {

    if (editingCommentId) {
      setEditedContent(prev => prev + emoji);
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    } else if (replyingToId) {
      setReplyContent(prev => prev + emoji);
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    } else {
      setNewComment(prev => prev + emoji);
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }

    setShowEmojiPicker(false);
  };

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const createdComment = await socialService.createComment(postId, user.id, newComment);

      // Add user info to the created comment
      const commentWithUser = {
        ...createdComment,
        user: {
          full_name: user.full_name,
          avatar_url: user.avatar_url
        }
      };

      setComments(prev => [...prev, commentWithUser]);
      setNewComment('');
    } catch (err: any) {
      console.error('Error creating comment:', err);
      setError(err.message || t('social.errorCreatingComment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing comment
  const handleEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);

    // Focus the edit input after it renders
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 0);
  };

  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editedContent.trim()) return;

    try {
      const updatedComment = await socialService.updateComment(commentId, editedContent);

      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? { ...comment, content: editedContent, updated_at: updatedComment.updated_at }
            : comment
        )
      );

      setEditingCommentId(null);
      setEditedContent('');
    } catch (err: any) {
      console.error('Error updating comment:', err);
      setError(err.message || t('social.errorUpdatingComment'));
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t('social.confirmDeleteComment'))) return;

    try {
      await socialService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError(err.message || t('social.errorDeletingComment'));
    }
  };

  // Start replying to comment
  const handleReplyToComment = (commentId: string) => {
    setReplyingToId(commentId);

    // Focus the reply input after it renders
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 0);
  };

  // Submit reply
  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();

    if (!user) return;
    if (!replyContent.trim()) return;

    try {
      // In a real app, you would have a proper reply system
      // For now, we'll just create a new comment that mentions the user
      const parentComment = comments.find(c => c.id === parentCommentId);
      const replyText = `@${parentComment?.user?.full_name?.replace(/\s+/g, '')} ${replyContent}`;

      const createdReply = await socialService.createComment(postId, user.id, replyText);

      // Add user info to the created reply
      const replyWithUser = {
        ...createdReply,
        user: {
          full_name: user.full_name,
          avatar_url: user.avatar_url
        }
      };

      setComments(prev => [...prev, replyWithUser]);
      setReplyingToId(null);
      setReplyContent('');
    } catch (err: any) {
      console.error('Error creating reply:', err);
      setError(err.message || t('social.errorCreatingReply'));
    }
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyContent('');
  };

  // Like comment (placeholder)
  const handleLikeComment = (commentId: string) => {
    // In a real app, you would call a service to like the comment
    console.log('Liking comment:', commentId);
  };



  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('social.comments')}
          </h3>
          <button
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div
          ref={commentSectionRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 social-scrollbar"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {t('social.noComments')}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {t('social.beFirstToComment')}
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {!showAllComments && comments.length > 3 && (
                <button
                  className="w-full text-center text-blue-600 dark:text-blue-400 hover:underline py-2"
                  onClick={() => setShowAllComments(true)}
                >
                  {t('social.showAllComments', { count: comments.length })}
                  <ChevronDown className="w-4 h-4 inline ml-1" />
                </button>
              )}

              {(showAllComments ? comments : comments.slice(-3)).map((comment) => (
                <div key={comment.id} className="relative">
                  <div className="flex items-start group">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={comment.user?.avatar_url || '/images/default_user.jpg'}
                        alt={comment.user?.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="ml-3 flex-1">
                      <div className={`rounded-2xl px-4 py-2 ${
                        editingCommentId === comment.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.user?.full_name || 'User'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              <SimpleTimeAgo date={comment.created_at} />
                              {comment.updated_at !== comment.created_at && (
                                <span className="ml-1">({t('social.edited')})</span>
                              )}
                            </span>
                          </div>

                          {user && (user.id === comment.user_id) && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                onClick={() => handleEditComment(comment)}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="mt-1">
                            <input
                              ref={editInputRef}
                              type="text"
                              className="social-input"
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(comment.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                onClick={handleCancelEdit}
                              >
                                {t('common.cancel')}
                              </button>
                              <button
                                className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
                                onClick={() => handleSaveEdit(comment.id)}
                              >
                                {t('common.save')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-gray-800 dark:text-gray-200 break-words">
                            <SimpleLinkify>{comment.content}</SimpleLinkify>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center mt-1 ml-1 text-xs">
                        <button
                          className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 mr-3"
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          {t('social.like')}
                        </button>
                        <button
                          className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          onClick={() => handleReplyToComment(comment.id)}
                        >
                          {t('social.reply')}
                        </button>
                        <span className="text-gray-400 dark:text-gray-500 ml-auto">
                          {comment.likes_count || 0} {t('social.likes')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reply Form */}
                  <AnimatePresence>
                    {replyingToId === comment.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-12 mt-2"
                      >
                        <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="flex items-center">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src={user?.avatar_url || '/images/default_user.jpg'}
                              alt={user?.full_name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 ml-2 relative">
                            <input
                              ref={replyInputRef}
                              type="text"
                              className="social-input pr-20"
                              placeholder={t('social.replyTo', { name: comment.user?.full_name || 'User' })}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  handleCancelReply();
                                }
                              }}
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                              <button
                                type="button"
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              >
                                <Smile className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="ml-2 flex items-center space-x-1">
                            <button
                              type="button"
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded"
                              onClick={handleCancelReply}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button
                              type="submit"
                              className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded"
                              disabled={!replyContent.trim()}
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {showAllComments && comments.length > 3 && (
                <button
                  className="w-full text-center text-blue-600 dark:text-blue-400 hover:underline py-2"
                  onClick={() => setShowAllComments(false)}
                >
                  {t('social.showFewerComments')}
                  <ChevronUp className="w-4 h-4 inline ml-1" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmitComment} className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={user?.avatar_url || '/images/default_user.jpg'}
                alt={user?.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 ml-3 relative">
              <input
                ref={commentInputRef}
                type="text"
                className="social-input pr-24"
                placeholder={t('social.writeComment')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <AtSign className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="ml-3 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-16 right-4 z-10"
              >
                <SimpleEmojiPicker onEmojiClick={handleEmojiClick} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCommentSection;
