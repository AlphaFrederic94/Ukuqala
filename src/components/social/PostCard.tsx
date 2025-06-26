import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Post } from '../../lib/socialService';
import { useTranslation } from 'react-i18next';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onComment: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onUnlike,
  onComment,
  onEdit,
  onDelete,
  onShare
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const [isLiked, setIsLiked] = useState(post.liked_by_user || false);
  // Use the direct count from the post
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  // Update state when props change
  useEffect(() => {
    console.log('PostCard received updated post:', post.id, 'likes:', post.likes_count, 'comments:', post.comments_count);
    setIsLiked(post.liked_by_user || false);
    setLikesCount(post.likes_count || 0);
  }, [post.liked_by_user, post.likes_count, post.id]);

  const handleLikeClick = () => {
    console.log('Like button clicked for post:', post.id, 'Current liked status:', isLiked);

    if (isLiked) {
      console.log('Unliking post:', post.id);
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      onUnlike(post.id);
    } else {
      console.log('Liking post:', post.id);
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      onLike(post.id);
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const isOwner = user?.id === post.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3, boxShadow: '0 14px 28px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.05)' }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm overflow-hidden mb-4 relative"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-tr-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      {/* Post header */}
      <div className="p-5 flex justify-between items-center relative z-10">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-700 shadow-md transform transition-transform duration-300 hover:scale-105">
            <img
              src={post.user?.avatar_url || '/images/default_user.jpg'}
              alt={post.user?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900 dark:text-white social-text-gradient-blue">
              {post.user?.full_name || 'User'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button
              onClick={toggleOptions}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-all duration-300 hover:rotate-12" />
            </button>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 py-1 border border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => {
                      onEdit(post.id);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('social.edit')}
                  </button>
                  <button
                    onClick={() => {
                      onDelete(post.id);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
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

      {/* Post content */}
      <div className="px-5 pb-4 relative z-10">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">{post.content}</p>
      </div>

      {/* Post image (if any) */}
      {post.image_url && (
        <div className="w-full mt-3 rounded-lg overflow-hidden shadow-md transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-lg">
          <div className="relative group">
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
      )}

      {/* Post stats */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm relative z-10">
        <span className="flex items-center group">
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'text-red-500 fill-current' : ''} transition-transform duration-300 group-hover:scale-110`} />
          <span className="transition-colors duration-300 group-hover:text-red-500 dark:group-hover:text-red-400">{likesCount} {t('social.likes')}</span>
        </span>
        <span className="flex items-center group">
          <MessageCircle className="w-4 h-4 mr-1 transition-transform duration-300 group-hover:scale-110" />
          <span className="transition-colors duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400">{post.comments_count || 0} {t('social.comments')}</span>
        </span>
      </div>

      {/* Post actions */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-around relative z-10">
        <div className="absolute left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-100 to-transparent dark:from-gray-800/50 dark:to-transparent opacity-50 z-0"></div>
        <button
          onClick={handleLikeClick}
          className={`flex items-center justify-center px-4 py-3 rounded-md transition-all duration-300 z-10 ${
            isLiked
              ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
          }`}
        >
          <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''} transition-transform duration-300 group-hover:scale-110`} />
          {t('social.like')}
        </button>

        <button
          onClick={() => onComment(post.id)}
          className={`flex items-center justify-center px-4 py-3 rounded-md transition-all duration-300 hover:scale-105 z-10 ${post.comments_count > 0 ?
            'text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' :
            'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <MessageCircle className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
          {post.comments_count > 0 ? t('social.viewComments') : t('social.comment')}
        </button>

        <button
          onClick={() => onShare(post.id)}
          className="flex items-center justify-center px-4 py-3 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 z-10"
        >
          <Share2 className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
          {t('social.share')}
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;
