#!/bin/bash

# stop-demo.sh
# Script to properly shut down all demo-related processes and free up ports

echo "Stopping Wylloh Demo Environment..."

# Kill client process (React app on port 3000)
echo "Stopping client application..."
CLIENT_PID=$(lsof -ti:3000)
if [ -n "$CLIENT_PID" ]; then
  kill -9 $CLIENT_PID
  echo "✓ Client application stopped (PID: $CLIENT_PID)"
else
  echo "- No client application running on port 3000"
fi

# Kill API process (port 4000)
echo "Stopping API service..."
API_PID=$(lsof -ti:4000)
if [ -n "$API_PID" ]; then
  kill -9 $API_PID
  echo "✓ API service stopped (PID: $API_PID)"
else
  echo "- No API service running on port 4000"
fi

# Kill storage process (port 4001)
echo "Stopping storage service..."
STORAGE_PID=$(lsof -ti:4001)
if [ -n "$STORAGE_PID" ]; then
  kill -9 $STORAGE_PID
  echo "✓ Storage service stopped (PID: $STORAGE_PID)"
else
  echo "- No storage service running on port 4001"
fi

# Kill Ganache process (port 8545)
echo "Stopping Ganache blockchain..."
GANACHE_PID=$(lsof -ti:8545)
if [ -n "$GANACHE_PID" ]; then
  kill -9 $GANACHE_PID
  echo "✓ Ganache blockchain stopped (PID: $GANACHE_PID)"
else
  echo "- No Ganache blockchain running on port 8545"
fi

# Use PID files if they exist (backward compatibility)
if [ -f "/tmp/ganache.pid" ]; then
  GANACHE_PID_FILE=$(cat /tmp/ganache.pid 2>/dev/null)
  if [ -n "$GANACHE_PID_FILE" ]; then
    kill -9 $GANACHE_PID_FILE 2>/dev/null || true
    echo "✓ Ganache blockchain stopped (PID file: $GANACHE_PID_FILE)"
  fi
  rm /tmp/ganache.pid 2>/dev/null || true
fi

# Check for and stop IPFS daemon processes
echo "Stopping IPFS daemon..."
IPFS_PID=$(pgrep -f "ipfs daemon")
if [ -n "$IPFS_PID" ]; then
  kill -9 $IPFS_PID
  echo "✓ IPFS daemon stopped (PID: $IPFS_PID)"
else
  echo "- No IPFS daemon running"
fi

# Use PID files if they exist (backward compatibility)
if [ -f "/tmp/ipfs.pid" ]; then
  IPFS_PID_FILE=$(cat /tmp/ipfs.pid 2>/dev/null)
  if [ -n "$IPFS_PID_FILE" ]; then
    kill -9 $IPFS_PID_FILE 2>/dev/null || true
    echo "✓ IPFS daemon stopped (PID file: $IPFS_PID_FILE)"
  fi
  rm /tmp/ipfs.pid 2>/dev/null || true
fi

# Additional port checks for commonly used ports
for PORT in 5001 8080; do
  PORT_PID=$(lsof -ti:$PORT)
  if [ -n "$PORT_PID" ]; then
    echo "Stopping process on port $PORT (PID: $PORT_PID)..."
    kill -9 $PORT_PID
    echo "✓ Process stopped"
  fi
done

# Clean up temporary files
echo "Cleaning up temporary files..."
if [ -f "/tmp/ganache.log" ]; then
  rm /tmp/ganache.log
  echo "✓ Removed /tmp/ganache.log"
fi

if [ -f "/tmp/ipfs.log" ]; then
  rm /tmp/ipfs.log
  echo "✓ Removed /tmp/ipfs.log"
fi

# Clean up environment files
echo "Cleaning up environment files..."
ENV_FILES=(
  "api/.env.demo.local"
  "client/.env.demo.local"
  "storage/.env.demo.local"
  "api/env.demo.local"
  "client/env.demo.local"
  "storage/env.demo.local"
)

for ENV_FILE in "${ENV_FILES[@]}"; do
  if [ -f "$ENV_FILE" ]; then
    rm "$ENV_FILE"
    echo "✓ Removed $ENV_FILE"
  fi
done

# Clean up demo assets
echo "Cleaning up demo content..."
DEMO_FILES=(
  "demo-assets/metadata.json"
  "demo-assets/sample_movie.mp4"
)

for DEMO_FILE in "${DEMO_FILES[@]}"; do
  if [ -f "$DEMO_FILE" ]; then
    rm "$DEMO_FILE"
    echo "✓ Removed $DEMO_FILE"
  fi
done

# Option to remove demo-assets directory if empty
if [ -d "demo-assets" ] && [ -z "$(ls -A demo-assets)" ]; then
  rmdir "demo-assets"
  echo "✓ Removed empty demo-assets directory"
fi

echo "✅ Wylloh Demo Environment has been stopped successfully!"
echo "All ports have been released and temporary files cleaned up."
