#!/bin/bash
# Wylloh Demo Environment Initialization Script

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
GANACHE_PORT=8545
IPFS_API_PORT=5001
IPFS_GATEWAY_PORT=8080
DEMO_ENV_FILE=".env.demo"
CLIENT_ENV_FILE="client/.env.demo.local"
API_ENV_FILE="api/.env.demo.local"
STORAGE_ENV_FILE="storage/.env.demo.local"
SAMPLE_CONTENT_DIR="./demo-assets"

echo -e "${BOLD}Wylloh Demo Environment Setup${NC}"
echo "===============================\n"

# Check for required tools
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}Error: $1 is required but not installed.${NC}"
    echo "Please install it with: $2"
    exit 1
  fi
}

# Check dependencies
echo "Checking dependencies..."
check_dependency "node" "brew install node"
check_dependency "npm" "brew install node"
check_dependency "ipfs" "brew install ipfs"
check_dependency "jq" "brew install jq"

# Stop existing services
stop_services() {
  echo -e "\n${YELLOW}Stopping any existing services...${NC}"
  pkill -f "ganache" || true
  pkill -f "ipfs daemon" || true
  sleep 2
}

# 1. Start local blockchain
start_ganache() {
  echo -e "\n${BOLD}1. Starting local blockchain (Ganache)${NC}"
  echo "Starting Ganache on port $GANACHE_PORT..."
  
  # Start Ganache with deterministic addresses and specific chain ID
  ganache --deterministic --chain.chainId 1337 --wallet.defaultBalance 1000 --port $GANACHE_PORT > /tmp/ganache.log 2>&1 &
  
  GANACHE_PID=$!
  echo $GANACHE_PID > /tmp/ganache.pid
  sleep 2
  
  if ps -p $GANACHE_PID > /dev/null; then
    echo -e "${GREEN}✓ Ganache started successfully (PID: $GANACHE_PID)${NC}"
    # Extract account information
    TEST_ACCOUNT=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' http://localhost:$GANACHE_PORT | jq -r '.result[0]')
    TEST_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"  # First deterministic private key from Ganache
    echo "Test account: $TEST_ACCOUNT"
  else
    echo -e "${RED}✗ Failed to start Ganache${NC}"
    exit 1
  fi
}

# 2. Start local IPFS node
start_ipfs() {
  echo -e "\n${BOLD}2. Starting local IPFS node${NC}"
  
  # Initialize IPFS if needed
  if [ ! -d ~/.ipfs ]; then
    echo "Initializing IPFS..."
    ipfs init
  fi
  
  # Start IPFS daemon in offline mode
  echo "Starting IPFS daemon in offline mode..."
  ipfs daemon --offline > /tmp/ipfs.log 2>&1 &
  
  IPFS_PID=$!
  echo $IPFS_PID > /tmp/ipfs.pid
  sleep 5
  
  if ps -p $IPFS_PID > /dev/null; then
    echo -e "${GREEN}✓ IPFS started successfully (PID: $IPFS_PID)${NC}"
  else
    echo -e "${RED}✗ Failed to start IPFS${NC}"
    exit 1
  fi
}

# 3. Deploy contracts
deploy_contracts() {
  echo -e "\n${BOLD}3. Deploying smart contracts${NC}"
  
  # Run deployment script
  echo "Running contract deployment..."
  
  # This assumes you have a deployment script. Modify as needed for your project
  npx hardhat run scripts/deploy/deploy.js --network localhost
  
  # For demo purposes, we're using a placeholder contract address
  # In a real scenario, you'd extract this from the deployment output
  CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"  # Common first deployment address on Hardhat/Ganache
  TOKEN_FACTORY_ADDRESS="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"  # Common second deployment address
  
  echo -e "${GREEN}✓ Contracts deployed${NC}"
  echo "Main contract: $CONTRACT_ADDRESS"
  echo "Token factory: $TOKEN_FACTORY_ADDRESS"
}

