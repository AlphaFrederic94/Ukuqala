import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../lib/socialService';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  Flag,
  Trash2,
  Edit,
  Image as ImageIcon,
  Smile,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Link2,
  ExternalLink,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  AtSign
} from 'lucide-react';
import SimpleTimeAgo from './SimpleTimeAgo';
import SimpleLinkify from './SimpleLinkify';
import HashtagHighlighter from './HashtagHighlighter';

interface EnhancedPostCardProps {
  post: any;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isCommentSectionOpen: boolean;
}

const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({
  post,
  onLike,
  onUnlike,
  onComment,
  onShare,
  onDelete,
  isCommentSectionOpen
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.liked_by_user || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [showAllContent, setShowAllContent] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reactions, setReactions] = useState([
    { id: 1, name: 'like', count: likesCount, icon: <Heart className="w-4 h-4" /> },
    { id: 2, name: 'love', count: Math.floor(Math.random() * 10), icon: '❤️' },
    { id: 3, name: 'care', count: Math.floor(Math.random() * 5), icon: '🤗' },
    { id: 4, name: 'haha', count: Math.floor(Math.random() * 8), icon: '😄' },
    { id: 5, name: 'wow', count: Math.floor(Math.random() * 3), icon: '😮' },
    { id: 6, name: 'sad', count: Math.floor(Math.random() * 2), icon: '😢' },
  ]);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState('like');
  const [isHoveringReaction, setIsHoveringReaction] = useState(false);

  // Check if content is too long
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [post.content]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update likes count when post changes
  useEffect(() => {
    setIsLiked(post.liked_by_user || false);
    setLikesCount(post.likes_count || 0);

    // Update the reactions array
    setReactions(prev =>
      prev.map(reaction =>
        reaction.name === 'like'
          ? { ...reaction, count: post.likes_count || 0 }
          : reaction
      )
    );
  }, [post.liked_by_user, post.likes_count]);

  const handleLikeClick = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      onUnlike(post.id);

      // Update reactions
      setReactions(prev =>
        prev.map(reaction =>
          reaction.name === selectedReaction
            ? { ...reaction, count: Math.max(0, reaction.count - 1) }
            : reaction
        )
      );
      setSelectedReaction('like');
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      onLike(post.id);

      // Update reactions
      setReactions(prev =>
        prev.map(reaction =>
          reaction.name === 'like'
            ? { ...reaction, count: reaction.count + 1 }
            : reaction
        )
      );
    }
  };

  const handleReactionSelect = (reactionName: string) => {
    if (selectedReaction === reactionName && isLiked) {
      // Removing the reaction
      setIsLiked(false);
      setReactions(prev =>
        prev.map(reaction =>
          reaction.name === reactionName
            ? { ...reaction, count: Math.max(0, reaction.count - 1) }
            : reaction
        )
      );
      setSelectedReaction('like');
      onUnlike(post.id);
    } else {
      // Adding or changing reaction
      if (isLiked && selectedReaction !== reactionName) {
        // Change reaction type
        setReactions(prev =>
          prev.map(reaction => {
            if (reaction.name === selectedReaction) {
              return { ...reaction, count: Math.max(0, reaction.count - 1) };
            } else if (reaction.name === reactionName) {
              return { ...reaction, count: reaction.count + 1 };
            }
            return reaction;
          })
        );
      } else if (!isLiked) {
        // New reaction
        setIsLiked(true);
        setReactions(prev =>
          prev.map(reaction =>
            reaction.name === reactionName
              ? { ...reaction, count: reaction.count + 1 }
              : reaction
          )
        );
        onLike(post.id);
      }
      setSelectedReaction(reactionName);
    }
    setShowReactions(false);
  };

  const handleSaveClick = () => {
    setIsSaved(!isSaved);
    // In a real app, you would call a service to save/unsave the post
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    setIsMenuOpen(false);
  };

  const handleEditClick = () => {
    // Navigate to edit post page or open edit modal
    navigate(`/social/edit-post/${post.id}`);
    setIsMenuOpen(false);
  };

  const handleReportClick = () => {
    // Open report modal or navigate to report page
    alert(t('social.reportConfirmation'));
    setIsMenuOpen(false);
  };

  const handleShareClick = () => {
    setIsShareMenuOpen(!isShareMenuOpen);
  };

  const handleShareOption = (platform: string) => {
    let shareUrl = '';
    const postUrl = `${window.location.origin}/social/post/${post.id}`;

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.content.substring(0, 100))}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl);
        alert(t('social.linkCopied'));
        setIsShareMenuOpen(false);
        return;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }

    onShare(post.id);
    setIsShareMenuOpen(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);

    try {
      await socialService.createComment(post.id, user.id, newComment);
      setNewComment('');
      // In a real app, you would update the comments list
      onComment(post.id);
    } catch (err) {
      console.error('Error creating comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };



  return (
    <motion.div
      className="social-card overflow-visible relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3, boxShadow: '0 14px 28px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.05)' }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-tr-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>

      {/* Post Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 relative z-10">
        <div className="flex items-center">
          <div
            className="w-12 h-12 rounded-full overflow-hidden cursor-pointer ring-2 ring-white dark:ring-gray-700 shadow-md transform transition-transform duration-300 hover:scale-105"
            onClick={() => navigate(`/social/profile/${post.user_id}`)}
          >
            <img
              src={post.user?.avatar_url || '/images/default_user.jpg'}
              alt={post.user?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <h3
                className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline text-gradient-blue"
                onClick={() => navigate(`/social/profile/${post.user_id}`)}
              >
                {post.user?.full_name || 'User'}
              </h3>
              {post.user?.is_verified && (
                <span className="ml-1 text-blue-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </span>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <SimpleTimeAgo date={post.created_at} />
              {post.location && (
                <>
                  <span className="mx-1">•</span>
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{post.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-300 hover:rotate-12"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
              >
                <div className="py-1">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleSaveClick}
                  >
                    <Bookmark className="w-4 h-4 mr-3" />
                    {isSaved ? t('social.unsave') : t('social.save')}
                  </button>

                  {user && post.user_id === user.id && (
                    <>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleEditClick}
                      >
                        <Edit className="w-4 h-4 mr-3" />
                        {t('social.edit')}
                      </button>

                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleDeleteClick}
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        {t('social.delete')}
                      </button>
                    </>
                  )}

                  {(!user || post.user_id !== user.id) && (
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleReportClick}
                    >
                      <Flag className="w-4 h-4 mr-3" />
                      {t('social.report')}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-5 relative z-10">
        <div
          ref={contentRef}
          className={`text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed ${
            !showAllContent && contentHeight > 300 ? 'max-h-[300px] overflow-hidden' : ''
          }`}
        >
          <HashtagHighlighter text={post.content} />
        </div>

        {contentHeight > 300 && (
          <button
            className="mt-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center transition-all duration-300 hover:translate-y-1"
            onClick={() => setShowAllContent(!showAllContent)}
          >
            {showAllContent ? (
              <>
                {t('social.showLess')}
                <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                {t('social.showMore')}
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        )}

        {post.image_url && (
          <div className="mt-4 rounded-lg overflow-hidden shadow-md transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-lg">
            <div className="relative group">
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-3">
              <button className="text-white bg-black/30 p-2 rounded-full backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center">
          <div className="flex -space-x-1">
            {reactions
              .filter(reaction => reaction.count > 0)
              .slice(0, 3)
              .map((reaction, index) => (
                <div
                  key={reaction.id}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm transform transition-transform duration-300 hover:scale-110 ${
                    typeof reaction.icon === 'string' ? 'text-lg' : ''
                  } ${
                    index === 0 ? 'bg-gradient-to-br from-red-400 to-red-600' :
                    index === 1 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                    'bg-gradient-to-br from-yellow-400 to-yellow-600'
                  } text-white`}
                >
                  {typeof reaction.icon === 'string' ? reaction.icon : reaction.icon}
                </div>
              ))}
          </div>
          <button
            className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:underline transition-all duration-300 hover:text-blue-500 dark:hover:text-blue-400"
            onClick={() => navigate(`/social/post/${post.id}/likes`)}
          >
            {likesCount > 0 ? (
              <>
                {likesCount} {likesCount === 1 ? t('social.reaction') : t('social.reactions')}
              </>
            ) : (
              t('social.beFirstToReact')
            )}
          </button>
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <button
            className="hover:underline transition-all duration-300 hover:text-blue-500 dark:hover:text-blue-400"
            onClick={() => onComment(post.id)}
          >
            {post.comments_count || 0} {(post.comments_count || 0) === 1 ? t('social.comment') : t('social.comments')}
          </button>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex relative z-10">
        <div className="absolute left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-100 to-transparent dark:from-gray-800/50 dark:to-transparent opacity-50 z-0"></div>
        <div className="relative flex-1">
          <button
            className={`flex items-center justify-center w-full py-3 rounded-md transition-all duration-300 z-10 ${
              isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105'
            }`}
            onClick={handleLikeClick}
            onMouseEnter={() => setIsHoveringReaction(true)}
            onMouseLeave={() => {
              if (!showReactions) {
                setIsHoveringReaction(false);
              }
            }}
          >
            {isLiked ? (
              selectedReaction === 'like' ? (
                <Heart className="w-5 h-5 fill-current" />
              ) : (
                <span className="text-xl">
                  {reactions.find(r => r.name === selectedReaction)?.icon || '❤️'}
                </span>
              )
            ) : (
              <Heart className="w-5 h-5" />
            )}
            <span className="ml-2">{isLiked ? t(`social.${selectedReaction}d`) : t('social.like')}</span>
          </button>

          <AnimatePresence>
            {(isHoveringReaction || showReactions) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -50 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-10"
                onMouseEnter={() => {
                  setIsHoveringReaction(true);
                  setShowReactions(true);
                }}
                onMouseLeave={() => {
                  setIsHoveringReaction(false);
                  setShowReactions(false);
                }}
              >
                <div className="flex space-x-1">
                  {reactions.map(reaction => (
                    <button
                      key={reaction.id}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform hover:scale-125 ${
                        isLiked && selectedReaction === reaction.name ? 'bg-gray-100 dark:bg-gray-700 scale-125' : ''
                      }`}
                      onClick={() => handleReactionSelect(reaction.name)}
                      title={t(`social.${reaction.name}`)}
                    >
                      {typeof reaction.icon === 'string' ? reaction.icon : reaction.icon}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="flex items-center justify-center flex-1 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-300 hover:scale-105 z-10"
          onClick={() => onComment(post.id)}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="ml-2">{t('social.comment')}</span>
        </button>

        <div className="relative flex-1" ref={shareMenuRef}>
          <button
            className="flex items-center justify-center w-full py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-300 hover:scale-105 z-10"
            onClick={handleShareClick}
          >
            <Share2 className="w-5 h-5" />
            <span className="ml-2">{t('social.share')}</span>
          </button>

          <AnimatePresence>
            {isShareMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
              >
                <div className="py-1">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                    onClick={() => handleShareOption('facebook')}
                  >
                    <Facebook className="w-4 h-4 mr-3 text-blue-600" />
                    {t('social.shareOnFacebook')}
                  </button>

                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                    onClick={() => handleShareOption('twitter')}
                  >
                    <Twitter className="w-4 h-4 mr-3 text-blue-400" />
                    {t('social.shareOnTwitter')}
                  </button>

                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                    onClick={() => handleShareOption('linkedin')}
                  >
                    <Linkedin className="w-4 h-4 mr-3 text-blue-700" />
                    {t('social.shareOnLinkedin')}
                  </button>

                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                    onClick={() => handleShareOption('copy')}
                  >
                    <Copy className="w-4 h-4 mr-3" />
                    {t('social.copyLink')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Comment Section */}
      <AnimatePresence>
        {isCommentSectionOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm"
          >
            <div className="p-5">
              <form onSubmit={handleSubmitComment} className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700 shadow-sm">
                  <img
                    src={user?.avatar_url || '/images/default_user.jpg'}
                    alt={user?.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 ml-3 relative">
                  <input
                    type="text"
                    className="social-input pr-24 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300"
                    placeholder={t('social.writeComment')}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-all duration-300 hover:scale-110"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-all duration-300 hover:scale-110"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-all duration-300 hover:scale-110"
                    >
                      <AtSign className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="ml-3 p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 transform"
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedPostCard;
