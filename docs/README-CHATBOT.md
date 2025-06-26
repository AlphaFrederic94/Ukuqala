# Qala-Lwazi Medical Chatbot

## Overview
Qala-Lwazi is a specialized medical chatbot powered by Ukuqala Labs, designed to provide accurate and helpful information about medical topics. The chatbot comes in two versions:

1. **Qala-Lwazi (Base)** - Standard model for general medical questions
2. **Qala-Lwazi+** - Enhanced model with access to a specialized medical handbook

## Features

### Core Capabilities
- Medical knowledge focused on medicine, health, biology, and healthcare
- Two distinct models with different capabilities and UI presentations
- Markdown formatting support for structured responses
- Real-time "thinking" indicators during response generation
- Conversation history persistence via Supabase
- Responsive UI that works in both compact and fullscreen modes

### Qala-Lwazi+ Enhanced Features
- Retrieval-Augmented Generation (RAG) using a fine-tuned medical embedding model
- Access to a specialized medical handbook for more accurate responses
- Citation support with numbered references [X]
- Enhanced formatting with headings, lists, and emphasis
- Distinctive UI with gradient backgrounds and special styling

## Technical Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom CSS for specialized components
- **State Management**: React hooks for local state
- **HTTP Client**: Native fetch API
- **Markdown Processing**: Custom regex-based markdown-to-HTML conversion
- **UI Components**: Custom components with responsive design

### Backend
- **Server**: Node.js with Express
- **AI Integration**: Google's Generative AI (Gemini 1.5 Flash)
- **Vector Database**: Pinecone for medical knowledge retrieval
- **Database**: Supabase for conversation history storage
- **Embedding Model**: Fine-tuned all-MiniLM-L6-v2 model for medical text
- **Caching**: In-memory cache for performance optimization

### Data Sources
- **Medical Handbook**: Specialized medical content stored in Pinecone
- **Fine-tuned Embeddings**: Custom-trained embedding model on medical corpus
- **System Prompts**: Carefully crafted prompts to guide the AI's behavior

## Implementation Details

### RAG System
The Retrieval-Augmented Generation system works as follows:
1. User query is processed and expanded with medical terminology
2. Query is embedded using a fine-tuned medical embedding model
3. Relevant passages are retrieved from Pinecone vector database
4. Retrieved context is formatted and sent to Gemini along with the query
5. Gemini generates a response incorporating the retrieved information
6. Citations are added to reference the source material

### Embedding Model
- **Base Model**: all-MiniLM-L6-v2
- **Fine-tuning Dataset**: 1,542 medical text entries
- **Training Parameters**: 
  - Batch size: 16
  - Epochs: 3
  - Learning rate: 2e-5
  - Max sequence length: 256
- **Performance**: Achieved validation loss of 0.0000

### Conversation Flow
1. User sends a message through the frontend interface
2. Message is sent to the backend API
3. Backend determines whether to use RAG based on model selection
4. For RAG queries, relevant medical information is retrieved
5. Gemini generates a response with the appropriate system prompt
6. Response is sent back to frontend and displayed with proper formatting
7. Conversation history is stored in Supabase for persistence

### System Prompts
Two distinct system prompts guide the behavior of the models:
1. **Base Model Prompt**: Focuses on general medical knowledge with clear formatting
2. **Enhanced Model Prompt**: Includes instructions for using retrieved context, citation formatting, and more detailed presentation

## User Experience

### UI Elements
- Floating chat button for easy access
- Model toggle to switch between Base and Plus versions
- Fullscreen mode for extended reading
- Typing indicators during response generation
- Distinctive styling for different message types
- Responsive design that works on various screen sizes

### Response Formatting
- Headers for structured information
- Bold text for emphasis
- Lists for organized points
- Citations with reference numbers
- Proper spacing and paragraph breaks

## Deployment

### Requirements
- Node.js 14+
- Supabase account
- Pinecone account
- Google Generative AI API key

### Environment Variables
- `GEMINI_API_KEY`: API key for Google's Generative AI
- `SUPABASE_URL`: URL for Supabase instance
- `SUPABASE_KEY`: API key for Supabase
- `PINECONE_API_KEY`: API key for Pinecone
- `PINECONE_ENVIRONMENT`: Pinecone environment
- `PINECONE_INDEX`: Name of the Pinecone index

## Future Improvements
- Integration with Electronic Health Records (EHR)
- Multi-language support
- Voice input and output
- Image analysis for medical images
- Personalized responses based on user health profile
- Enhanced security features for medical data
