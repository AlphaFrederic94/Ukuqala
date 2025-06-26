# Medical Chatbot Model Integration Guide

This document provides detailed information about the medical chatbot model integration in the Medical Prediction Services application.

## Model Information

- **Model**: ContactDoctor/Bio-Medical-Llama-3-2-1B-CoT-012025
- **Type**: Large Language Model (LLM)
- **Specialization**: Healthcare and biomedical domain
- **Size**: 1B parameters
- **Capabilities**: 
  - Answering medical questions
  - Providing information about diseases, symptoms, and treatments
  - Explaining medical concepts
  - Suggesting differential diagnoses

## Integration Code

The medical chatbot is integrated using the following service class:

```python
# services/chatbot/medical_chatbot_service.py

import os
import requests
from huggingface_hub import login

class MedicalChatbotService:
    def __init__(self):
        # Login to Hugging Face Hub
        self._login_to_huggingface()
        
        # Initialize the model
        self.model_id = "ContactDoctor/Bio-Medical-Llama-3-2-1B-CoT-012025"
        self.initialized = False
        self.available = False  # Flag to indicate if the model is available
        
    def _login_to_huggingface(self):
        """Login to Hugging Face Hub using the token from environment variable."""
        self.hf_token = os.environ.get("HF_TOKEN")
        try:
            login(token=self.hf_token)
            print("Successfully logged in to Hugging Face Hub")
        except Exception as e:
            print(f"Error logging in to Hugging Face Hub: {str(e)}")
    
    def initialize(self):
        """Initialize the model and check if it's available."""
        if not self.initialized:
            try:
                # Test if the model is available
                self._test_model_availability()
                self.initialized = True
                return True
            except Exception as e:
                print(f"Error initializing medical chatbot: {str(e)}")
                self.initialized = True  # Mark as initialized even if it failed
                return False
        return True
    
    def _test_model_availability(self):
        """Test if the model is available for inference."""
        try:
            # Simple test query
            test_message = "Hello"
            
            # Try to get a response
            response = self._query_huggingface(test_message, max_tokens=5)
            if "error" not in response:
                self.available = True
            else:
                self.available = False
                print(f"Model availability test failed: {response.get('error')}")
        except Exception as e:
            print(f"Model availability test failed: {str(e)}")
            self.available = False
    
    def _is_medical_question(self, question):
        """Determine if a question is medical-related."""
        medical_keywords = [
            'health', 'medical', 'disease', 'symptom', 'diagnosis', 'treatment', 'medicine', 'doctor',
            'hospital', 'patient', 'clinic', 'surgery', 'drug', 'prescription', 'therapy', 'cancer',
            'diabetes', 'heart', 'blood', 'pain', 'infection', 'virus', 'bacteria', 'allergy',
            'chronic', 'acute', 'condition', 'disorder', 'syndrome', 'illness', 'injury', 'wound',
            'fracture', 'bone', 'joint', 'muscle', 'nerve', 'brain', 'lung', 'liver', 'kidney',
            'stomach', 'intestine', 'colon', 'skin', 'rash', 'fever', 'cough', 'headache',
            'nausea', 'vomiting', 'diarrhea', 'constipation', 'fatigue', 'dizzy', 'swelling',
            'inflammation', 'immune', 'antibody', 'vaccine', 'vaccination', 'pandemic', 'epidemic',
            'outbreak', 'contagious', 'transmission', 'prevention', 'hygiene', 'sanitize',
            'disinfect', 'sterilize', 'mask', 'ppe', 'ventilator', 'oxygen', 'respiration',
            'breathing', 'pulse', 'heart rate', 'blood pressure', 'temperature', 'fever',
            'diet', 'nutrition', 'vitamin', 'mineral', 'supplement', 'exercise', 'fitness',
            'weight', 'obesity', 'anorexia', 'bulimia', 'mental health', 'depression', 'anxiety',
            'stress', 'trauma', 'ptsd', 'bipolar', 'schizophrenia', 'adhd', 'autism',
            'alzheimer', 'dementia', 'parkinson', 'stroke', 'seizure', 'epilepsy',
            'pregnancy', 'birth', 'fertility', 'contraception', 'menopause', 'menstruation',
            'std', 'sti', 'hiv', 'aids', 'herpes', 'chlamydia', 'gonorrhea', 'syphilis',
            'antibiotic', 'antiviral', 'antifungal', 'analgesic', 'nsaid', 'opioid',
            'steroid', 'insulin', 'chemotherapy', 'radiation', 'dialysis', 'transplant',
            'donor', 'recipient', 'genetic', 'dna', 'rna', 'chromosome', 'mutation',
            'hereditary', 'congenital', 'pathology', 'biopsy', 'autopsy', 'mortality',
            'morbidity', 'prognosis', 'remission', 'relapse', 'terminal', 'palliative',
            'hospice', 'euthanasia', 'dnr', 'advance directive', 'living will',
            'anatomy', 'physiology', 'histology', 'cytology', 'microbiology', 'immunology',
            'pharmacology', 'toxicology', 'epidemiology', 'biostatistics', 'public health',
            'occupational health', 'environmental health', 'global health', 'one health',
            'telemedicine', 'telehealth', 'ehealth', 'mhealth', 'digital health', 'ai in healthcare',
            'medical device', 'implant', 'prosthetic', 'orthotic', 'wheelchair', 'crutch',
            'walker', 'cane', 'hearing aid', 'glasses', 'contact lens', 'dental', 'orthodontic',
            'braces', 'filling', 'crown', 'root canal', 'extraction', 'implant', 'denture',
            'floss', 'mouthwash', 'toothpaste', 'toothbrush', 'gum disease', 'cavity',
            'plaque', 'tartar', 'enamel', 'dentin', 'pulp', 'nerve', 'root', 'crown',
            'molar', 'premolar', 'canine', 'incisor', 'wisdom tooth', 'baby tooth',
            'permanent tooth', 'primary tooth', 'deciduous tooth', 'adult tooth'
        ]
        
        question_lower = question.lower()
        for keyword in medical_keywords:
            if keyword.lower() in question_lower:
                return True
        return False
    
    def _query_huggingface(self, message, system_message=None, max_tokens=256):
        """Query the Hugging Face API."""
        API_URL = f"https://api-inference.huggingface.co/models/{self.model_id}"
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        
        # Default system message if none provided
        if system_message is None:
            system_message = (
                "You are NyxV1, a highly knowledgeable and experienced assistant developed by Ngana Noa (MasterSilver). "
                "You specialize in the healthcare and biomedical domain, with extensive medical expertise and practical experience. "
                "Your primary role is to assist users by answering medical-related questions with clear, well-explained responses. "
                "In your explanations, draw upon your deep understanding of relevant anatomical structures, physiological processes, "
                "diagnostic criteria, treatment guidelines, and other essential medical concepts. Use precise medical terminology, "
                "but ensure your answers remain accessible to a general audience. "
                "If a user asks a question that is not related to medicine or healthcare, respond with: "
                "'Sorry, I can only assist with medical-related inquiries.'"
            )
        
        # Prepare the payload
        payload = {
            "inputs": message,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": 0.7,
                "top_p": 0.9,
                "do_sample": True,
                "return_full_text": False
            },
            "options": {
                "wait_for_model": True,
                "timeout": 120  # Increase timeout to 120 seconds
            }
        }
        
        # Add retry mechanism
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                response = requests.post(API_URL, headers=headers, json=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return {"response": result[0].get("generated_text", ""), "model": self.model_id}
                    else:
                        return {"response": str(result), "model": self.model_id}
                elif response.status_code == 500 and "too busy" in response.text.lower() and attempt < max_retries - 1:
                    # If the model is too busy and we have retries left, wait and try again
                    print(f"Model busy, retrying in {retry_delay} seconds (attempt {attempt + 1}/{max_retries})")
                    import time
                    time.sleep(retry_delay)
                    # Increase delay for next retry
                    retry_delay *= 2
                    continue
                else:
                    return {"error": f"{response.status_code} {response.reason}: {response.text}", "model": self.model_id}
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"Request failed, retrying in {retry_delay} seconds (attempt {attempt + 1}/{max_retries}): {str(e)}")
                    import time
                    time.sleep(retry_delay)
                    # Increase delay for next retry
                    retry_delay *= 2
                    continue
                return {"error": str(e), "model": self.model_id}
    
    def generate_response(self, user_message, system_message=None, max_tokens=256):
        """Generate a response from the medical chatbot."""
        if not self.initialized:
            self.initialize()
        
        # Check if the question is medical-related
        if not self._is_medical_question(user_message):
            return {
                "response": "Sorry, I can only assist with medical-related inquiries.",
                "model": self.model_id
            }
        
        # If the model is not available, return a fallback response
        if not self.available:
            return {
                "response": "I'm sorry, but the medical AI model is currently unavailable. This could be due to access restrictions or server issues. Please try again later or contact support if the issue persists.",
                "model": self.model_id,
                "note": "This is a fallback response as the model could not be accessed."
            }
        
        # Query the model
        result = self._query_huggingface(user_message, system_message, max_tokens)
        
        return result

# Singleton instance
medical_chatbot_service = MedicalChatbotService()
```

