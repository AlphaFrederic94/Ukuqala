import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit2, X, Save, User, Shield, Award, BadgeCheck, Upload, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';

interface ProfileHeaderProps {
  profileData: {
    full_name: string;
    avatar_url: string;
  };
  editMode: boolean;
  completionPercentage: number;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileData,
  editMode,
  completionPercentage,
  onEditToggle,
  onSave,
  onCancel,
  onPhotoUpload,
  loading
}) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadHover, setUploadHover] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [badgeAnimation, setBadgeAnimation] = useState(false);

  // Trigger badge animation when completion percentage changes
  useEffect(() => {
    setBadgeAnimation(true);
    const timer = setTimeout(() => setBadgeAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, [completionPercentage]);

  // Handle photo upload with loading state
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoLoading(true);
    onPhotoUpload(e);
    // Reset loading state after a delay (in a real app, this would be in the onComplete callback)
    setTimeout(() => setPhotoLoading(false), 1500);
  };

  // Get badge based on completion percentage
  const getBadge = () => {
    if (completionPercentage >= 90) return { icon: <Award className="h-5 w-5" />, text: "Gold", color: "bg-yellow-500" };
    if (completionPercentage >= 70) return { icon: <BadgeCheck className="h-5 w-5" />, text: "Silver", color: "bg-gray-300" };
    if (completionPercentage >= 50) return { icon: <Shield className="h-5 w-5" />, text: "Bronze", color: "bg-amber-600" };
    return { icon: <User className="h-5 w-5" />, text: "Basic", color: "bg-blue-500" };
  };

  const badge = getBadge();

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl mb-8 shadow-xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background gradient with pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90"></div>
      <div className="absolute inset-0 bg-pattern opacity-10"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/4"></div>

      <div className="relative p-8">
        <div className="flex flex-col md:flex-row items-center">
          {/* Profile picture section */}
          <motion.div
            className="relative group mb-6 md:mb-0"
            variants={itemVariants}
          >
            <div className="w-36 h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white relative">
              <AnimatePresence mode="wait">
                {photoLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70"
                  >
                    <RefreshCw className="w-10 h-10 text-white animate-spin" />
                  </motion.div>
                ) : (
                  <motion.img
                    key="image"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    src={profileData.avatar_url || '/images/default_user.jpg'}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Photo upload overlay */}
            {editMode && (
              <motion.div
                className={`absolute inset-0 flex flex-col items-center justify-center rounded-full ${
                  uploadHover ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-40'
                } ${photoLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-200 cursor-pointer`}
                onClick={() => !photoLoading && fileInputRef.current?.click()}
                onMouseEnter={() => setUploadHover(true)}
                onMouseLeave={() => setUploadHover(false)}
                whileHover={{ scale: 1.05 }}
              >
                {!photoLoading && (
                  <>
                    <Upload className="w-8 h-8 text-white mb-1" />
                    <span className="text-white text-xs font-medium">Upload Photo</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </>
                )}
              </motion.div>
            )}

            {/* Profile completion ring with animation */}
            <svg className="absolute -inset-2" width="152" height="152" viewBox="0 0 152 152">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle
                cx="76"
                cy="76"
                r="70"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="6"
              />
              <motion.circle
                cx="76"
                cy="76"
                r="70"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="440"
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (440 * completionPercentage / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                transform="rotate(-90 76 76)"
              />
            </svg>

            {/* Profile badge */}
            <motion.div
              className={`absolute -bottom-2 -right-2 rounded-full ${badge.color} p-2 border-2 border-white shadow-lg`}
              initial={{ scale: 0 }}
              animate={{ scale: badgeAnimation ? 1.2 : 1 }}
              transition={{
                duration: 0.5,
                type: badgeAnimation ? "tween" : "spring",
                ease: badgeAnimation ? "easeInOut" : undefined
              }}
            >
              {badge.icon}
            </motion.div>
          </motion.div>

          {/* Profile info */}
          <motion.div
            className="md:ml-8 text-center md:text-left"
            variants={itemVariants}
          >
            <motion.h2
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {profileData.full_name || 'User'}
            </motion.h2>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-2">
              <motion.div
                className="px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white text-sm flex items-center"
                whileHover={{ scale: 1.05 }}
              >
                <User className="w-4 h-4 mr-1.5" />
                Patient ID: #{user?.id.slice(0, 8)}
              </motion.div>

              <motion.div
                className="px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white text-sm flex items-center"
                whileHover={{ scale: 1.05 }}
                initial={{ scale: 1 }}
                animate={{ scale: badgeAnimation ? 1.1 : 1 }}
                transition={{
                  duration: 0.5,
                  type: badgeAnimation ? "tween" : "spring",
                  ease: badgeAnimation ? "easeInOut" : undefined
                }}
              >
                <Badge icon={badge.icon} text={badge.text} />
                <span className="mx-1.5">•</span>
                <span>{completionPercentage}% Complete</span>
              </motion.div>
            </div>

            <motion.div
              className="mt-4 text-white text-opacity-90 text-sm max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {completionPercentage < 50 ? (
                <p>Complete your profile to unlock all features and get personalized health recommendations.</p>
              ) : completionPercentage < 80 ? (
                <p>Your profile is coming along nicely! Add more details to improve your health insights.</p>
              ) : (
                <p>Great job! Your profile is nearly complete, enabling the most accurate health analysis.</p>
              )}
            </motion.div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="mt-6 md:mt-0 md:ml-auto"
            variants={itemVariants}
          >
            <AnimatePresence mode="wait">
              {editMode ? (
                <motion.div
                  key="edit-buttons"
                  className="flex space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30 transition-all"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={onSave}
                    disabled={loading}
                    className="bg-white text-blue-600 hover:bg-opacity-90 transition-all shadow-lg"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="view-button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={onEditToggle}
                    className="bg-white text-blue-600 hover:bg-opacity-90 transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Profile completion bar (mobile only) */}
        <motion.div
          className="mt-6 md:hidden"
          variants={itemVariants}
        >
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-300 to-purple-300"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-white text-opacity-80">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Badge component
const Badge = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center">
    <div className="mr-1.5">
      {icon}
    </div>
    <span>{text}</span>
  </div>
);

export default ProfileHeader;
