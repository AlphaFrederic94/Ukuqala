import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Smile,
  Hash,
  X,
  Loader2,
  Users,
  ChevronDown,
  Check,
  Globe,
  UserPlus,
  Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import RichTextEditor from './RichTextEditor';
import HashtagInput from './HashtagInput.jsx';

interface ModernCreatePostProps {
  onPostCreated: () => void;
  minimized?: boolean;
  onExpand?: () => void;
}

const ModernCreatePost: React.FC<ModernCreatePostProps> = ({
  onPostCreated,
  minimized = false,
  onExpand
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();

  // State
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState('public');
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const privacyDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside privacy dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(event.target as Node)) {
        setShowPrivacyOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Limit to 4 images
      if (images.length + selectedFiles.length > 4) {
        setError(t('social.maxImagesExceeded', { max: 4 }));
        return;
      }

      // Check file sizes (max 5MB each)
      const oversizedFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError(t('social.imageTooLarge'));
        return;
      }

      // Check file types
      const invalidFiles = selectedFiles.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        setError(t('social.invalidImageType'));
        return;
      }

      // Add new images
      setImages(prev => [...prev, ...selectedFiles]);

      // Create previews
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);

      setError(null);
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle hashtags change
  const handleHashtagsChange = (newHashtags: string[]) => {
    setHashtags(newHashtags);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!content.trim() && images.length === 0) {
      setError(t('social.emptyPost'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Extract hashtags from content
      const contentText = content.replace(/<[^>]*>/g, ' ');
      const hashtagRegex = /#(\w+)/g;
      const extractedTags = contentText.match(hashtagRegex) || [];
      const allHashtags = [...new Set([...hashtags, ...extractedTags])];

      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const uploadPromises = images.map(image =>
          socialService.uploadPostImage(image, user.id)
        );
        imageUrls = await Promise.all(uploadPromises);
      }

      // Create post
      await socialService.createPost({
        userId: user.id,
        content: content.trim(),
        imageUrl: imageUrls[0] || null, // For backward compatibility
        images: imageUrls,
        hashtags: allHashtags,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        userAvatar: user.user_metadata?.avatar_url || `/images/default_user.jpg`,
        privacy,
        isAnonymous
      });

      // Play success sound
      const audio = new Audio('/sounds/message-sent.mp3');
      audio.play().catch(e => console.error('Error playing sound:', e));

      // Reset form
      setContent('');
      setImages([]);
      setImagePreviews([]);
      setHashtags([]);
      setIsAnonymous(false);

      // Notify parent
      onPostCreated();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || t('social.errorCreatingPost'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get privacy icon
  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'friends':
        return <UserPlus className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  // Get privacy label
  const getPrivacyLabel = () => {
    switch (privacy) {
      case 'public':
        return t('social.public');
      case 'friends':
        return t('social.friendsOnly');
      case 'private':
        return t('social.onlyMe');
      default:
        return t('social.public');
    }
  };

  // Minimized view
  if (minimized) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onExpand}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={user?.user_metadata?.avatar_url || '/images/default_user.jpg'}
              alt={user?.user_metadata?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3 flex-grow">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-gray-500 dark:text-gray-400">
              {t('social.whatsOnYourMind')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700 shadow-sm">
            <img
              src={user?.user_metadata?.avatar_url || '/images/default_user.jpg'}
              alt={user?.user_metadata?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3">
            <div className="font-medium text-gray-900 dark:text-white">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </div>

            <div className="relative" ref={privacyDropdownRef}>
              <button
                type="button"
                className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 mt-1"
                onClick={() => setShowPrivacyOptions(!showPrivacyOptions)}
              >
                {getPrivacyIcon()}
                <span className="ml-1">{getPrivacyLabel()}</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>

              <AnimatePresence>
                {showPrivacyOptions && (
                  <motion.div
                    className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setPrivacy('public');
                          setShowPrivacyOptions(false);
                        }}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        {t('social.public')}
                        {privacy === 'public' && (
                          <Check className="w-4 h-4 ml-auto text-green-500" />
                        )}
                      </button>

                      <button
                        type="button"
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setPrivacy('friends');
                          setShowPrivacyOptions(false);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('social.friendsOnly')}
                        {privacy === 'friends' && (
                          <Check className="w-4 h-4 ml-auto text-green-500" />
                        )}
                      </button>

                      <button
                        type="button"
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setPrivacy('private');
                          setShowPrivacyOptions(false);
                        }}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {t('social.onlyMe')}
                        {privacy === 'private' && (
                          <Check className="w-4 h-4 ml-auto text-green-500" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <RichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder={t('social.whatsOnYourMind')}
              minHeight="120px"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white rounded-full p-1"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hashtags */}
          <div className="mb-3">
            <HashtagInput
              hashtags={hashtags}
              onChange={handleHashtagsChange}
              placeholder={t('social.addHashtags')}
              disabled={isSubmitting}
            />
          </div>

          {/* Anonymous option */}
          <div className="mb-3 flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              disabled={isSubmitting}
            />
            <label
              htmlFor="anonymous"
              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              {t('social.postAnonymously')}
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
                disabled={isSubmitting}
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={isSubmitting || images.length >= 4}
                title={images.length >= 4 ? t('social.maxImagesReached') : t('social.addImage')}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg transition-all duration-300"
              disabled={isSubmitting || (!content.trim() && images.length === 0)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('social.posting')}
                </>
              ) : (
                t('social.post')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModernCreatePost;
