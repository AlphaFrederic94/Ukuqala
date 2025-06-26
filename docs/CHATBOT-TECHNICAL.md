# Qala-Lwazi Medical Chatbot: Technical Documentation

## Architecture Overview

The Qala-Lwazi Medical Chatbot is built on a modern stack with a clear separation between frontend and backend components, connected via RESTful APIs.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │◄────►│  Express Server │◄────►│   Gemini API    │
│                 │      │                 │      │                 │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                         │    Pinecone     │
                         │  Vector Store   │
                         │                 │
                         └────────┬────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                         │    Supabase     │
                         │    Database     │
                         │                 │
                         └─────────────────┘
```

## Frontend Implementation

### Key Components

1. **GeminiMedicalChatbot.tsx**: Main component that handles:
   - User interface rendering
   - Message state management
   - API communication
   - Model switching between Base and Plus versions

2. **CSS Styling**:
   - Tailwind CSS for layout and basic styling
   - Custom CSS classes for specialized components
   - Distinct styling for Base vs Plus responses

### State Management

The component uses React hooks for state management:
- `useState` for managing messages, input, session, and UI states
- `useRef` for DOM references and scroll management
- `useEffect` for side effects like scrolling and focus management

### Message Processing

Messages are processed in several steps:
1. User input is captured and sent to the backend
2. "Thinking" indicator is displayed during processing
3. Response is received and parsed
4. Markdown-style formatting is converted to HTML
5. Response is displayed with appropriate styling

## Backend Implementation

### Server Components

1. **server.js**: Main Express server that:
   - Handles API endpoints
   - Manages conversation flow
   - Integrates with Gemini API
   - Coordinates between services

2. **pineconeService.js**: Handles vector search functionality:
   - Initializes connection to Pinecone
   - Processes queries for vector search
   - Formats retrieved context for the LLM

3. **supabaseClient.js**: Manages conversation persistence:
   - Saves messages to Supabase
   - Retrieves conversation history
   - Handles error cases gracefully

4. **status-endpoint.js**: Provides health check functionality:
   - Reports on service availability
   - Used by frontend to verify connection

### RAG Implementation

The Retrieval-Augmented Generation system is implemented as follows:

1. **Query Processing**:
   ```javascript
   // Expand query with medical terminology
   const expandedQuery = expandQuery(query);
   
   // Generate embedding for the query
   const embedding = await generateEmbedding(expandedQuery);
   ```

2. **Vector Search**:
   ```javascript
   // Perform hybrid search in Pinecone
   const searchResults = await pineconeIndex.query({
     vector: embedding,
     topK: numResults,
     filter: {},
     includeMetadata: true
   });
   ```

3. **Context Formatting**:
   ```javascript
   // Format retrieved passages for the LLM
   const formattedContext = searchResults.map((result, index) => {
     return `[${index + 1}] ${result.metadata.text}`;
   }).join('\n\n');
   ```

4. **Response Generation**:
   ```javascript
   // Send prompt with context to Gemini
   const promptWithContext = `${systemPrompt}\n\n${formattedContext}\n\nUser question: ${query}`;
   const result = await model.generateContent(promptWithContext);
   ```

### Fine-tuned Embedding Model

The embedding model was fine-tuned using the following process:

1. **Data Preparation**:
   - Collection of 1,542 medical text entries
   - Preprocessing to normalize text and remove artifacts
   - Conversion to JSONL format for training

2. **Training Process**:
   ```python
   # Initialize trainer with parameters
   trainer = SentenceTransformer(
       model_name_or_path=args.base_model,
       device=device
   )
   
   # Train the model
   trainer.fit(
       train_objectives=[(train_dataloader, train_loss)],
       epochs=args.epochs,
       warmup_steps=warmup_steps,
       evaluation_steps=evaluation_steps,
       evaluator=evaluator,
       output_path=args.output_dir
   )
   ```

3. **Model Evaluation**:
   - Achieved validation loss of 0.0000 after 3 epochs
   - Tested on medical query benchmarks
   - Compared performance against base model

## Database Schema

### Supabase Tables

**chat_messages**:
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX chat_messages_timestamp_idx ON chat_messages(timestamp);
```

