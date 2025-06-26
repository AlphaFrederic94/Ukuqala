# Claude AI Proxy Server

This is a simple Express.js server that acts as a proxy for the Claude AI API. It helps avoid CORS issues when calling the Claude API directly from the browser.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 3001 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: `{ "status": "ok" }`

### Claude API Proxy
- **URL**: `/api/claude`
- **Method**: `POST`
- **Body**:
```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 1000,
  "messages": [
    {
      "role": "user",
      "content": "Your message here"
    }
  ]
}
```
- **Response**: Claude API response

## Usage in the Application

The application is configured to use this proxy server for all Claude AI API calls. Make sure the server is running before using the chatbot or student verification features.

If you need to change the proxy URL, update the following files:
- `src/services/medicalChatbotService.ts`
- `src/services/studentVerificationService.ts`
