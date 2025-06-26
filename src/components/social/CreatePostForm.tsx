import React, { useState, useRef } from 'react';
import { Image, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../lib/socialService';
import { useTranslation } from 'react-i18next';

interface CreatePostFormProps {
  onPostCreated: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

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

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
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
      let imageUrl = undefined;

      // Upload image if selected
      if (image) {
        imageUrl = await socialService.uploadPostImage(image, user.id);
      }

      // Create post
      await socialService.createPost(user.id, content, imageUrl);

      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent
      onPostCreated();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || t('social.errorCreatingPost'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm p-5 mb-6 relative overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-tr-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="flex items-start mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700 shadow-md">
            <img
              src={user?.avatar_url || '/images/default_user.jpg'}
              alt={user?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3 flex-grow">
            <textarea
              placeholder={t('social.whatsOnYourMind')}
              value={content}
              onChange={handleContentChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none transition-all duration-300 shadow-sm focus:shadow-md"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
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
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

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
              <Image className="w-5 h-5 mr-2" />
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
  );
};

export default CreatePostForm;
