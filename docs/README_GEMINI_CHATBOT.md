# Gemini Medical Chatbot

This project implements a medical chatbot powered by Google's Gemini AI. It consists of a backend proxy server to securely handle API calls and a frontend React component for the user interface.

## Features

- Medical knowledge base powered by Gemini AI
- Secure backend proxy to protect API key
- Responsive chat interface
- Real-time typing indicators
- Fullscreen mode
- Mobile-friendly design

## Project Structure

```
project/
├── backend/
│   └── gemini-proxy/
│       ├── server.js         # Express server with Gemini API integration
│       ├── package.json      # Backend dependencies
│       └── .env              # Environment variables (API key)
└── frontend/
    └── src/
        ├── components/
        │   └── GeminiMedicalChatbot.jsx  # Chat UI component
        └── pages/
            └── GeminiDemo.jsx            # Demo page
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend/gemini-proxy
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3001
   ```

4. Start the backend server:
   ```
   npm start
   ```

   The server should now be running on http://localhost:3001

### Frontend Setup

1. Make sure the backend server is running

2. Add the GeminiMedicalChatbot component to your React application

3. Import and use the component in your pages:
   ```jsx
   import GeminiMedicalChatbot from '../components/GeminiMedicalChatbot';
   
   function YourPage() {
     return (
       <div>
         {/* Your page content */}
         <GeminiMedicalChatbot />
       </div>
     );
   }
   ```

4. To use the demo page, import it in your routes:
   ```jsx
   import GeminiDemo from './pages/GeminiDemo';
   
   // In your router configuration
   <Route path="/gemini-demo" element={<GeminiDemo />} />
   ```

## Usage

1. Start both the backend and frontend servers
2. Navigate to the page where you've added the chatbot component
3. Click on the floating chatbot button in the bottom right corner
4. Type your medical questions and get responses from Gemini AI

## Example Questions

- "What are the symptoms of diabetes?"
- "How does the heart work?"
- "What causes migraines?"
- "What are the side effects of ibuprofen?"
- "How can I prevent heart disease?"

## Security Considerations

- The backend proxy server protects your Gemini API key from being exposed in the frontend code
- In production, ensure proper CORS settings are configured
- Consider adding rate limiting to prevent abuse

## Dependencies

### Backend
- Express.js
- @google/generative-ai
- cors
- dotenv

### Frontend
- React
- lucide-react (for icons)

## Troubleshooting

### Backend Issues
- Make sure your Gemini API key is valid
- Check that the port (default: 3001) is not being used by another application
- Verify that CORS is properly configured if accessing from a different domain

### Frontend Issues
- Ensure the backend URL is correctly set in the fetch request
- Check browser console for any errors
- Verify that the backend server is running

## Disclaimer

This medical chatbot is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
