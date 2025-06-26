import React, { useState } from 'react';
import { sendMessageToClaude } from '../services/medicalChatbotService';
import { Send, Loader, Bot, User, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SimpleMedicalChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get response from Claude
      const response = await sendMessageToClaude(messages, input);
      
      // Add assistant message
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] rounded-lg overflow-hidden border border-gray-200 shadow-lg bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white">
        <h2 className="text-lg font-semibold flex items-center">
          <Stethoscope className="mr-2" size={20} />
          Medical Assistant
        </h2>
        <p className="text-sm opacity-80">Ask me any medical questions</p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
              <Stethoscope className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">How can I help you?</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Ask me any medical questions about health, diseases, treatments, or human biology.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              <button
                onClick={() => setInput("What are the symptoms of diabetes?")}
                className="p-2 text-sm text-left rounded-md bg-gray-100 hover:bg-gray-200"
              >
                "What are the symptoms of diabetes?"
              </button>
              <button
                onClick={() => setInput("How does the immune system work?")}
                className="p-2 text-sm text-left rounded-md bg-gray-100 hover:bg-gray-200"
              >
                "How does the immune system work?"
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-500'
                      : 'bg-gray-300'
                  }`}>
                    {message.role === 'user'
                      ? <User size={14} />
                      : <Bot size={14} />
                    }
                  </div>
                  <div className="font-medium">
                    {message.role === 'user' ? 'You' : 'Dr. Claude'}
                  </div>
                </div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-gray-100">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                  <Bot size={14} />
                </div>
                <div className="font-medium">Dr. Claude</div>
              </div>
              <div className="mt-2 flex items-center">
                <Loader className="animate-spin mr-2" size={16} />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a medical question..."
            className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 bottom-3 p-2 rounded-full ${
              !input.trim() || isLoading
                ? 'bg-gray-200 text-gray-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Dr. Claude provides general medical information, not personalized medical advice.
        </div>
      </div>
    </div>
  );
};

export default SimpleMedicalChatbot;
