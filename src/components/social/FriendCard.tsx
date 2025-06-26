import React from 'react';
import { UserPlus, UserMinus, Check, X, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface FriendCardProps {
  id: string;
  name: string;
  avatar: string;
  status?: 'friend' | 'pending' | 'suggestion' | 'sent';
  onAddFriend?: (id: string) => void;
  onRemoveFriend?: (id: string) => void;
  onAcceptRequest?: (id: string) => void;
  onRejectRequest?: (id: string) => void;
  onCancelRequest?: (id: string) => void;
  onMessage?: (id: string) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({
  id,
  name,
  avatar,
  status = 'suggestion',
  onAddFriend,
  onRemoveFriend,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onMessage
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 14px 28px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.05)' }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm p-5 flex items-center justify-between relative overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 rounded-tr-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-50"></div>
      <div className="flex items-center relative z-10">
        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-700 shadow-md transform transition-transform duration-300 hover:scale-105">
          <img
            src={avatar || '/images/default_user.jpg'}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="ml-3">
          <h3 className="font-medium text-gray-900 dark:text-white social-text-gradient-blue">{name}</h3>
          {status === 'pending' && (
            <span className="text-xs text-blue-500 dark:text-blue-400">
              {t('social.pendingRequest')}
            </span>
          )}
          {status === 'sent' && (
            <span className="text-xs text-green-500 dark:text-green-400">
              {t('social.requestSent')}
            </span>
          )}
        </div>
      </div>

      <div className="flex space-x-2 relative z-10">
        {status === 'friend' && (
          <>
            <button
              onClick={() => onMessage?.(id)}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
              title={t('social.message')}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => onRemoveFriend?.(id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
              title={t('social.removeFriend')}
            >
              <UserMinus className="w-5 h-5" />
            </button>
          </>
        )}

        {status === 'suggestion' && (
          <button
            onClick={() => onAddFriend?.(id)}
            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
            title={t('social.addFriend')}
          >
            <UserPlus className="w-5 h-5" />
          </button>
        )}

        {status === 'pending' && (
          <>
            <button
              onClick={() => onAcceptRequest?.(id)}
              className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
              title={t('social.accept')}
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => onRejectRequest?.(id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
              title={t('social.reject')}
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}

        {status === 'sent' && (
          <button
            onClick={() => onCancelRequest?.(id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
            title={t('social.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FriendCard;
