#!/bin/bash

# Deploy SMS Integration for CareAI
# This script deploys the Firebase Functions and runs the SQL migration

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of SMS integration for CareAI...${NC}"

# Step 1: Deploy Firebase Functions
echo -e "\n${YELLOW}Step 1: Deploying Firebase Functions...${NC}"
cd functions
npm install
firebase deploy --only functions

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Firebase Functions deployed successfully!${NC}"
else
  echo -e "${RED}Error deploying Firebase Functions. Please check the logs above.${NC}"
  exit 1
fi

# Step 2: Run SQL Migration
echo -e "\n${YELLOW}Step 2: Running SQL Migration...${NC}"
cd ..

# Check if the Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}Supabase CLI not found. Using psql instead...${NC}"
  
  # Ask for Supabase connection details
  read -p "Enter Supabase database URL (or press Enter to use the SQL Editor in the Supabase dashboard): " DB_URL
  
  if [ -z "$DB_URL" ]; then
    echo -e "${YELLOW}Please run the SQL migration manually using the Supabase SQL Editor.${NC}"
    echo -e "${YELLOW}The SQL file is located at: migrations/add_phone_to_appointments.sql${NC}"
    echo -e "${YELLOW}Copy the contents of this file and paste it into the SQL Editor.${NC}"
  else
    # Run the SQL migration using psql
    psql "$DB_URL" -f migrations/add_phone_to_appointments.sql
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}SQL Migration executed successfully!${NC}"
    else
      echo -e "${RED}Error executing SQL Migration. Please check the logs above.${NC}"
      exit 1
    fi
  fi
else
  # Use Supabase CLI to run the migration
  supabase db execute -f migrations/add_phone_to_appointments.sql
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}SQL Migration executed successfully!${NC}"
  else
    echo -e "${RED}Error executing SQL Migration. Please check the logs above.${NC}"
    exit 1
  fi
fi

echo -e "\n${GREEN}SMS Integration deployment completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Test the SMS integration by booking an appointment"
echo -e "2. Check the Firebase Functions logs for any errors"
echo -e "3. Verify that SMS messages are being sent via Africa's Talking"

exit 0