# 4. Pre-load sample content to IPFS
load_sample_content() {
  echo -e "\n${BOLD}4. Loading sample content to IPFS${NC}"
  
  # Check if sample content directory exists
  if [ ! -d "$SAMPLE_CONTENT_DIR" ]; then
    echo "Creating sample content directory..."
    mkdir -p "$SAMPLE_CONTENT_DIR"
  fi
  
  # Check for sample movie file
  SAMPLE_MOVIE="$SAMPLE_CONTENT_DIR/sample_movie.mp4"
  if [ ! -f "$SAMPLE_MOVIE" ]; then
    echo "Downloading sample movie file..."
    # Download a Creative Commons sample video - Big Buck Bunny
    curl -L -o "$SAMPLE_MOVIE" "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4"
  fi
  
  # Add to IPFS
  echo "Adding sample movie to IPFS..."
  MOVIE_CID=$(ipfs add -Q "$SAMPLE_MOVIE")
  
  echo -e "${GREEN}✓ Sample content loaded to IPFS${NC}"
  echo "Movie CID: $MOVIE_CID"
  
  # Create metadata
  echo "Creating movie metadata..."
  METADATA_FILE="$SAMPLE_CONTENT_DIR/metadata.json"
  cat > "$METADATA_FILE" << EOF
{
  "title": "Big Buck Bunny",
  "description": "A sample movie for Wylloh demo",
  "director": "Sacha Goedegebure",
  "year": 2008,
  "contentCid": "$MOVIE_CID",
  "license": "Creative Commons Attribution 3.0",
  "thumbnailCid": "$MOVIE_CID"
}
EOF
  
  # Add metadata to IPFS
  METADATA_CID=$(ipfs add -Q "$METADATA_FILE")
  echo "Metadata CID: $METADATA_CID"
}

# 5. Update configuration with deployed addresses
update_configuration() {
  echo -e "\n${BOLD}5. Updating configuration${NC}"
  
  # Get local IP address
  LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
  
  echo "Local IP: $LOCAL_IP"
  
  # Create client environment file
  mkdir -p "client"
  echo "Creating client environment file..."
  cp "$DEMO_ENV_FILE" "$CLIENT_ENV_FILE"
  
  # Create API environment file
  mkdir -p "api"
  echo "Creating API environment file..."
  cp "$DEMO_ENV_FILE" "$API_ENV_FILE"
  
  # Create storage environment file
  mkdir -p "storage"
  echo "Creating storage environment file..."
  cp "$DEMO_ENV_FILE" "$STORAGE_ENV_FILE"
  
  # Update client environment values
  sed -i '' "s|REACT_APP_CONTRACT_ADDRESS=.*|REACT_APP_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"|g" "$CLIENT_ENV_FILE"
  sed -i '' "s|REACT_APP_TOKEN_FACTORY_ADDRESS=.*|REACT_APP_TOKEN_FACTORY_ADDRESS=\"$TOKEN_FACTORY_ADDRESS\"|g" "$CLIENT_ENV_FILE"
  sed -i '' "s|REACT_APP_TEST_ACCOUNT_ADDRESS=.*|REACT_APP_TEST_ACCOUNT_ADDRESS=\"$TEST_ACCOUNT\"|g" "$CLIENT_ENV_FILE"
  sed -i '' "s|REACT_APP_TEST_PRIVATE_KEY=.*|REACT_APP_TEST_PRIVATE_KEY=\"$TEST_PRIVATE_KEY\"|g" "$CLIENT_ENV_FILE"
  sed -i '' "s|REACT_APP_SAMPLE_MOVIE_CID=.*|REACT_APP_SAMPLE_MOVIE_CID=\"$MOVIE_CID\"|g" "$CLIENT_ENV_FILE"
  sed -i '' "s|REACT_APP_LOCAL_IP=.*|REACT_APP_LOCAL_IP=\"$LOCAL_IP\"|g" "$CLIENT_ENV_FILE"
  
  # Update API environment values
  sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=\"wylloh-demo-secret\"|g" "$API_ENV_FILE"
  sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=\"mongodb://localhost:27017/wylloh-demo\"|g" "$API_ENV_FILE"
  sed -i '' "s|API_PORT=.*|API_PORT=4000|g" "$API_ENV_FILE"
  sed -i '' "s|TOKEN_CONTRACT_ADDRESS=.*|TOKEN_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"|g" "$API_ENV_FILE"
  
  # Update storage environment values
  sed -i '' "s|IPFS_API_URL=.*|IPFS_API_URL=\"http://localhost:$IPFS_API_PORT\"|g" "$STORAGE_ENV_FILE"
  sed -i '' "s|IPFS_GATEWAY_URL=.*|IPFS_GATEWAY_URL=\"http://localhost:$IPFS_GATEWAY_PORT\"|g" "$STORAGE_ENV_FILE"
  sed -i '' "s|STORAGE_PORT=.*|STORAGE_PORT=4001|g" "$STORAGE_ENV_FILE"
  
  echo -e "${GREEN}✓ Configuration updated${NC}"
}

