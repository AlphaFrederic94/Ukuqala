# Qala-Lwazi Medical Chatbot: Deployment Guide

This guide provides step-by-step instructions for deploying the Qala-Lwazi Medical Chatbot.

## Prerequisites

Before deploying, ensure you have the following:

1. **API Keys and Access**:
   - Google Generative AI API key (for Gemini)
   - Pinecone API key and environment
   - Supabase URL and API key

2. **Development Environment**:
   - Node.js (v14 or higher)
   - npm or yarn
   - Git

## Backend Deployment

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Backend Dependencies

```bash
cd backend/gemini-proxy
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/gemini-proxy` directory:

```
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Server
PORT=3001
```

### 4. Set Up Supabase Database

Run the following SQL in your Supabase SQL editor:

```sql
-- Create chat_messages table for storing conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);

-- Create index on timestamp for sorting
CREATE INDEX IF NOT EXISTS chat_messages_timestamp_idx ON chat_messages(timestamp);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for simplicity)
-- In a production environment, you would want more restrictive policies
CREATE POLICY chat_messages_policy ON chat_messages
  USING (true)
  WITH CHECK (true);

-- Grant access to authenticated and anon users
GRANT ALL ON chat_messages TO authenticated, anon;
```

### 5. Set Up Pinecone Vector Database

1. Create a new index in Pinecone with the following settings:
   - Dimensions: 384 (for all-MiniLM-L6-v2)
   - Metric: cosine
   - Pod Type: p1 or s1 (depending on your needs)

2. Upload your medical handbook data to Pinecone using the provided scripts:
   ```bash
   cd scripts
   node upload-to-pinecone.js
   ```

### 6. Start the Backend Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## Frontend Deployment

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```
VITE_API_URL=http://localhost:3001
```

### 3. Build the Frontend

```bash
npm run build
```

### 4. Serve the Frontend

For development:
```bash
npm run dev
```

For production, serve the built files from the `dist` directory using a static file server.

## Production Deployment

For production deployment, consider the following options:

### Option 1: Docker Deployment

1. Build Docker images for frontend and backend:
   ```bash
   # Backend
   cd backend/gemini-proxy
   docker build -t qala-lwazi-backend .
   
   # Frontend
   cd frontend
   docker build -t qala-lwazi-frontend .
   ```

2. Run containers:
   ```bash
   # Backend
   docker run -d -p 3001:3001 --env-file .env --name qala-lwazi-backend qala-lwazi-backend
   
   # Frontend
   docker run -d -p 3000:80 --name qala-lwazi-frontend qala-lwazi-frontend
   ```

### Option 2: Cloud Deployment

#### Backend

1. **Heroku**:
   ```bash
   cd backend/gemini-proxy
   heroku create qala-lwazi-backend
   heroku config:set GEMINI_API_KEY=your_key PINECONE_API_KEY=your_key ...
   git push heroku main
   ```

2. **AWS Elastic Beanstalk**:
   - Create a new application
   - Upload a zip of your backend code
   - Configure environment variables

#### Frontend

1. **Netlify**:
   ```bash
   cd frontend
   netlify deploy --prod
   ```

2. **Vercel**:
   ```bash
   cd frontend
   vercel --prod
   ```

## Monitoring and Maintenance

### Logs

Monitor logs for errors and performance issues:

```bash
# Backend logs
cd backend/gemini-proxy
npm run logs

# Or in production environments
heroku logs --tail
```

### Updating the Medical Knowledge

To update the medical knowledge in Pinecone:

1. Prepare new medical content in JSONL format
2. Run the update script:
   ```bash
   cd scripts
   node update-pinecone.js --file new_medical_content.jsonl
   ```

### Backing Up Conversation History

Regularly back up the Supabase database:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Check if the backend server is running
   - Verify API keys are correct
   - Check network connectivity

2. **Missing Responses**:
   - Check Gemini API quota
   - Verify Pinecone index is properly populated
   - Check system prompts for errors

3. **Database Errors**:
   - Verify Supabase connection
   - Check table schema
   - Ensure RLS policies are correctly set

### Support

For additional support, contact the development team or refer to the project's GitHub issues page.
