#!/bin/bash
# Script to stop Wylloh demo environment

echo "Stopping Wylloh demo environment..."

# Stop services
pkill -f "ganache" || true
pkill -f "ipfs daemon" || true
pkill -f "node api/server.js" || true
pkill -f "npm run start" || true

echo "All services stopped."
