#!/bin/bash

# Install required dependencies
echo "Installing required dependencies..."
npm install pako crypto-js ethers leaflet react-leaflet @types/pako @types/crypto-js --legacy-peer-deps

# Apply database migrations
echo "Please run the following SQL migrations in your Supabase SQL editor:"
echo "- migrations/20240620000004_fix_user_tutorials.sql"

# Start the application
echo "Starting the application..."
npm run dev
