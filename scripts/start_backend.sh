#!/bin/bash

# Change to the backend directory
cd "Models backend"

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Set the PYTHONPATH to include the current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start the FastAPI server
echo "Starting the backend server on port 8003..."
python -m uvicorn api.main:app --host 0.0.0.0 --port 8003 --reload

# Note: The frontend should be running on a different port (default: 3000)
