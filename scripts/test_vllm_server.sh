#!/bin/bash

# Test the vLLM server with a medical question
echo "Testing vLLM server with a medical question..."
curl -X POST "http://localhost:8000/v1/chat/completions" \
    -H "Content-Type: application/json" \
    --data '{
        "model": "aaditya/Llama3-OpenBioLLM-70B",
        "messages": [
            {
                "role": "user",
                "content": "Describe the brain and how it functions"
            }
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }'

echo -e "\n\nDone!"
