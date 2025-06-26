import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileNotificationProps {
  success: string | null;
  error: string | null;
  onDismiss: () => void;
}

const ProfileNotification: React.FC<ProfileNotificationProps> = ({
  success,
  error,
  onDismiss
}) => {
  const message = success || error;
  const isSuccess = !!success;

  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-6 right-6 z-50 max-w-md"
      >
        <div className={`
          flex items-start p-4 rounded-lg shadow-lg
          ${isSuccess ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}
        `}>
          <div className="flex-shrink-0 mr-3">
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isSuccess ? 'Success' : 'Error'}
            </p>
            <p className="text-sm mt-1">
              {message}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className={`ml-4 p-1 rounded-full hover:bg-opacity-20 ${isSuccess ? 'hover:bg-green-200' : 'hover:bg-red-200'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileNotification;
