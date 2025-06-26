import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Settings, Trash2, MessageCircle,
  Loader2, AlertCircle, Copy, Download, Upload,
  Zap, Brain, Heart, Stethoscope, FileText, Image,
  AlertTriangle, Users, Microscope, Activity, X,
  CheckCircle, Clock, FileIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { chatbotService, ChatMessage, UserPreferences, UploadedFile } from '../../lib/chatbotService';
import { useAuth } from '../../contexts/AuthContext';

interface EnhancedMedicalChatbotProps {
  mode?: 'general' | 'emergency' | 'elderly' | 'specialist';
  className?: string;
}

const EnhancedMedicalChatbot: React.FC<EnhancedMedicalChatbotProps> = ({
  mode = 'general',
  className = ''
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(chatbotService.getPreferences());
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode configurations
  const modeConfig = {
    general: {
      theme: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      icon: Stethoscope,
      title: 'Qala-Lwazi Medical Assistant',
      subtitle: 'Your trusted medical companion',
      accentColor: 'blue'
    },
    emergency: {
      theme: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-pink-50',
      icon: AlertTriangle,
      title: 'Emergency Medical Assistant',
      subtitle: 'Urgent medical guidance',
      accentColor: 'red'
    },
    elderly: {
      theme: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      icon: Users,
      title: 'Senior Care Assistant',
      subtitle: 'Gentle medical guidance',
      accentColor: 'green'
    },
    specialist: {
      theme: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-50 to-violet-50',
      icon: Microscope,
      title: 'Specialist Medical Assistant',
      subtitle: 'Advanced medical insights',
      accentColor: 'purple'
    }
  };

  const currentMode = modeConfig[mode];
  const IconComponent = currentMode.icon;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chatbot
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Update preferences with current mode
        const updatedPreferences = { ...preferences, chatbotMode: mode };
        setPreferences(updatedPreferences);
        chatbotService.updatePreferences(updatedPreferences);

        // Check server status
        const available = await chatbotService.checkServerStatus();
        setIsServerAvailable(available);

        if (!available) {
          toast.error('Medical chatbot server is not available. Please try again later.');
          return;
        }

        // Initialize session and load history
        await chatbotService.initializeSession();
        const history = await chatbotService.getConversationHistory();
        setMessages(history);
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast.error('Failed to initialize chatbot');
      }
    };

    initializeChat();
  }, [mode]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isServerAvailable) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: userMessage }],
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Include uploaded files in the message
      const response = await chatbotService.sendMessage(userMessage, uploadedFiles.length > 0);

      // Simulate typing delay for better UX
      setTimeout(() => {
        setIsTyping(false);

        // Add assistant response to UI
        const assistantMessage: ChatMessage = {
          role: 'model',
          parts: [{ text: response.response }],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Clear uploaded files after successful analysis
        if (uploadedFiles.length > 0) {
          setUploadedFiles([]);
          toast.success('Medical files analyzed successfully!', { icon: '🔬' });
        }

        // Save to local storage
        chatbotService.saveToLocalStorage();
      }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast.error('Failed to send message. Please try again.');

      // Remove the user message from UI if sending failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation
  const handleClearConversation = async () => {
    const success = await chatbotService.clearConversationHistory();
    if (success) {
      setMessages([]);
    }
  };

  // Update preferences
  const handlePreferencesUpdate = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    chatbotService.updatePreferences(updated);
    toast.success('Preferences updated');
  };

  // Copy message to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Export conversation
  const exportConversation = () => {
    const conversationText = messages.map(msg =>
      `${msg.role === 'user' ? 'You' : 'Qala-Lwazi'}: ${msg.parts[0]?.text || ''}`
    ).join('\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Conversation exported');
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFiles = await chatbotService.uploadFiles(files);
      setUploadedFiles(prev => [...prev, ...uploadedFiles]);

      // Show success message with file analysis capability
      if (uploadedFiles.some(f => f.name.toLowerCase().includes('report') || f.name.toLowerCase().includes('lab') || f.name.toLowerCase().includes('test'))) {
        toast.success('Medical files uploaded! I can now analyze these reports and provide detailed insights.', {
          duration: 4000,
          icon: '🩺'
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file
  const removeUploadedFile = (fileId: string | number) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    chatbotService.removeUploadedFile(fileId);
    toast.success('File removed');
  };

  // Clear all uploaded files
  const clearAllFiles = () => {
    setUploadedFiles([]);
    chatbotService.clearUploadedFiles();
    toast.success('All files cleared');
  };

  return (
    <div className={`flex flex-col h-full relative ${className}`}>
      {/* Medical Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url('/images/illustrations/chatbot.svg')`,
            backgroundSize: '400px 400px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) opacity(0.3)'
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentMode.bgGradient} dark:from-gray-900 dark:to-gray-800 pointer-events-none`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentMode.theme} text-white px-6 py-4 shadow-lg backdrop-blur-sm bg-opacity-95`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold">
                {currentMode.title}
              </h1>
              <p className="text-sm opacity-90">
                {currentMode.subtitle} • {isServerAvailable ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportConversation}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Export conversation"
              disabled={messages.length === 0}
            >
              <Download className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearConversation}
              className="p-2 text-white/80 hover:text-red-200 hover:bg-white/20 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detail Level
                </label>
                <select
                  value={preferences.detailLevel}
                  onChange={(e) => handlePreferencesUpdate({ detailLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="simple">Simple</option>
                  <option value="medium">Medium</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Length
                </label>
                <select
                  value={preferences.responseLength}
                  onChange={(e) => handlePreferencesUpdate({ responseLength: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.useRAG}
                    onChange={(e) => handlePreferencesUpdate({ useRAG: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Use Medical Handbook</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.removeReferences}
                    onChange={(e) => handlePreferencesUpdate({ removeReferences: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Remove References</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chatbot Mode
                </label>
                <select
                  value={preferences.chatbotMode}
                  onChange={(e) => handlePreferencesUpdate({ chatbotMode: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="general">General</option>
                  <option value="emergency">Emergency</option>
                  <option value="elderly">Elderly Care</option>
                  <option value="specialist">Specialist</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files Section */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Uploaded Medical Files ({uploadedFiles.length})
                </h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllFiles}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear All</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <div className={`p-1.5 rounded ${
                        file.type.includes('pdf') ? 'bg-red-100 text-red-600' :
                        file.type.includes('image') ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {file.type.includes('pdf') ? <FileText className="h-3 w-3" /> :
                         file.type.includes('image') ? <Image className="h-3 w-3" /> :
                         <FileIcon className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          {file.processed ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400">Processed</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">Processing...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeUploadedFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {uploadedFiles.some(f => f.processed) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start space-x-2">
                  <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Medical Analysis Ready
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      I can now analyze your medical files and provide detailed insights, diagnoses, and recommendations based on the uploaded reports.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <motion.div
              className={`p-4 bg-gradient-to-r ${currentMode.theme} rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg`}
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <IconComponent className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome to {currentMode.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              {mode === 'emergency'
                ? 'For urgent medical guidance. Remember to call emergency services for life-threatening situations.'
                : mode === 'elderly'
                ? 'Gentle, easy-to-understand medical guidance tailored for seniors.'
                : mode === 'specialist'
                ? 'Advanced medical insights with detailed explanations and terminology.'
                : 'Ask me any medical questions and I\'ll provide accurate, helpful information based on current medical knowledge.'
              }
            </p>

            {/* Quick action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
              {mode === 'emergency' ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputMessage("I'm experiencing chest pain, what should I do?")}
                    className="p-3 text-left rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    "I'm experiencing chest pain"
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputMessage("What are the signs of a stroke?")}
                    className="p-3 text-left rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200 transition-colors"
                  >
                    <Brain className="w-4 h-4 inline mr-2" />
                    "Signs of a stroke"
                  </motion.button>
                </>
              ) : mode === 'elderly' ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputMessage("How can I manage my blood pressure?")}
                    className="p-3 text-left rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200 transition-colors"
                  >
                    <Heart className="w-4 h-4 inline mr-2" />
                    "Managing blood pressure"
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputMessage("What medications should I take with food?")}
                    className="p-3 text-left rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200 transition-colors"
                  >
                    <Activity className="w-4 h-4 inline mr-2" />
                    "Medication guidance"
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputMessage("What are the symptoms of diabetes?")}
                    className={`p-3 text-left rounded-lg bg-${currentMode.accentColor}-100 hover:bg-${currentMode.accentColor}-200 dark:bg-${currentMode.accentColor}-900/30 dark:hover:bg-${currentMode.accentColor}-900/50 text-${currentMode.accentColor}-800 dark:text-${currentMode.accentColor}-200 transition-colors`}
                  >
                    <Stethoscope className="w-4 h-4 inline mr-2" />
                    "Symptoms of diabetes"
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputMessage("How does the immune system work?")}
                    className={`p-3 text-left rounded-lg bg-${currentMode.accentColor}-100 hover:bg-${currentMode.accentColor}-200 dark:bg-${currentMode.accentColor}-900/30 dark:hover:bg-${currentMode.accentColor}-900/50 text-${currentMode.accentColor}-800 dark:text-${currentMode.accentColor}-200 transition-colors`}
                  >
                    <Microscope className="w-4 h-4 inline mr-2" />
                    "How immune system works"
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            mode={mode}
            onCopy={copyToClipboard}
            isLast={index === messages.length - 1}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <TypingIndicator mode={mode} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-end space-x-3">
          {/* File upload button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative p-3 bg-gradient-to-r ${currentMode.theme} text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50`}
            disabled={!isServerAvailable || isUploading}
            title="Upload medical files (PDF, images, reports)"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}

            {/* Upload count badge */}
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
              >
                {uploadedFiles.length}
              </motion.div>
            )}
          </motion.button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                mode === 'emergency'
                  ? "Describe your emergency medical situation..."
                  : mode === 'elderly'
                  ? "Ask me about your health concerns..."
                  : "Ask me any medical question..."
              }
              className={`w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-${currentMode.accentColor}-500 focus:border-transparent transition-all duration-200 ${mode === 'elderly' ? 'text-lg' : ''}`}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={!isServerAvailable}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || !isServerAvailable}
            className={`px-6 py-3 bg-gradient-to-r ${currentMode.theme} text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                {mode === 'elderly' && <span className="hidden sm:inline">Send</span>}
              </>
            )}
          </motion.button>
        </div>

        {!isServerAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Medical chatbot server is offline. Please try again later.
          </motion.div>
        )}

        {mode === 'emergency' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center text-sm text-red-600 dark:text-red-400"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            For life-threatening emergencies, call emergency services immediately.
          </motion.div>
        )}
      </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

// MessageBubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  mode: string;
  onCopy: (text: string) => void;
  isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, mode, onCopy, isLast }) => {
  const isUser = message.role === 'user';

  // Format message text with markdown support
  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const modeColors = {
    general: 'blue',
    emergency: 'red',
    elderly: 'green',
    specialist: 'purple'
  };

  const color = modeColors[mode as keyof typeof modeColors] || 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <motion.div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? `bg-${color}-600 text-white`
                : `bg-${color}-100 dark:bg-${color}-900 text-${color}-600 dark:text-${color}-400`
            }`}
            whileHover={{ scale: 1.1 }}
          >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </motion.div>
        </div>

        <motion.div
          className={`px-4 py-3 rounded-lg shadow-sm ${
            isUser
              ? `bg-${color}-600 text-white`
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          }`}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: formatMessage(message.parts[0]?.text || '')
            }}
          />

          {!isUser && (
            <div className="mt-2 flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCopy(message.parts[0]?.text || '')}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </motion.button>

              {message.timestamp && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

// TypingIndicator Component
interface TypingIndicatorProps {
  mode: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ mode }) => {
  const modeColors = {
    general: 'blue',
    emergency: 'red',
    elderly: 'green',
    specialist: 'purple'
  };

  const color = modeColors[mode as keyof typeof modeColors] || 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex justify-start"
    >
      <div className="flex mr-3">
        <div className={`w-8 h-8 rounded-full bg-${color}-100 dark:bg-${color}-900 text-${color}-600 dark:text-${color}-400 flex items-center justify-center`}>
          <Bot className="h-4 w-4" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <motion.div
              className={`w-2 h-2 bg-${color}-500 rounded-full`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className={`w-2 h-2 bg-${color}-500 rounded-full`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className={`w-2 h-2 bg-${color}-500 rounded-full`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            Qala-Lwazi is thinking...
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedMedicalChatbot;