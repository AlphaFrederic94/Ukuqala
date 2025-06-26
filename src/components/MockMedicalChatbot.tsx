import React, { useState } from 'react';
import { Send, Loader, Bot, User, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Mock responses for common medical questions
const MOCK_RESPONSES: Record<string, string> = {
  "diabetes": `The common symptoms of diabetes include:

1. Increased thirst (polydipsia)
2. Frequent urination (polyuria)
3. Extreme hunger (polyphagia)
4. Unexplained weight loss
5. Fatigue
6. Blurred vision
7. Slow-healing sores
8. Frequent infections

Type 1 and Type 2 diabetes share many symptoms, but Type 1 typically develops quickly while Type 2 may develop gradually. If you're experiencing these symptoms, it's important to consult with a healthcare provider for proper diagnosis and treatment.`,

  "immune system": `The immune system is your body's defense network against infections and diseases. It works through:

1. Physical barriers: Skin, mucous membranes, stomach acid
2. Innate immunity: Immediate, non-specific response including:
   - White blood cells like neutrophils and macrophages
   - Inflammatory response
   - Complement proteins

3. Adaptive immunity: Targeted response including:
   - B lymphocytes (produce antibodies)
   - T lymphocytes (coordinate immune response and kill infected cells)
   - Memory cells that remember pathogens

When a pathogen (virus, bacteria, etc.) enters your body, your immune system recognizes it as foreign through antigens on its surface. This triggers a cascade of responses to neutralize and eliminate the threat.`,

  "migraine": `Migraines are severe headaches often characterized by:

1. Intense, throbbing pain (usually on one side of the head)
2. Sensitivity to light and sound
3. Nausea and vomiting
4. Visual disturbances (aura) in some cases

Common triggers include:
- Hormonal changes
- Certain foods and additives
- Stress
- Sleep changes
- Environmental factors
- Medications

Migraines are believed to involve abnormal brain activity affecting nerve signals, chemicals, and blood vessels. Genetics and environmental factors both play a role in their development.`,

  "heart disease": `To prevent heart disease, focus on these key strategies:

1. Maintain a heart-healthy diet:
   - Emphasize fruits, vegetables, whole grains
   - Limit saturated fats, sodium, and added sugars
   - Include lean proteins and healthy fats

2. Exercise regularly:
   - Aim for at least 150 minutes of moderate activity weekly
   - Include both cardio and strength training

3. Manage risk factors:
   - Monitor and control blood pressure
   - Keep cholesterol levels in check
   - Maintain healthy blood sugar levels

4. Avoid tobacco and limit alcohol

5. Maintain a healthy weight

6. Manage stress effectively

7. Get regular check-ups with your healthcare provider

These lifestyle changes can significantly reduce your risk of developing cardiovascular disease.`,

  "default": `As a medical assistant, I can provide information about various health topics, diseases, treatments, and human biology. 

I'm designed to give general medical information, not personalized medical advice. For specific health concerns, please consult with a qualified healthcare professional.

How can I help you with your medical questions today?`
};

const MockMedicalChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to get mock response based on keywords in the question
  const getMockResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('diabetes') || lowerQuestion.includes('sugar')) {
      return MOCK_RESPONSES.diabetes;
    } else if (lowerQuestion.includes('immune') || lowerQuestion.includes('immunity')) {
      return MOCK_RESPONSES["immune system"];
    } else if (lowerQuestion.includes('migraine') || lowerQuestion.includes('headache')) {
      return MOCK_RESPONSES.migraine;
    } else if (lowerQuestion.includes('heart') || lowerQuestion.includes('cardiovascular')) {
      return MOCK_RESPONSES["heart disease"];
    } else if (lowerQuestion.includes('hack') || lowerQuestion.includes('bomb') || 
               lowerQuestion.includes('poem') || lowerQuestion.includes('politics')) {
      return "I'm designed to provide information on medical topics only. I can't assist with that request, but I'd be happy to answer questions about health, medicine, or human biology.";
    }
    
    return MOCK_RESPONSES.default;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      try {
        // Get mock response
        const response = getMockResponse(userMessage.content);
        
        // Add assistant message
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to get a response. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 1500); // Simulate 1.5 second delay
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
          Medical Assistant (Mock)
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
                    {message.role === 'user' ? 'You' : 'Dr. Claude (Mock)'}
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
                <div className="font-medium">Dr. Claude (Mock)</div>
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

export default MockMedicalChatbot;
