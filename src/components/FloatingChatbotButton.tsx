import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Bot, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const FloatingChatbotButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const location = useLocation();

  // Don't show the button on the chatbot page itself
  if (location.pathname === '/chatbot') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 1 // Delay appearance by 1 second
        }}
      >
        <Link
          to="/chatbot"
          className="relative group"
          onMouseEnter={() => {
            setIsHovered(true);
            setShowTooltip(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            setShowTooltip(false);
          }}
        >
          {/* Main Button */}
          <motion.div
            className="relative w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {/* Pulse Animation */}
            <motion.div
              className="absolute inset-0 bg-green-400 rounded-full opacity-30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* AI Sparkle Effect */}
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.5
              }}
            >
              <Zap className="w-2 h-2 text-yellow-600" />
            </motion.div>

            {/* Bot Icon */}
            <motion.div
              animate={isHovered ? { y: [-2, 2, -2] } : {}}
              transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>

            {/* Notification Badge */}
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2, type: "spring" }}
            >
              <span className="text-white text-xs font-bold">AI</span>
            </motion.div>
          </motion.div>

          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap"
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-medium">Qala-Lwazi Medical Assistant</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Ask me any medical question!
                </div>
                
                {/* Arrow */}
                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </motion.div>

      {/* Background Glow Effect */}
      <motion.div
        className="fixed bottom-6 right-6 w-16 h-16 bg-green-400 rounded-full opacity-20 blur-xl z-40 pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.1, 0.2]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </>
  );
};

export default FloatingChatbotButton;
