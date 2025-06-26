#!/bin/bash

# Script to organize the CareAI project directory structure
# This script will move files to their appropriate directories

echo "Organizing CareAI project directory structure..."

# Create main directories if they don't exist
mkdir -p frontend/src frontend/public backend/api backend/ml backend/services scripts/database scripts/deployment scripts/utils docs config

# Move frontend files
echo "Moving frontend files..."
cp -r src/* frontend/src/ 2>/dev/null || true
cp -r public/* frontend/public/ 2>/dev/null || true
cp index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json package.json package-lock.json postcss.config.js tailwind.config.js frontend/ 2>/dev/null || true

# Move backend files
echo "Moving backend files..."
cp -r "Models backend"/* backend/ 2>/dev/null || true

# Move documentation files
echo "Moving documentation files..."
cp *.md docs/ 2>/dev/null || true

# Move configuration files
echo "Moving configuration files..."
cp *.json .env .firebaserc firebase.json firestore.rules storage.rules config/ 2>/dev/null || true

# Move scripts
echo "Moving scripts..."
cp *.js *.sh scripts/ 2>/dev/null || true
cp *.sql scripts/database/ 2>/dev/null || true
cp deploy*.sh scripts/deployment/ 2>/dev/null || true
cp generate*.sh create*.sh scripts/utils/ 2>/dev/null || true

# Create a new README.md in the root directory
cp docs/README.md . 2>/dev/null || true

echo "Project organization complete!"
echo "Please review the new structure and delete any redundant files."
echo "You may want to run 'git status' to see what files have been modified."
