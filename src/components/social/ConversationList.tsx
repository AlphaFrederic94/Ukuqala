import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Conversation } from '../../lib/chatService';
import { useTranslation } from 'react-i18next';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (userId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onSelectConversation
}) => {
  const { t } = useTranslation();
  
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        {t('social.noConversations')}
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {conversations.map(conversation => (
        <motion.div
          key={conversation.user_id}
          whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
          className={`p-3 cursor-pointer ${
            activeConversation === conversation.user_id
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : ''
          }`}
          onClick={() => onSelectConversation(conversation.user_id)}
        >
          <div className="flex items-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={conversation.avatar_url || '/images/default_user.jpg'}
                  alt={conversation.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              {conversation.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  {conversation.unread_count}
                </div>
              )}
            </div>
            <div className="ml-3 flex-grow overflow-hidden">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {conversation.full_name}
                </h3>
                {conversation.last_message_time && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                  </span>
                )}
              </div>
              {conversation.last_message && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {conversation.last_message}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ConversationList;