## API Integration

The chatbot is integrated into the API using the following route:

```python
# api/routes/chatbot.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.chatbot import medical_chatbot_service

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    system_message: Optional[str] = None
    max_tokens: Optional[int] = 256

class ChatResponse(BaseModel):
    response: str
    model: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_medical_bot(request: ChatRequest):
    """
    Chat with the medical AI assistant.
    
    This endpoint allows users to send messages to a medical AI assistant
    and receive responses related to medical topics.
    
    - **message**: The user's message or question
    - **system_message**: Optional system message to guide the AI's behavior
    - **max_tokens**: Maximum number of tokens in the response (default: 256)
    """
    try:
        result = medical_chatbot_service.generate_response(
            user_message=request.message,
            system_message=request.system_message,
            max_tokens=request.max_tokens
        )
        
        if "error" in result:
            # Return a fallback response instead of raising an exception
            return {
                "response": "I'm sorry, but the medical AI model is currently unavailable. This could be due to access restrictions or server issues. Please try again later or contact support if the issue persists.",
                "model": medical_chatbot_service.model_id
            }
        
        return result
    except Exception as e:
        # Return a fallback response instead of raising an exception
        return {
            "response": f"I apologize, but I encountered an error while processing your request. Please try again with a different question or contact support if the issue persists.",
            "model": medical_chatbot_service.model_id
        }

@router.get("/status")
async def get_model_status():
    """
    Get the status of the medical chatbot model.
    
    Returns information about whether the model is initialized and ready to use.
    """
    # Initialize the model if it's not already initialized
    if not medical_chatbot_service.initialized:
        medical_chatbot_service.initialize()
        
    return {
        "initialized": medical_chatbot_service.initialized,
        "available": medical_chatbot_service.available,
        "model_id": medical_chatbot_service.model_id
    }
```

