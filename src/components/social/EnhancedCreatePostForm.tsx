import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../lib/socialService';
import {
  Image as ImageIcon,
  Smile,
  MapPin,
  Users,
  Calendar,
  X,
  Camera,
  Upload,
  AtSign,
  Hash,
  ChevronDown,
  Check
} from 'lucide-react';
import SimpleEmojiPicker from './SimpleEmojiPicker';
import { supabase } from '../../lib/supabaseClient';

interface EnhancedCreatePostFormProps {
  onPostCreated: () => void;
}

const EnhancedCreatePostForm: React.FC<EnhancedCreatePostFormProps> = ({ onPostCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentionResults, setShowMentionResults] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [hashtagResults, setHashtagResults] = useState<string[]>([]);
  const [showHashtagResults, setShowHashtagResults] = useState(false);
  const [popularHashtags] = useState([
    'health', 'wellness', 'fitness', 'nutrition', 'mentalhealth',
    'selfcare', 'mindfulness', 'healthcare', 'medicine', 'doctor'
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const privacyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(event.target as Node)) {
        setShowPrivacyOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle text changes and detect mentions/hashtags
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }

    // Check for mentions
    const mentionMatch = /@(\w*)$/.exec(newContent.slice(0, cursorPosition));
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionSearch(query);
      if (query.length > 0) {
        searchUsers(query);
        setShowMentionResults(true);
      } else {
        setMentionResults([]);
        setShowMentionResults(false);
      }
    } else {
      setShowMentionResults(false);
    }

    // Check for hashtags
    const hashtagMatch = /#(\w*)$/.exec(newContent.slice(0, cursorPosition));
    if (hashtagMatch) {
      const query = hashtagMatch[1];
      setHashtagSearch(query);
      if (query.length > 0) {
        const filteredTags = popularHashtags.filter(tag =>
          tag.toLowerCase().includes(query.toLowerCase())
        );
        setHashtagResults(filteredTags);
        setShowHashtagResults(true);
      } else {
        setHashtagResults([]);
        setShowHashtagResults(false);
      }
    } else {
      setShowHashtagResults(false);
    }
  };

  // Search for users to mention
  const searchUsers = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setMentionResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setMentionResults([]);
    }
  };

  // Insert mention at cursor position
  const insertMention = (user: any) => {
    if (textareaRef.current) {
      const beforeMention = content.slice(0, cursorPosition).replace(/@\w*$/, '');
      const afterMention = content.slice(cursorPosition);
      const newContent = `${beforeMention}@${user.full_name.replace(/\s+/g, '')} ${afterMention}`;
      setContent(newContent);

      // Focus and set cursor position after the inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = beforeMention.length + user.full_name.replace(/\s+/g, '').length + 2; // +2 for @ and space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          setCursorPosition(newPosition);
        }
      }, 0);
    }
    setShowMentionResults(false);
  };

  // Insert hashtag at cursor position
  const insertHashtag = (tag: string) => {
    if (textareaRef.current) {
      const beforeHashtag = content.slice(0, cursorPosition).replace(/#\w*$/, '');
      const afterHashtag = content.slice(cursorPosition);
      const newContent = `${beforeHashtag}#${tag} ${afterHashtag}`;
      setContent(newContent);

      // Focus and set cursor position after the inserted hashtag
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = beforeHashtag.length + tag.length + 2; // +2 for # and space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          setCursorPosition(newPosition);
        }
      }, 0);
    }
    setShowHashtagResults(false);
  };

  // Handle emoji selection
  const handleEmojiClick = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);

      // Set cursor position after the inserted emoji
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + emoji.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          setCursorPosition(newPosition);
        }
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!content.trim() && !image) {
      setError(t('social.emptyPostError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (image) {
        imageUrl = await socialService.uploadPostImage(image, user.id);
      }

      // Create post
      await socialService.createPost({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        location: location.trim() || null,
        privacy: privacy
      });

      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);
      setLocation('');
      setPrivacy('public');

      // Notify parent component
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

  return (
    <motion.div
      className="social-card overflow-visible relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm border border-gray-100 dark:border-gray-700 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-tr-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <div className="p-5 relative z-10">
        <div className="flex items-start gap-3">
          <motion.div
            className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700 shadow-md"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={user?.avatar_url || '/images/default_user.jpg'}
              alt={user?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  className="social-input min-h-[120px] resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 shadow-sm focus:shadow-md"
                  placeholder={t('social.whatsOnYourMind')}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowMentionResults(false);
                      setShowHashtagResults(false);
                    }
                  }}
                />

                {/* Mention Results Dropdown */}
                <AnimatePresence>
                  {showMentionResults && mentionResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                    >
                      <div className="p-2">
                        {mentionResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-300 hover:translate-x-1"
                            onClick={() => insertMention(user)}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ring-1 ring-white dark:ring-gray-600 shadow-sm">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">@{user.full_name.replace(/\s+/g, '')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hashtag Results Dropdown */}
                <AnimatePresence>
                  {showHashtagResults && hashtagResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                    >
                      <div className="p-2">
                        {hashtagResults.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-300 hover:translate-x-1"
                            onClick={() => insertHashtag(tag)}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                              <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">#{tag}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('social.popularHashtag')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <motion.div
                  className="mt-3 relative rounded-lg overflow-hidden shadow-md"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto max-h-[300px] object-contain bg-gray-100 dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-70 rounded-full text-white hover:bg-opacity-100"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>

              )}

              {/* Location Input */}
              <AnimatePresence>
                {showLocationInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3"
                  >
                    <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2 shadow-sm">
                      <MapPin className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      <input
                        type="text"
                        className="social-input ml-2 bg-transparent border-none focus:ring-0 shadow-none"
                        placeholder={t('social.addLocation')}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="mt-3 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-md"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-between bg-gray-50/80 dark:bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  <button
                    type="button"
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 hover:text-blue-500 dark:hover:text-blue-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 hover:text-yellow-500 dark:hover:text-yellow-400"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full right-0 mb-2 z-10 shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                          <SimpleEmojiPicker onEmojiClick={handleEmojiClick} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 hover:text-blue-500 dark:hover:text-blue-400"
                    onClick={() => setShowLocationInput(!showLocationInput)}
                  >
                    <MapPin className="w-5 h-5" />
                  </button>

                  <div className="relative" ref={privacyDropdownRef}>
                    <button
                      type="button"
                      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 flex items-center transition-all duration-300 hover:scale-110 hover:text-blue-500 dark:hover:text-blue-400"
                      onClick={() => setShowPrivacyOptions(!showPrivacyOptions)}
                    >
                      {getPrivacyIcon()}
                      <span className="ml-1 text-sm hidden sm:inline">{getPrivacyLabel()}</span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>

                    <AnimatePresence>
                      {showPrivacyOptions && (
                        <motion.div
                          className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="py-1">
                            <button
                              type="button"
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:translate-x-1"
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
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:translate-x-1"
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
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:translate-x-1"
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

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting || (!content.trim() && !image)}
                >
                  {isSubmitting ? t('social.posting') : t('social.post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedCreatePostForm;
