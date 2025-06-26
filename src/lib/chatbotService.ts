import { toast } from 'react-hot-toast';

// Types for the chatbot service
export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp?: Date;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  useRAG?: boolean;
  useFDA?: boolean;
  detailLevel?: 'simple' | 'medium' | 'detailed';
  creativity?: 'conservative' | 'balanced' | 'creative';
  responseLength?: 'short' | 'medium' | 'long';
  includeReferences?: boolean;
  chatbotMode?: 'general' | 'emergency' | 'elderly' | 'specialist';
  removeReferences?: boolean;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  historyLength: number;
  usingRAG: boolean;
  usingFDA?: boolean;
  fdaData?: {
    medications: string[];
    hasInteractions: boolean;
    hasSafetyAlerts: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  };
  responseLength: number;
  medicalMode?: string;
  filesProcessed?: number;
}

export interface FDAMedicationInfo {
  drugName: string;
  label?: any;
  adverseEvents: any[];
  recalls: any[];
  error?: string;
}

export interface FDAResponse {
  medications: FDAMedicationInfo[];
  interactions: any[];
  safetyAlerts: any[];
  timestamp: string;
}

export interface UploadedFile {
  id: string | number;
  name: string;
  size: number;
  type: string;
  content?: string;
  processed?: boolean;
  contentLength?: number;
}

// Configuration
const GEMINI_PROXY_URL = import.meta.env.VITE_GEMINI_PROXY_URL || 'http://localhost:3001';

class ChatbotService {
  private sessionId: string | null = null;
  private conversationHistory: ChatMessage[] = [];
  private uploadedFiles: UploadedFile[] = [];
  private userPreferences: UserPreferences = {
    useRAG: true,
    useFDA: true,
    detailLevel: 'medium',
    creativity: 'balanced',
    responseLength: 'medium',
    includeReferences: false,
    chatbotMode: 'general',
    removeReferences: true
  };

  /**
   * Initialize a new chat session
   */
  async initializeSession(): Promise<string> {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationHistory = [];
    return this.sessionId;
  }

  /**
   * Clean response text by removing references if enabled
   */
  private cleanResponse(text: string): string {
    if (!this.userPreferences.removeReferences) {
      return text;
    }

    // Remove reference citations like [1], [2], etc.
    return text.replace(/\[\d+\]/g, '').trim();
  }

  /**
   * Upload files to the chatbot
   */
  async uploadFiles(files: FileList): Promise<UploadedFile[]> {
    try {
      const formData = new FormData();

      // Add files to form data
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${GEMINI_PROXY_URL}/api/upload-files`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.files) {
        // Store uploaded files with proper structure
        const processedFiles = data.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          content: file.content,
          processed: file.processed || true,
          contentLength: file.contentLength || file.content?.length || 0
        }));

        this.uploadedFiles = [...this.uploadedFiles, ...processedFiles];
        toast.success(`Successfully uploaded ${data.files.length} file(s): ${data.files.map((f: any) => f.name).join(', ')}`);
        return processedFiles;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Send a message to the medical chatbot
   */
  async sendMessage(message: string, includeFiles: boolean = true): Promise<ChatResponse> {
    try {
      if (!this.sessionId) {
        await this.initializeSession();
      }

      // Prepare files to send with the message
      const filesToSend = includeFiles ? this.uploadedFiles : [];

      const response = await fetch(`${GEMINI_PROXY_URL}/api/medical-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId,
          userPreferences: this.userPreferences,
          medicalMode: this.userPreferences.chatbotMode || 'general',
          files: filesToSend
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      // Clean the response if references should be removed
      const cleanedResponse = this.cleanResponse(data.response);

      // Update local conversation history
      const userMessage: ChatMessage = {
        role: 'user',
        parts: [{ text: message }],
        timestamp: new Date()
      };

      const assistantMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: cleanedResponse }],
        timestamp: new Date()
      };

      this.conversationHistory.push(userMessage, assistantMessage);

      // Clear uploaded files after sending (they're now part of the conversation)
      if (includeFiles && this.uploadedFiles.length > 0) {
        this.uploadedFiles = [];
      }

      // Return the cleaned response
      return { ...data, response: cleanedResponse };
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      toast.error('Failed to send message. Please try again.');
      throw error;
    }
  }

  /**
   * Get conversation history for the current session
   */
  async getConversationHistory(): Promise<ChatMessage[]> {
    if (!this.sessionId) {
      return [];
    }

    try {
      const response = await fetch(`${GEMINI_PROXY_URL}/api/chat-history/${this.sessionId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.conversationHistory = data.history || [];
      return this.conversationHistory;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      // Return local history as fallback
      return this.conversationHistory;
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(): Promise<boolean> {
    try {
      if (this.sessionId) {
        const response = await fetch(`${GEMINI_PROXY_URL}/api/chat-history/${this.sessionId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Clear local history
      this.conversationHistory = [];
      this.sessionId = null;

      toast.success('Conversation history cleared');
      return true;
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      toast.error('Failed to clear conversation history');
      return false;
    }
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences };
  }

  /**
   * Get current user preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get local conversation history
   */
  getLocalHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Check if the gemini-proxy server is available
   */
  async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${GEMINI_PROXY_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Gemini proxy server is not available:', error);
      return false;
    }
  }

  /**
   * Save conversation to local storage
   */
  saveToLocalStorage(): void {
    if (this.sessionId && this.conversationHistory.length > 0) {
      const sessionData = {
        sessionId: this.sessionId,
        messages: this.conversationHistory,
        preferences: this.userPreferences,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(`chatbot_session_${this.sessionId}`, JSON.stringify(sessionData));
    }
  }

  /**
   * Load conversation from local storage
   */
  loadFromLocalStorage(sessionId: string): boolean {
    try {
      const savedData = localStorage.getItem(`chatbot_session_${sessionId}`);
      if (savedData) {
        const sessionData = JSON.parse(savedData);
        this.sessionId = sessionData.sessionId;
        this.conversationHistory = sessionData.messages || [];
        this.userPreferences = { ...this.userPreferences, ...sessionData.preferences };
        return true;
      }
    } catch (error) {
      console.error('Error loading session from local storage:', error);
    }
    return false;
  }

  /**
   * Get all saved sessions from local storage
   */
  getSavedSessions(): Array<{ sessionId: string; timestamp: string; messageCount: number }> {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chatbot_session_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          sessions.push({
            sessionId: data.sessionId,
            timestamp: data.timestamp,
            messageCount: data.messages?.length || 0
          });
        } catch (error) {
          console.error('Error parsing saved session:', error);
        }
      }
    }
    return sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get currently uploaded files
   */
  getUploadedFiles(): UploadedFile[] {
    return [...this.uploadedFiles];
  }

  /**
   * Remove an uploaded file
   */
  removeUploadedFile(fileId: string | number): void {
    this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
  }

  /**
   * Clear all uploaded files
   */
  clearUploadedFiles(): void {
    this.uploadedFiles = [];
  }

  /**
   * Get FDA medication information
   */
  async getFDAMedicationInfo(medications: string[]): Promise<FDAResponse> {
    try {
      const response = await fetch(`${GEMINI_PROXY_URL}/api/fda-medication-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medications })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FDAResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting FDA medication info:', error);
      throw error;
    }
  }

  /**
   * Check if FDA integration is enabled
   */
  isFDAEnabled(): boolean {
    return this.userPreferences.useFDA !== false;
  }

  /**
   * Enable or disable FDA integration
   */
  setFDAEnabled(enabled: boolean): void {
    this.userPreferences.useFDA = enabled;
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();
export default chatbotService;