## Main Application Integration

The chatbot routes are integrated into the main application:

```python
# api/main.py (partial)

# Import routes
from api.routes import symptoms, diabetes, heart
from api.routes import finetuned_symptoms, finetuned_heart
from api.routes import advanced_symptoms
from api.routes import chatbot

# ... other code ...

# Advanced routes
app.include_router(advanced_symptoms.router, prefix="/api/advanced/symptoms", tags=["Advanced Symptoms"])

# Chatbot routes
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Medical Chatbot"])

# ... other code ...
```

## Environment Setup

To use the medical chatbot, you need to set up the following environment variables:

```bash
# Set the Hugging Face token
export HF_TOKEN=your_token_here
```

Or in Docker:

```dockerfile
# Dockerfile
ENV HF_TOKEN=your_token_here
```

Or in docker-compose.yml:

```yaml
services:
  api:
    # ... other configuration ...
    environment:
      - HF_TOKEN=your_token_here
```

## Dependencies

The following dependencies are required:

```
huggingface-hub>=0.16.0
requests>=2.31.0
```

Add these to your requirements.txt file.

## Testing the Integration

You can test the chatbot integration using the following script:

```python
# test_chatbot.py

import os
import requests
import json

# Set the API URL
API_URL = "http://localhost:8000/api/chatbot"

def test_chatbot_status():
    """Test the chatbot status endpoint."""
    response = requests.get(f"{API_URL}/status")
    print("Status Response:", json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_chatbot_chat():
    """Test the chatbot chat endpoint."""
    data = {
        "message": "What are the symptoms of diabetes?",
        "max_tokens": 256
    }
    
    response = requests.post(f"{API_URL}/chat", json=data)
    
    if response.status_code == 200:
        result = response.json()
        print("\nChat Response:")
        print(f"Model: {result['model']}")
        print(f"Response: {result['response']}")
        if "note" in result:
            print(f"Note: {result['note']}")
        return True
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    print("Testing Medical Chatbot API...")
    
    # Test status endpoint
    print("\n1. Testing status endpoint...")
    status_ok = test_chatbot_status()
    print(f"Status endpoint test {'passed' if status_ok else 'failed'}")
    
    # Test chat endpoint
    print("\n2. Testing chat endpoint...")
    chat_ok = test_chatbot_chat()
    print(f"Chat endpoint test {'passed' if chat_ok else 'failed'}")
```

