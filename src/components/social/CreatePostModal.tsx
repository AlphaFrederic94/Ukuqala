import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { socialService } from '../../lib/socialService';
import { notificationService } from '../../lib/notificationService';
import { hashtagService } from '../../lib/hashtagService';
import { supabase } from '../../lib/supabaseClient';
import {
  Image as ImageIcon,
  Smile,
  X,
  Loader2,
  Hash,
  Users,
  ChevronDown,
  Check
} from 'lucide-react';
import HashtagInput from './HashtagInput';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService: firebaseSocialService } = useFirebase();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState('public');
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const privacyDropdownRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (!isSubmitting) {
          onClose();
        }
      }
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(event.target as Node)) {
        setShowPrivacyOptions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(t('social.imageTooLarge'));
        return;
      }

      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        setError(t('social.invalidImageType'));
        return;
      }

      setImage(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);

      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleHashtagsChange = (newHashtags: string[]) => {
    setHashtags(newHashtags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!content.trim() && !image) {
      setError(t('social.emptyPost'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Process hashtags from content
      const extractedHashtags = await hashtagService.processHashtagsFromPost(content, hashtags);

      let imageUrl = undefined;

      // Upload image if selected
      if (image) {
        try {
          // Try Firebase first
          imageUrl = await firebaseSocialService.uploadPostImage(image, user.id);
        } catch (firebaseError) {
          console.error('Error uploading image to Firebase:', firebaseError);

          // Fallback to Supabase
          try {
            imageUrl = await socialService.uploadPostImage(image, user.id);
          } catch (supabaseError) {
            console.error('Error uploading image to Supabase:', supabaseError);
            throw new Error('Failed to upload image');
          }
        }
      }

      // Create post
      let createdPost;
      try {
        // Try Firebase first
        createdPost = await firebaseSocialService.createPost({
          userId: user.id,
          content: content.trim(),
          imageUrl: imageUrl || null, // Ensure imageUrl is never undefined
          hashtags: extractedHashtags,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          userAvatar: user.user_metadata?.avatar_url || `/images/default_user.jpg`
        });
      } catch (firebaseError) {
        console.error('Error creating post in Firebase:', firebaseError);

        // Fallback to Supabase
        try {
          const { data, error } = await supabase
            .from('social_posts')
            .insert([
              {
                user_id: user.id,
                content: content.trim(),
                image_url: imageUrl,
                hashtags: extractedHashtags,
                is_anonymous: isAnonymous
              }
            ])
            .select()
            .single();

          if (error) throw error;

          createdPost = {
            ...data,
            userId: user.id,
            userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            userAvatar: user.user_metadata?.avatar_url || `/images/default_user.jpg`
          };
        } catch (supabaseError) {
          console.error('Error creating post in Supabase:', supabaseError);
          throw new Error('Failed to create post');
        }
      }

      // Play success sound
      const audio = new Audio('/sounds/message-sent.mp3');
      audio.play().catch(e => console.error('Error playing sound:', e));

      // Notify all users about the new post
      try {
        await notificationService.notifyAllAboutNewPost(createdPost, user.id);
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't throw error here, as the post was created successfully
      }

      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);
      setHashtags([]);
      setIsAnonymous(false);

      // Notify parent
      onPostCreated();

      // Close modal
      onClose();
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
        return <Users className="w-5 h-5" />;
      case 'friends':
        return <Users className="w-5 h-5" />;
      case 'private':
        return <Users className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('social.createPost')}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700 shadow-md">
                <img
                  src={user?.avatar_url || '/images/default_user.jpg'}
                  alt={user?.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3 flex-grow">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user?.full_name || 'User'}
                  </span>

                  <div className="relative ml-2" ref={privacyDropdownRef}>
                    <button
                      type="button"
                      className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1"
                      onClick={() => setShowPrivacyOptions(!showPrivacyOptions)}
                    >
                      {getPrivacyIcon()}
                      <span className="ml-1">{getPrivacyLabel()}</span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>

                    <AnimatePresence>
                      {showPrivacyOptions && (
                        <motion.div
                          className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="py-1">
                            <button
                              type="button"
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => {
                                setPrivacy('public');
                                setShowPrivacyOptions(false);
                              }}
                            >
                              <Users className="w-4 h-4 mr-3" />
                              {t('social.public')}
                              {privacy === 'public' && (
                                <Check className="w-4 h-4 ml-auto text-green-500" />
                              )}
                            </button>

                            <button
                              type="button"
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => {
                                setPrivacy('friends');
                                setShowPrivacyOptions(false);
                              }}
                            >
                              <Users className="w-4 h-4 mr-3" />
                              {t('social.friendsOnly')}
                              {privacy === 'friends' && (
                                <Check className="w-4 h-4 ml-auto text-green-500" />
                              )}
                            </button>

                            <button
                              type="button"
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => {
                                setPrivacy('private');
                                setShowPrivacyOptions(false);
                              }}
                            >
                              <Users className="w-4 h-4 mr-3" />
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

                <textarea
                  placeholder={t('social.whatsOnYourMind')}
                  value={content}
                  onChange={handleContentChange}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none transition-all duration-300 shadow-sm focus:shadow-md"
                  rows={5}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Hashtags */}
            <div className="mb-4">
              <HashtagInput
                hashtags={hashtags}
                onChange={handleHashtagsChange}
                placeholder={t('social.addHashtags')}
                disabled={isSubmitting}
              />
            </div>

            {/* Image preview */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative mb-4 rounded-lg overflow-hidden"
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1"
                    disabled={isSubmitting}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Anonymous option */}
            <div className="mb-4 flex items-center">
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
              <div className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center mt-4 bg-gray-50/80 dark:bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  ref={fileInputRef}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 p-2 rounded-full hover:bg-white dark:hover:bg-gray-600"
                  disabled={isSubmitting}
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  {t('social.addImage')}
                </button>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 transform"
                disabled={isSubmitting || (!content.trim() && !image)}
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
      </motion.div>
    </div>
  );
};

export default CreatePostModal;
