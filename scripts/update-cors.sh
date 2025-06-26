#!/bin/bash

# Update CORS configuration for Firebase Storage
echo "Updating CORS configuration for Firebase Storage..."
gsutil cors set cors.json gs://careaiproto.appspot.com

echo "CORS configuration updated successfully."
