#!/bin/bash

# Script to deploy Firebase Firestore indexes

echo "Deploying Firebase Firestore indexes..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Please install it first."
    echo "You can install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "You are not logged in to Firebase. Please login first."
    firebase login
fi

# Get the project ID
PROJECT_ID=$(firebase projects:list --json | grep -o '"projectId": "[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID="careaiproto"
    echo "Using default project ID: $PROJECT_ID"
else
    echo "Using Firebase project ID: $PROJECT_ID"
fi

# Deploy the indexes
echo "Deploying indexes to Firebase..."
firebase deploy --only firestore:indexes --project $PROJECT_ID

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "Indexes deployed successfully!"
else
    echo "Error deploying indexes."
    echo "Please try again or deploy manually through the Firebase Console:"
    echo "https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
fi

echo "Done!"
