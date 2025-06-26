#!/bin/bash

# Start the backend server
cd "Models backend"
echo "Starting backend server..."
source venv/bin/activate
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start the frontend
cd ..
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Function to handle termination
cleanup() {
  echo "Shutting down services..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

echo "Both services are running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both services"

# Wait for both processes
wait