# Setup Seed One instructions
setup_seed_one() {
  echo -e "\n${BOLD}6. Seed One Configuration Instructions${NC}"
  echo -e "${YELLOW}Follow these steps to configure your Raspberry Pi (Seed One):${NC}"
  echo "1. Update the following file on your Raspberry Pi:"
  echo "   /etc/wylloh/config.json"
  echo
  echo "2. Use this configuration:"
  cat << EOF
{
  "providerUrl": "http://$LOCAL_IP:$GANACHE_PORT",
  "ipfsGateway": "http://$LOCAL_IP:$IPFS_GATEWAY_PORT",
  "contractAddress": "$CONTRACT_ADDRESS",
  "tokenFactoryAddress": "$TOKEN_FACTORY_ADDRESS",
  "demoMode": true
}
EOF
  echo
  echo "3. Restart the Wylloh service on your Raspberry Pi:"
  echo "   sudo systemctl restart wylloh"
  
  echo -e "\n${BOLD}7. Installing Wylloh Player on Seed One${NC}"
  echo -e "${YELLOW}To install the custom Wylloh Player on your Raspberry Pi:${NC}"
  echo "1. Ensure you have the required dependencies:"
  echo "   sudo apt update && sudo apt upgrade -y"
  echo "   sudo apt install -y git cmake build-essential autoconf libtool pkg-config"
  echo "   sudo apt install -y libssl-dev zlib1g-dev libyajl-dev libxml2-dev libxslt1-dev python3-dev"
  echo "   sudo apt install -y libcurl4-openssl-dev libsqlite3-dev libmicrohttpd-dev"
  echo
  echo "2. Clone the Wylloh Player repository to your Raspberry Pi:"
  echo "   git clone https://github.com/wy1bur/wylloh-player.git"
  echo "   cd wylloh-player"
  echo
  echo "3. Create build directory and configure:"
  echo "   mkdir build"
  echo "   cd build"
  echo "   cmake -DCMAKE_BUILD_TYPE=Debug .."
  echo
  echo "4. Compile (this may take some time on a Raspberry Pi):"
  echo "   make -j$(nproc)"
  echo
  echo "5. Make sure demo mode is enabled in Wylloh Player settings:"
  echo "   - Start Wylloh Player: ./wylloh-player"
  echo "   - Navigate to Settings > Wylloh > General"
  echo "   - Enable 'Demo Mode'"
  echo "   - Configure the IPFS gateway URL to: http://$LOCAL_IP:$IPFS_GATEWAY_PORT/ipfs/"
  echo
  echo "6. Automatic Configuration Alternative:"
  echo "   If you prefer automatic configuration, use this command:"
  echo "   ./setup/configure-demo.sh --local-ip=$LOCAL_IP --ganache-port=$GANACHE_PORT --ipfs-port=$IPFS_GATEWAY_PORT"
  echo "   --contract=$CONTRACT_ADDRESS --token-factory=$TOKEN_FACTORY_ADDRESS"
}

# Main execution
stop_services
start_ganache
start_ipfs
deploy_contracts
load_sample_content
update_configuration
setup_seed_one

echo -e "\n${GREEN}${BOLD}Demo environment successfully initialized!${NC}"
echo -e "To start the demo, run:${BOLD}"
echo "  yarn dev"
echo -e "${NC}"
echo "To stop the demo services when you're done:"
echo "  ./stop-demo.sh"

# Create stop script
cat > stop-demo.sh << 'EOF'
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
EOF

chmod +x stop-demo.sh

echo -e "\n${BOLD}Demo Setup Complete${NC}"