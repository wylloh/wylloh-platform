#!/bin/bash

# Build Client for Production Deployment
# This script builds the React client locally to avoid TypeScript compilation issues on VPS

set -e  # Exit on any error

echo "🚀 Building Wylloh Client for Production Deployment..."

# Navigate to client directory
cd "$(dirname "$0")/../client"

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔧 Building React application..."
REACT_APP_API_URL="https://api.wylloh.com" \
REACT_APP_WS_URL="wss://api.wylloh.com" \
REACT_APP_STORAGE_URL="https://storage.wylloh.com" \
REACT_APP_IPFS_GATEWAY="https://ipfs.wylloh.com" \
REACT_APP_NETWORK_ID="137" \
REACT_APP_CHAIN_NAME="Polygon" \
GENERATE_SOURCEMAP=false \
npm run build

echo "✅ Client built successfully!"
echo "📁 Build files are ready in ./client/build/"
echo ""
echo "Next steps:"
echo "1. Copy the entire project to your VPS"
echo "2. Run: docker-compose --profile production up -d client-production"
echo "3. The client will be served from pre-built static files"
echo ""
echo "🎯 This approach avoids TypeScript compilation issues on the VPS!" 