## API Endpoints

### `/api/medical-chat` (POST)
- **Purpose**: Send a message to the chatbot and get a response
- **Request Body**:
  ```json
  {
    "message": "What causes headaches?",
    "sessionId": "optional-session-id",
    "userPreferences": {
      "detailLevel": "detailed",
      "responseLength": "long",
      "creativity": "balanced",
      "includeReferences": true,
      "useRAG": true
    }
  }
  ```
- **Response**:
  ```json
  {
    "response": "Detailed response text...",
    "sessionId": "session-id",
    "historyLength": 3,
    "usingRAG": true,
    "responseLength": 2308
  }
  ```

### `/api/chat-history/:sessionId` (GET)
- **Purpose**: Retrieve conversation history for a session
- **Response**:
  ```json
  {
    "sessionId": "session-id",
    "history": [
      {
        "role": "user",
        "parts": [{"text": "What causes headaches?"}]
      },
      {
        "role": "model",
        "parts": [{"text": "Response text..."}]
      }
    ]
  }
  ```

### `/api/chat-history/:sessionId` (DELETE)
- **Purpose**: Clear conversation history for a session
- **Response**:
  ```json
  {
    "success": true,
    "message": "Conversation history cleared"
  }
  ```

### `/api/chatbot/status` (GET)
- **Purpose**: Check if the chatbot service is available
- **Response**:
  ```json
  {
    "initialized": true,
    "available": true,
    "model_id": "qala-lwazi",
    "note": "Qala-Lwazi medical chatbot is running"
  }
  ```

## System Prompts

### Base Model Prompt
```
You are Qala-Lwazi, a helpful medical assistant powered by Ukuqala Labs. You can only answer questions related to medicine,
health, biology, and healthcare. Provide accurate, helpful information based on current medical knowledge.

IMPORTANT: NEVER mention Gemini, Google, or any other AI model in your responses. You are ONLY Qala-Lwazi.
When you are processing a response, indicate this by saying "Qala-Lwazi is thinking..." before providing your answer.

Always remind users to consult healthcare professionals for personalized medical advice.
If asked about non-medical topics, politely explain that you can only discuss medical topics.
Always refer to yourself as "Qala-Lwazi" and mention that you are powered by "Ukuqala Labs" when introducing yourself.

Format your responses in a clean, professional manner with clear headings and bullet points when appropriate.
```

### Enhanced Model Prompt (RAG)
```
You are Qala-Lwazi+, an enhanced medical assistant powered by Ukuqala Labs with access to a specialized medical handbook. 
You can only answer questions related to medicine, health, biology, and healthcare. Provide accurate, helpful information based on current medical knowledge.

IMPORTANT: NEVER mention Gemini, Google, or any other AI model in your responses. You are ONLY Qala-Lwazi+.
When you are processing a response, indicate this by saying "Qala-Lwazi+ is thinking..." before providing your answer.

I will provide you with relevant information from a medical handbook. Use this information to enhance your response.
When using information from the provided context:
1. Incorporate the information naturally into your response
2. Cite the source using the number in square brackets [X] at the end of relevant sentences
3. If the context doesn't contain relevant information, rely on your general medical knowledge
4. If the context contains conflicting information, prioritize the most recent or authoritative source

Always remind users to consult healthcare professionals for personalized medical advice.
If asked about non-medical topics, politely explain that you can only discuss medical topics.
Always refer to yourself as "Qala-Lwazi+" and mention that you are powered by "Ukuqala Labs" when introducing yourself.

Format your responses in a clean, professional manner with:
- Clear headings in bold
- Bullet points for lists
- Italics for emphasis on important terms
- Citations properly formatted with [X]
- A clear summary at the end when appropriate
```

## Data Sources

The medical knowledge in the chatbot comes from several sources:

1. **Medical Handbook**: A comprehensive collection of medical information stored in Pinecone
2. **Gemini's Base Knowledge**: General medical knowledge from Gemini's training
3. **Fine-tuned Embeddings**: Custom embeddings trained on medical corpus

## Deployment Instructions

Detailed deployment instructions are available in the `DEPLOYMENT.md` file.
