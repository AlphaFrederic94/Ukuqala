import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Facebook, Instagram, Twitter, Linkedin, Mail, Link, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  image?: string;
  hashtags?: string[];
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  platforms?: ('facebook' | 'instagram' | 'twitter' | 'linkedin' | 'email' | 'copy')[];
}

const SocialShare: React.FC<SocialShareProps> = ({
  title,
  text,
  url = window.location.href,
  image,
  hashtags = [],
  className = '',
  buttonSize = 'md',
  showLabel = false,
  platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'email', 'copy'],
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Button size classes
  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Share functions
  const shareToFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToInstagram = () => {
    // Instagram doesn't have a direct share URL, but we can open Instagram
    // and suggest users to share the screenshot
    alert(t('social.instagramShareInfo'));
    window.open('https://www.instagram.com/', '_blank');
    setIsOpen(false);
  };

  const shareToTwitter = () => {
    const hashtagsString = hashtags.length > 0 ? `&hashtags=${hashtags.join(',')}` : '';
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}${hashtagsString}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToLinkedin = () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareViaEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
    window.location.href = mailtoUrl;
    setIsOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${title}\n${text}\n${url}`).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Platform config
  const platformConfig = {
    facebook: {
      icon: <Facebook />,
      label: 'Facebook',
      action: shareToFacebook,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    instagram: {
      icon: <Instagram />,
      label: 'Instagram',
      action: shareToInstagram,
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white',
    },
    twitter: {
      icon: <Twitter />,
      label: 'Twitter',
      action: shareToTwitter,
      color: 'bg-blue-400 hover:bg-blue-500 text-white',
    },
    linkedin: {
      icon: <Linkedin />,
      label: 'LinkedIn',
      action: shareToLinkedin,
      color: 'bg-blue-700 hover:bg-blue-800 text-white',
    },
    email: {
      icon: <Mail />,
      label: 'Email',
      action: shareViaEmail,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
    },
    copy: {
      icon: copied ? <Check /> : <Link />,
      label: copied ? t('social.copied') : t('social.copyLink'),
      action: copyToClipboard,
      color: copied ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white',
    },
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={toggleDropdown}
        className="flex items-center justify-center cursor-pointer"
        aria-label={t('social.share')}
      >
        <Share2 className={iconSizeClasses[buttonSize]} />
        {showLabel && <span className="ml-2">{t('social.share')}</span>}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
            >
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
                  {t('social.shareVia')}
                </div>
                {platforms.map((platform) => {
                  const config = platformConfig[platform];
                  return (
                    <button
                      key={platform}
                      onClick={config.action}
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${config.color}`}
                    >
                      <span className="mr-2">{config.icon}</span>
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialShare;
