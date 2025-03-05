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
UPDATED_ENV_FILE=".env.demo.local"
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
  npx hardhat run scripts/deploy.js --network localhost
  
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
  
  # Create updated environment file
  echo "Creating updated environment file..."
  cp "$DEMO_ENV_FILE" "$UPDATED_ENV_FILE"
  
  # Update values
  sed -i '' "s|REACT_APP_CONTRACT_ADDRESS=.*|REACT_APP_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"|g" "$UPDATED_ENV_FILE"
  sed -i '' "s|REACT_APP_TOKEN_FACTORY_ADDRESS=.*|REACT_APP_TOKEN_FACTORY_ADDRESS=\"$TOKEN_FACTORY_ADDRESS\"|g" "$UPDATED_ENV_FILE"
  sed -i '' "s|REACT_APP_TEST_ACCOUNT_ADDRESS=.*|REACT_APP_TEST_ACCOUNT_ADDRESS=\"$TEST_ACCOUNT\"|g" "$UPDATED_ENV_FILE"
  sed -i '' "s|REACT_APP_TEST_PRIVATE_KEY=.*|REACT_APP_TEST_PRIVATE_KEY=\"$TEST_PRIVATE_KEY\"|g" "$UPDATED_ENV_FILE"
  sed -i '' "s|REACT_APP_SAMPLE_MOVIE_CID=.*|REACT_APP_SAMPLE_MOVIE_CID=\"$MOVIE_CID\"|g" "$UPDATED_ENV_FILE"
  sed -i '' "s|REACT_APP_LOCAL_IP=.*|REACT_APP_LOCAL_IP=\"$LOCAL_IP\"|g" "$UPDATED_ENV_FILE"
  
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
echo -e "To start your application in demo mode, run:${BOLD}"
echo "  npm run start -- --env-file=$UPDATED_ENV_FILE"
echo -e "${NC}"
echo "To stop the demo services when you're done:"
echo "  ./stop-demo.sh"

# Create stop script
cat > stop-demo.sh << 'EOF'
#!/bin/bash
echo "Stopping demo services..."
kill $(cat /tmp/ganache.pid) 2>/dev/null || true
kill $(cat /tmp/ipfs.pid) 2>/dev/null || true
echo "Demo services stopped!"
EOF

chmod +x stop-demo.sh

echo -e "\n${BOLD}Demo Setup Complete${NC}"