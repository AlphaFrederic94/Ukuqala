#!/bin/bash

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
firebase login

# Deploy the indexes
echo "Deploying Firebase indexes..."
firebase firestore:indexes --project careaiproto firebase-indexes.json

echo "Indexes deployed successfully!"
