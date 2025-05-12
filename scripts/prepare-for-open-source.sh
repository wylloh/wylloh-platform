#!/bin/bash

# Script to prepare the repository for open-sourcing
# This script helps clean up sensitive data and ensure the repository is ready for public viewing

echo "Preparing repository for open-sourcing..."

# Check if .env files exist and warn if they do
echo "Checking for environment files..."
ENV_FILES=$(find . -name ".env*" ! -name ".env.example" -type f)
if [ -n "$ENV_FILES" ]; then
  echo "WARNING: The following environment files were found and may contain sensitive data:"
  echo "$ENV_FILES"
  echo "Please review and delete these files before pushing to a public repository."
  echo ""
fi

# Check for potential private keys
echo "Checking for potential private keys..."
grep -r --include="*.{js,ts,json,sol}" "private" --include="*.{js,ts,json,sol}" "key" . | grep -v "node_modules" | grep -v "package-lock.json" | grep -v "yarn.lock"
echo ""

# Check for potential API keys
echo "Checking for potential API keys..."
grep -r --include="*.{js,ts,json,sol}" "api" --include="*.{js,ts,json,sol}" "key" . | grep -v "node_modules" | grep -v "package-lock.json" | grep -v "yarn.lock"
echo ""

# Check for potential passwords
echo "Checking for potential passwords..."
grep -r --include="*.{js,ts,json,sol}" "password" --include="*.{js,ts,json,sol}" "secret" . | grep -v "node_modules" | grep -v "package-lock.json" | grep -v "yarn.lock"
echo ""

# Check for JWT secrets
echo "Checking for JWT secrets..."
grep -r --include="*.{js,ts,json,sol}" "jwt" --include="*.{js,ts,json,sol}" "secret" . | grep -v "node_modules" | grep -v "package-lock.json" | grep -v "yarn.lock"
echo ""

# Create .env.example files if they don't exist
echo "Ensuring .env.example files exist..."

# Root .env.example
if [ ! -f ".env.example" ]; then
  echo "Creating .env.example in root directory..."
  cat > .env.example << EOL
# Root Environment Variables
NODE_ENV=development

# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
TOKEN_CONTRACT_ADDRESS=your_token_contract_address_here

# IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY=http://localhost:8080
EOL
fi

# API .env.example
if [ ! -f "api/.env.example" ]; then
  echo "Creating .env.example in api directory..."
  cat > api/.env.example << EOL
# API Environment Variables
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/wylloh
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
TOKEN_CONTRACT_ADDRESS=your_token_contract_address_here

# IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY=http://localhost:8080
EOL
fi

# Client .env.example
if [ ! -f "client/.env.example" ]; then
  echo "Creating .env.example in client directory..."
  cat > client/.env.example << EOL
# Client Environment Variables
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_IPFS_GATEWAY=/api/ipfs
REACT_APP_EDGE_SERVER=https://stream.wylloh.io
REACT_APP_CONTRACT_ADDRESS=your_contract_address_here
REACT_APP_MARKETPLACE_ADDRESS=your_marketplace_address_here
REACT_APP_WEB3_PROVIDER=http://localhost:8545
REACT_APP_CHAIN_ID=1337
REACT_APP_DEMO_MODE=false
REACT_APP_USE_SAMPLE_DATA=true
EOL
fi

# Ensure key documentation files exist
echo "Checking for key documentation files..."

# Verify PRD.md exists in root
if [ ! -f "PRD.md" ]; then
  echo "WARNING: PRD.md not found in root directory. Please copy from docs/prd/PRD.md and create a shortened version."
fi

# Verify README-OPEN-SOURCE.md exists
if [ ! -f "README-OPEN-SOURCE.md" ]; then
  echo "WARNING: README-OPEN-SOURCE.md not found. Please create this file with contribution guidelines."
fi

# Verify SECURITY.md exists
if [ ! -f "SECURITY.md" ]; then
  echo "WARNING: SECURITY.md not found. Please create this file with security guidelines."
fi

# Verify ROADMAP.md exists
if [ ! -f "ROADMAP.md" ]; then
  echo "WARNING: ROADMAP.md not found. Please create this file with development roadmap."
fi

echo ""
echo "Repository preparation check complete!"
echo "Please review any warnings above before making the repository public."
echo ""
echo "Don't forget to:"
echo "1. Review and update the README.md file"
echo "2. Ensure all sensitive data has been removed"
echo "3. Check that all required documentation is in place"
echo "4. Verify license information is correct"
echo "" 