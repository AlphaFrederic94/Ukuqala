import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage as ChatMessageType } from '../../lib/chatService';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isCurrentUser = user?.id === message.sender_id;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mr-2">
          <img
            src={message.sender?.avatar_url || '/images/default_user.jpg'}
            alt={message.sender?.full_name || 'User'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className={`max-w-[70%]`}>
        <div
          className={`px-3 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
          }`}
        >
          {message.content}
        </div>
        <div
          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
            isCurrentUser ? 'text-right' : 'text-left'
          }`}
        >
          {format(new Date(message.created_at), 'h:mm a')}
        </div>
      </div>
      
      {isCurrentUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ml-2">
          <img
            src={user?.avatar_url || '/images/default_user.jpg'}
            alt={user?.full_name || 'User'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
