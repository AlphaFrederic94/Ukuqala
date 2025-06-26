import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Image as ImageIcon, Smile, Send, X, Edit2, Trash2,
  Copy, Flag, UserPlus, Clock, ChevronDown, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SafeTimeAgo from '../ui/SafeTimeAgo';
import RichTextEditor from './RichTextEditor';
import ImageGallery from './ImageGallery';
import ModernCommentSection from './ModernCommentSection';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useTranslation } from 'react-i18next';

interface ModernPostCardProps {
  post: any;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onSave: (postId: string) => void;
  onEdit?: (post: any) => void;
  onDelete?: (postId: string) => void;
  savedPosts?: string[];
  showComments?: boolean;
}

const ModernPostCard: React.FC<ModernPostCardProps> = ({
  post,
  onLike,
  onComment,
  onSave,
  onEdit,
  onDelete,
  savedPosts = [],
  showComments = false,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();

  // State
  const [showMenu, setShowMenu] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  // Check if post is saved
  const isSaved = savedPosts.includes(post.id);

  // Check if user is the author
  const isAuthor = user?.id === post.userId;

  // Format hashtags and mentions for display
  const formatContent = (content: string) => {
    if (!content) return '';

    // Replace hashtags with links
    let formattedContent = content.replace(
      /#(\w+)/g,
      '<a href="/social/hashtag/$1" class="text-blue-500 hover:underline">#$1</a>'
    );

    // Replace mentions with links
    formattedContent = formattedContent.replace(
      /@(\w+)/g,
      '<a href="/social/profile/$1" class="text-blue-500 hover:underline">@$1</a>'
    );

    // Replace URLs with links
    formattedContent = formattedContent.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
    );

    return formattedContent;
  };

  // Handle copy link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/social/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareOptions(false);
    setShowMenu(false);
  };

  // Handle image click
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 mb-4 transform transition-all hover:shadow-md"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to={`/social/profile/${post.userId}`} className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 dark:border-blue-900 shadow-sm">
              <img
                src={post.userAvatar || '/images/default_avatar.png'}
                alt={post.userName}
                className="w-full h-full object-cover"
              />
            </div>
            {post.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </Link>

          <div className="ml-3">
            <Link to={`/social/profile/${post.userId}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
              {post.userName}
            </Link>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <SafeTimeAgo date={post.createdAt} />
              {post.editedAt && (
                <span className="ml-2 italic">• {t('social.edited')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
              >
                <div className="py-1">
                  {isAuthor && onEdit && (
                    <button
                      onClick={() => {
                        onEdit(post);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit2 className="w-4 h-4 mr-3" />
                      {t('social.editPost')}
                    </button>
                  )}

                  {isAuthor && onDelete && (
                    <button
                      onClick={() => {
                        onDelete(post.id);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="w-4 h-4 mr-3" />
                      {t('social.deletePost')}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowShareOptions(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Share2 className="w-4 h-4 mr-3" />
                    {t('social.sharePost')}
                  </button>

                  <button
                    onClick={() => {
                      onSave(post.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isSaved ? (
                      <>
                        <Bookmark className="w-4 h-4 mr-3 text-blue-500 fill-blue-500" />
                        {t('social.unsavePost')}
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-3" />
                        {t('social.savePost')}
                      </>
                    )}
                  </button>

                  {!isAuthor && (
                    <button
                      onClick={() => {
                        // Report post functionality
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Flag className="w-4 h-4 mr-3" />
                      {t('social.reportPost')}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showShareOptions && (
              <motion.div
                ref={shareRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
              >
                <div className="py-1">
                  <button
                    onClick={handleCopyLink}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-3 text-green-500" />
                        {t('social.linkCopied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-3" />
                        {t('social.copyLink')}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {post.content && (
          <div
            className="mb-3 text-gray-800 dark:text-gray-200 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
          />
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.hashtags.map((tag: string, index: number) => (
              <Link
                key={index}
                to={`/social/hashtag/${tag.replace('#', '')}`}
                className="text-blue-500 hover:underline text-sm bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Images */}
        {post.imageUrl && (
          <div
            className="rounded-lg overflow-hidden mb-3 cursor-pointer"
            onClick={() => handleImageClick(0)}
          >
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full h-auto object-cover max-h-96 hover:opacity-95 transition-opacity"
            />
          </div>
        )}

        {/* Multiple Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-3">
            <ImageGallery
              images={post.images}
              onImageClick={handleImageClick}
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <span className="flex items-center">
            <Heart className="w-4 h-4 mr-1 text-red-500 fill-red-500" />
            {post.likes || 0}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{post.comments || 0} {t('social.comments')}</span>
          <span>{post.shares || 0} {t('social.shares')}</span>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-2 py-1 border-t border-gray-100 dark:border-gray-700 flex justify-between">
        <button
          onClick={() => onLike(post.id)}
          className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg transition-colors ${
            post.liked
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Heart className={`w-5 h-5 mr-2 ${post.liked ? 'fill-red-500' : ''}`} />
          {t('social.like')}
        </button>

        <button
          onClick={() => onComment(post.id)}
          className="flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          {t('social.comment')}
        </button>

        <button
          onClick={() => setShowShareOptions(!showShareOptions)}
          className="flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Share2 className="w-5 h-5 mr-2" />
          {t('social.share')}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <ModernCommentSection postId={post.id} />
      )}
    </motion.div>
  );
};

export default ModernPostCard;
