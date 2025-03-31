#!/bin/bash
# Script to stop Wylloh demo environment

echo "Stopping Wylloh demo environment..."

# Stop services
pkill -f "ganache" || true
pkill -f "ipfs daemon" || true
pkill -f "node api/server.js" || true
pkill -f "npm run start" || true

# Explicitly check and kill any process using port 3000
PORT_3000_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000_PID" ]; then
  echo "Killing process using port 3000 (PID: $PORT_3000_PID)..."
  kill -9 $PORT_3000_PID 2>/dev/null || true
  sleep 1
  
  # Verify the port is free
  if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Warning: Failed to kill process on port 3000. Try manually with: kill -9 $(lsof -ti:3000)"
  else
    echo "Successfully freed port 3000."
  fi
fi

# Check for React development server processes that might have been missed
REACT_PIDS=$(ps aux | grep "react-scripts/scripts/start" | grep -v grep | awk '{print $2}')
if [ ! -z "$REACT_PIDS" ]; then
  echo "Killing React development server processes..."
  for pid in $REACT_PIDS; do
    echo "Killing React process with PID: $pid"
    kill -9 $pid 2>/dev/null || true
  done
fi

echo "All services stopped."
