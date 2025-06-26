#!/bin/bash

# Script to apply CORS configuration to Firebase Storage

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "Error: gsutil is not installed. Please install the Google Cloud SDK."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "You need to log in to Firebase first."
    echo "Run: firebase login"
    exit 1
fi

# Get the Firebase project ID
PROJECT_ID=$(firebase projects:list --json | grep -o '"projectId": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo "Could not determine Firebase project ID."
    echo "Please specify it manually:"
    read -p "Firebase Project ID: " PROJECT_ID
fi

echo "Using Firebase project ID: $PROJECT_ID"

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
    echo "Error: cors.json file not found."
    echo "Please create a cors.json file in the project root directory."
    exit 1
fi

# Apply CORS configuration
echo "Applying CORS configuration to Firebase Storage bucket..."
gsutil cors set cors.json gs://$PROJECT_ID.firebasestorage.app

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "CORS configuration applied successfully!"
    echo "Your Firebase Storage bucket is now configured to allow cross-origin requests."
else
    echo "Error applying CORS configuration."
    echo "Please check your Firebase project settings and try again."
    exit 1
fi

echo "Done!"
