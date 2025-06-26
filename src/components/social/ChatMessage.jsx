import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import VoiceMessagePlayer from '../chat/VoiceMessagePlayer';

const ChatMessage = ({ message }) => {
  const { user } = useAuth();
  const isCurrentUser = user?.id === message.sender_id;
  const [showFullImage, setShowFullImage] = useState(false);

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';

    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Check if the content contains a URL
  const hasUrl = message.content && /https?:\/\/[^\s]+/.test(message.content);

  // Extract URL from content
  const extractUrl = (content) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = content.match(urlRegex);
    return match ? match[0] : null;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    } else {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
  };

  // Render file attachment
  const renderFileAttachment = () => {
    if (!message.file_url) return null;

    // Image file
    if (message.file_type?.startsWith('image/')) {
      return (
        <div className="mt-1 mb-1">
          <div
            className="relative cursor-pointer rounded-lg overflow-hidden"
            onClick={() => setShowFullImage(true)}
          >
            <img
              src={message.file_url}
              alt="Attachment"
              className="max-w-full rounded-lg max-h-60 object-contain bg-black/5"
            />
            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {message.file_name?.split('.').pop().toUpperCase()}
            </div>
          </div>
        </div>
      );
    }

    // Audio file
    if (message.file_type?.startsWith('audio/')) {
      return (
        <div className="mt-1 mb-1">
          <div className="max-w-full">
            <VoiceMessagePlayer audioUrl={message.file_url} />
          </div>
          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            {message.file_name} ({formatFileSize(message.file_size)})
          </div>
        </div>
      );
    }

    // Video file
    if (message.file_type?.startsWith('video/')) {
      return (
        <div className="mt-1 mb-1">
          <video controls className="max-w-full max-h-60 rounded-lg">
            <source src={message.file_url} type={message.file_type} />
            Your browser does not support the video element.
          </video>
          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            {message.file_name} ({formatFileSize(message.file_size)})
          </div>
        </div>
      );
    }

    // Other files
    return (
      <div className="mt-1 mb-1">
        <a
          href={message.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500 dark:text-blue-300">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
              {message.file_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(message.file_size)}
            </div>
          </div>
        </a>
      </div>
    );
  };

  // Render URL preview
  const renderUrlPreview = () => {
    if (!hasUrl) return null;

    const url = extractUrl(message.content);
    if (!url) return null;

    return (
      <div className="mt-1 mb-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500 dark:text-blue-300">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="16"></line>
              </svg>
            </div>
            <div className="overflow-hidden">
              <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                {url}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Open link
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isCurrentUser && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mr-2">
            <img
              src={message.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.full_name || 'User')}&background=random`}
              alt={message.sender?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className={`max-w-[70%]`}>
          <div
            className={`px-3 py-2 rounded-lg shadow-sm ${
              isCurrentUser
                ? 'bg-green-500 text-white rounded-br-none'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none'
            }`}
          >
            {message.content && <div>{message.content}</div>}
            {renderFileAttachment()}
            {renderUrlPreview()}
          </div>
          <div
            className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
              isCurrentUser ? 'text-right' : 'text-left'
            }`}
          >
            {formatTime(message.created_at)}
          </div>
        </div>

        {isCurrentUser && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ml-2">
            <img
              src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User')}&background=random`}
              alt={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </motion.div>

      {/* Full image modal */}
      {showFullImage && message.file_type?.startsWith('image/') && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={message.file_url}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2"
              onClick={() => setShowFullImage(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessage;
