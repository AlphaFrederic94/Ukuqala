import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Upload, Check, X, Camera, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

// Sample avatar options
const SAMPLE_AVATARS = [
  {
    id: 'avatar1',
    url: 'https://img.freepik.com/free-psd/3d-rendering-hair-style-avatar-design_23-2151869121.jpg',
    alt: '3D avatar with styled hair'
  },
  {
    id: 'avatar2',
    url: 'https://img.freepik.com/free-vector/young-boy-avatar-illustration_1308-175931.jpg',
    alt: 'Young boy cartoon avatar'
  },
  {
    id: 'avatar3',
    url: 'https://img.freepik.com/free-photo/androgynous-avatar-non-binary-queer-person_23-2151100278.jpg',
    alt: 'Androgynous avatar'
  },
  {
    id: 'avatar4',
    url: 'https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
    alt: 'Businessman avatar'
  },
  {
    id: 'avatar5',
    url: 'https://img.freepik.com/free-vector/mysterious-mafia-man-smoking-cigarette_52683-34828.jpg',
    alt: 'Mysterious character avatar'
  },
  {
    id: 'avatar6',
    url: 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg',
    alt: 'Doctor avatar'
  }
];

interface AvatarSelectorProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatar,
  onAvatarChange
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null);
  const [customAvatar, setCustomAvatar] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle avatar selection
  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!user) {
      setError(t('avatar.notLoggedIn', 'You must be logged in to change your avatar.'));
      return;
    }

    setSelectedAvatar(avatarUrl);
    onAvatarChange(avatarUrl);

    // Clear any previous messages
    setError(null);
    setSuccess(null);

    try {
      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Show success message
      setSuccess(t('avatar.savedSuccess', 'Avatar saved successfully!'));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving avatar:', error);
      setError(t('avatar.saveError', 'Failed to save avatar. Please try again.'));
    }
  };

  // Handle custom avatar upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('avatar.fileTooLarge', 'Image is too large. Maximum size is 5MB.'));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError(t('avatar.invalidFileType', 'Invalid file type. Only image files are allowed.'));
      return;
    }

    setCustomAvatar(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload custom avatar to storage
  const uploadCustomAvatar = async () => {
    if (!customAvatar || !user) {
      setError(t('avatar.noFileSelected', 'No file selected or you are not logged in.'));
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      setSuccess(null);

      // Create a folder structure: avatars/user_id/
      const filePath = `${user.id}/${Date.now()}_${customAvatar.name}`;

      // Upload the file
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, customAvatar, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });

      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Set as selected avatar
      setSelectedAvatar(publicUrl);
      onAvatarChange(publicUrl);

      // Show success message with animation
      setSuccess(t('avatar.uploadSuccess', 'Avatar uploaded and saved successfully!'));

      // Reset custom avatar state
      setCustomAvatar(null);
      setCustomAvatarPreview(null);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(t('avatar.uploadError', 'Failed to upload avatar. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  // Cancel custom avatar upload
  const cancelCustomAvatar = () => {
    setCustomAvatar(null);
    setCustomAvatarPreview(null);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('avatar.selectAvatar', 'Select Your Avatar')}
      </h3>

      {/* Current avatar display */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {selectedAvatar ? (
              <img
                src={selectedAvatar}
                alt={t('avatar.yourAvatar', 'Your avatar')}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-gray-400" />
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5 text-white" />
            <input
              id="avatar-upload"
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {/* Custom avatar upload */}
      {customAvatarPreview && (
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('avatar.customAvatar', 'Custom Avatar')}
              </h4>
              <button
                type="button"
                onClick={cancelCustomAvatar}
                className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                <img
                  src={customAvatarPreview}
                  alt={t('avatar.preview', 'Preview')}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                  {customAvatar?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {customAvatar && (customAvatar.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={uploadCustomAvatar}
                disabled={uploading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                    {t('avatar.uploading', 'Uploading...')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('avatar.upload', 'Upload Avatar')}
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm"
        >
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            {success}
          </div>
        </motion.div>
      )}

      {/* Sample avatars */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {t('avatar.sampleAvatars', 'Sample Avatars')}
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {SAMPLE_AVATARS.map((avatar) => (
            <div
              key={avatar.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden ${
                selectedAvatar === avatar.url ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleAvatarSelect(avatar.url)}
            >
              <img
                src={avatar.url}
                alt={avatar.alt}
                className="w-full h-24 object-cover"
              />
              {selectedAvatar === avatar.url && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="bg-blue-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
