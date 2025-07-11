import React from 'react';
import EnhancedMedicalChatbot from '../components/chatbot/EnhancedMedicalChatbot';
import { useAuth } from '../contexts/AuthContext';

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 text-blue-600 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access the medical chatbot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <EnhancedMedicalChatbot mode="general" className="h-full" />
    </div>
  );
};

export default ChatbotPage;