## Usage Examples

### Python Example

```python
import requests

# Chat with the medical AI assistant
response = requests.post(
    "http://localhost:8000/api/chatbot/chat",
    json={
        "message": "What are the symptoms of diabetes?",
        "max_tokens": 256
    }
)
result = response.json()
print(f"Chatbot response: {result['response']}")
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/api/chatbot/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "What are the symptoms of diabetes?", "max_tokens": 256}'
```

### JavaScript Example

```javascript
fetch('http://localhost:8000/api/chatbot/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What are the symptoms of diabetes?',
    max_tokens: 256
  }),
})
.then(response => response.json())
.then(data => {
  console.log('Chatbot response:', data.response);
})
.catch((error) => {
  console.error('Error:', error);
});
```

## Customizing the System Message

You can customize the system message to guide the model's behavior:

```python
# Enhanced system message for organ functioning questions
ORGAN_SYSTEM_MESSAGE = """
You are NyxV1, a highly knowledgeable and experienced assistant developed by Ngana Noa (MasterSilver).
You specialize in the healthcare and biomedical domain, with extensive medical expertise and practical experience.
Your primary role is to assist users by answering medical-related questions with clear, well-explained responses.

For questions about organ functioning, provide detailed explanations including:
1. The anatomical structure of the organ
2. The physiological processes involved
3. The key functions and their importance
4. How the organ interacts with other body systems
5. Common disorders or diseases that affect the organ

Use precise medical terminology, but ensure your answers remain accessible to a general audience.
"""

# Use the custom system message
response = requests.post(
    "http://localhost:8000/api/chatbot/chat",
    json={
        "message": "How does the human heart function?",
        "system_message": ORGAN_SYSTEM_MESSAGE,
        "max_tokens": 300
    }
)
```

## Troubleshooting

### Model Unavailable

If the model is unavailable, the service will return a fallback response:

```json
{
  "response": "I'm sorry, but the medical AI model is currently unavailable. This could be due to access restrictions or server issues. Please try again later or contact support if the issue persists.",
  "model": "ContactDoctor/Bio-Medical-Llama-3-2-1B-CoT-012025",
  "note": "This is a fallback response as the model could not be accessed."
}
```

### Rate Limiting

The Hugging Face API may impose rate limits. The service includes a retry mechanism to handle cases where the model is too busy:

```
Model busy, retrying in 5 seconds (attempt 1/3)
```

### Token Issues

If you encounter token-related issues, make sure your Hugging Face token is valid and has the necessary permissions:

```
Error logging in to Hugging Face Hub: Invalid token
```

