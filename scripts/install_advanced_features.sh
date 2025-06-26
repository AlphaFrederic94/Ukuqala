#!/bin/bash

# Install dependencies for advanced features
echo "Installing dependencies for advanced features..."
npm install pako crypto-js ethers leaflet react-leaflet @types/pako @types/crypto-js --legacy-peer-deps

# Check if the installation was successful
if [ $? -eq 0 ]; then
  echo "Dependencies installed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Run the database migrations in your Supabase SQL editor:"
  echo "   - migrations/20240620000000_create_digital_twin_tables.sql"
  echo "   - migrations/20240620000001_create_health_map_tables.sql"
  echo "   - migrations/20240620000002_create_blockchain_health_tables.sql"
  echo "   - migrations/20240620000003_add_compression_to_social_posts.sql"
  echo ""
  echo "2. Start the application:"
  echo "   npm run dev"
  echo ""
  echo "3. Access the new features at:"
  echo "   - Digital Twin: http://localhost:3000/digital-twin"
  echo "   - Blockchain Health: http://localhost:3000/blockchain-health"
  echo "   - Health Map: http://localhost:3000/health-map"
  echo ""
  echo "For more information, see ADVANCED_FEATURES.md"
else
  echo "Error installing dependencies. Please try again."
fi
