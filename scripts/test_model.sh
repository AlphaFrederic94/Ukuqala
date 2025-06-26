#!/bin/bash

# Test query
echo "Testing the model with a medical query..."
curl -X POST "http://localhost:8000/v1/chat/completions" \
    -H "Content-Type: application/json" \
    --data '{
        "model": "aaditya/Llama3-OpenBioLLM-70B",
        "messages": [
            {
                "role": "user",
                "content": "Describe the brain and how it functions"
            }
        ]
    }'

echo -e "\n\nDone!"
