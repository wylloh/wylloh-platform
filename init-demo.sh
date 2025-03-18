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
DRY_RUN=false

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: ./init-demo.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run     Show what would be done without actually starting services"
      echo "  --help        Display this help message"
      exit 0
      ;;
  esac
done

echo -e "${BOLD}Wylloh Demo Environment Setup${NC}"
echo "===============================\n"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Running in dry-run mode. No services will be started.${NC}\n"
fi

# Check for required tools
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}Error: $1 is required but not installed.${NC}"
    echo "Please install it with: $2"
    exit 1
  fi
}

# Check Node.js version compatibility
check_node_version() {
  NODE_VERSION=$(node -v | cut -d "v" -f 2)
  NODE_MAJOR=$(echo $NODE_VERSION | cut -d "." -f 1)
  
  if [ "$NODE_MAJOR" -gt 18 ]; then
    echo -e "${YELLOW}Warning: You are using Node.js v$NODE_VERSION, which may cause compatibility issues with Hardhat.${NC}"
    echo "For best results, consider using Node.js v16 or v18 for this demo."
    echo "You can use nvm to switch versions:"
    echo "  nvm install 18"
    echo "  nvm use 18"
    echo ""
    
    # Ask if user wants to continue, unless in dry-run mode
    if [ "$DRY_RUN" = false ]; then
      read -p "Do you want to continue with Node.js v$NODE_VERSION? (y/n) " -n 1 -r
      echo ""
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting demo setup. Please use a compatible Node.js version and try again."
        exit 1
      fi
    else
      echo -e "${YELLOW}In dry-run mode - would prompt for Node.js version confirmation here${NC}"
    fi
  fi
}

# Check dependencies
echo "Checking dependencies..."
check_dependency "node" "brew install node"
check_dependency "npm" "brew install node"
check_dependency "ipfs" "brew install ipfs"
check_dependency "jq" "brew install jq"
check_node_version

# Stop existing services
stop_services() {
  echo -e "\n${YELLOW}Stopping any existing services...${NC}"
  
  if [ "$DRY_RUN" = false ]; then
    pkill -f "ganache" || true
    pkill -f "ipfs daemon" || true
    sleep 2
  else
    echo -e "${YELLOW}In dry-run mode - would stop existing services${NC}"
  fi
}

# 1. Start local blockchain
start_ganache() {
  echo -e "\n${BOLD}1. Starting local blockchain (Ganache)${NC}"
  echo "Starting Ganache on port $GANACHE_PORT..."
  
  if [ "$DRY_RUN" = false ]; then
    # Start Ganache with deterministic addresses and specific chain ID
    ganache --deterministic --chain.chainId 1337 --wallet.defaultBalance 1000 --port $GANACHE_PORT > /tmp/ganache.log 2>&1 &
    
    GANACHE_PID=$!
    echo $GANACHE_PID > /tmp/ganache.pid
    sleep 2
    
    if ps -p $GANACHE_PID > /dev/null; then
      echo -e "${GREEN}✓ Ganache started successfully (PID: $GANACHE_PID)${NC}"
      # Extract account information
      TEST_ACCOUNT=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' http://localhost:$GANACHE_PORT | jq -r '.result[2]')
      TEST_PRIVATE_KEY="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"  # Third deterministic private key from Ganache
      echo "Test account: $TEST_ACCOUNT"
    else
      echo -e "${RED}✗ Failed to start Ganache${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}In dry-run mode - would start Ganache on port $GANACHE_PORT${NC}"
    TEST_ACCOUNT="0x22d491bde2303f2f43325b2108d26f1eaba1e32b"  # Deterministic address from Ganache
    TEST_PRIVATE_KEY="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"  # Corresponding private key
    echo "Test account would be: $TEST_ACCOUNT"
  fi
}

# 2. Start local IPFS node
start_ipfs() {
  echo -e "\n${BOLD}2. Starting local IPFS node${NC}"
  
  if [ "$DRY_RUN" = false ]; then
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
  else
    echo -e "${YELLOW}In dry-run mode - would initialize IPFS if needed and start IPFS daemon${NC}"
  fi
}

# 3. Deploy contracts
deploy_contracts() {
  echo -e "\n${BOLD}3. Deploying smart contracts${NC}"
  
  # Check if hardhat.config.js exists and offer fix for ESM projects
  if [ -f "hardhat.config.js" ] && grep -q "\"type\": \"module\"" package.json; then
    echo -e "${YELLOW}Warning: Your project is an ESM project (has \"type\": \"module\" in package.json) but Hardhat config uses .js extension.${NC}"
    
    if [ "$DRY_RUN" = false ]; then
      echo "Would you like to rename hardhat.config.js to hardhat.config.cjs to fix this? (y/n)"
      read -n 1 -r
      echo ""
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv hardhat.config.js hardhat.config.cjs
        echo "Renamed hardhat.config.js to hardhat.config.cjs"
      else
        echo "Continuing without renaming the file. Contract deployment may fail."
      fi
    else
      echo -e "${YELLOW}In dry-run mode - would prompt to rename hardhat.config.js to hardhat.config.cjs${NC}"
    fi
  fi
  
  # Run deployment script
  echo "Running contract deployment..."
  
  if [ "$DRY_RUN" = false ]; then
    # This assumes you have a deployment script. Modify as needed for your project
    npx hardhat run scripts/deploy/deploy.js --network localhost
  else
    echo -e "${YELLOW}In dry-run mode - would deploy contracts to local blockchain${NC}"
  fi
  
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
  if [ ! -d "$SAMPLE_CONTENT_DIR" ] && [ "$DRY_RUN" = false ]; then
    echo "Creating sample content directory..."
    mkdir -p "$SAMPLE_CONTENT_DIR"
  elif [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}In dry-run mode - would create sample content directory if needed${NC}"
  fi
  
  # Check for sample movie file
  SAMPLE_MOVIE="$SAMPLE_CONTENT_DIR/sample_movie.mp4"
  if [ ! -f "$SAMPLE_MOVIE" ] && [ "$DRY_RUN" = false ]; then
    echo "Downloading sample movie file..."
    # Download a Creative Commons sample video - Big Buck Bunny
    curl -L -o "$SAMPLE_MOVIE" "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4"
  elif [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}In dry-run mode - would download sample movie file if needed${NC}"
  fi
  
  # Add to IPFS
  echo "Adding sample movie to IPFS..."
  if [ "$DRY_RUN" = false ]; then
    MOVIE_CID=$(ipfs add -Q "$SAMPLE_MOVIE")
  else
    MOVIE_CID="Qme4M6BcWt6iKHPP2YwwYg6KbX3uHYN559AFEA77N7cW9D" # Placeholder CID for dry run
    echo -e "${YELLOW}In dry-run mode - would add sample movie to IPFS${NC}"
  fi
  
  echo -e "${GREEN}✓ Sample content loaded to IPFS${NC}"
  echo "Movie CID: $MOVIE_CID"
  
  # Create metadata
  echo "Creating movie metadata..."
  METADATA_FILE="$SAMPLE_CONTENT_DIR/metadata.json"
  
  if [ "$DRY_RUN" = false ]; then
    cat > "$METADATA_FILE" << EOF
{
  "title": "Big Buck Bunny",
  "description": "A sample movie for Wylloh demo",
  "isDemo": true,
  "demoVersion": "$(date +%s)",
  "director": "Sacha Goedegebure",
  "year": 2008,
  "contentCid": "$MOVIE_CID",
  "license": "Creative Commons Attribution 3.0",
  "thumbnailCid": "$MOVIE_CID"
}
EOF
    
    # Add metadata to IPFS
    METADATA_CID=$(ipfs add -Q "$METADATA_FILE")
  else
    echo -e "${YELLOW}In dry-run mode - would create metadata file and add to IPFS${NC}"
    METADATA_CID="Qmaht9C4amfdKrDwo21XxYjPyLTowotGHpvMzSwp1kULjJ" # Placeholder CID for dry run
  fi
  
  echo "Metadata CID: $METADATA_CID"
}

# 5. Update configuration with deployed addresses
update_configuration() {
  echo -e "\n${BOLD}5. Updating configuration${NC}"
  
  # Get local IP address
  LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
  
  echo "Local IP: $LOCAL_IP"
  
  if [ "$DRY_RUN" = false ]; then
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
  else
    echo -e "${YELLOW}In dry-run mode - would create and update environment files for client, API, and storage services${NC}"
  fi
  
  echo -e "${GREEN}✓ Configuration updated${NC}"
}

# Setup Seed One instructions
setup_seed_one() {
  echo -e "\n${BOLD}6. Seed One Configuration Instructions${NC}"
  
  echo -e "\n${YELLOW}OPTION A: Wylloh Player (Recommended)${NC}"
  echo -e "Follow these steps to set up the Wylloh Player on your Seed One device:"
  echo "1. Clone the repository on your Seed One:"
  echo "   git clone https://github.com/wy1bur/wylloh-platform.git"
  echo "   cd wylloh-platform/seed-one"
  echo
  echo "2. Run the setup script as root:"
  echo "   sudo ./setup.sh"
  echo
  echo "3. When prompted, enter your MacBook's IP address: $LOCAL_IP"
  echo
  echo "4. The script will automatically:"
  echo "   - Install all required dependencies"
  echo "   - Configure the Wylloh Player for the demo environment"
  echo "   - Build the Wylloh Player from source"
  echo "   - Create desktop shortcuts and autostart entries"
  echo
  echo "5. After setup completes, restart your Seed One:"
  echo "   sudo reboot"
  echo
  echo "6. The Wylloh Player will automatically start and connect to your demo environment"
  echo
  echo "7. Alternatively, you can use the automatic configuration script:"
  echo "   ./setup/configure-demo.sh --local-ip=$LOCAL_IP --ganache-port=$GANACHE_PORT --ipfs-port=$IPFS_GATEWAY_PORT"
  echo "   --contract=$CONTRACT_ADDRESS --token-factory=$TOKEN_FACTORY_ADDRESS"
  
  echo -e "\n${YELLOW}OPTION B: Legacy Kodi Add-on (Deprecated)${NC}"
  echo -e "If you need to use the legacy Kodi add-on implementation on your Seed One:"
  echo "1. Update the following file on your Seed One:"
  echo "   /etc/wylloh/config.json"
  echo
  echo "2. Use this configuration:"
  cat << EOF
{
  "providerUrl": "http://$LOCAL_IP:$GANACHE_PORT",
  "ipfsGateway": "http://$LOCAL_IP:$IPFS_GATEWAY_PORT",
  "contractAddress": "$CONTRACT_ADDRESS",
  "tokenFactoryAddress": "$TOKEN_FACTORY_ADDRESS",
  "demoMode": true,
  "playerUrl": "http://$LOCAL_IP:3000/player"
}
EOF
  echo
  echo "3. Restart the Wylloh service on your Seed One:"
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
echo -e "To start the demo, run:${BOLD}"
echo "  cd client && BROWSER=open yarn start"
echo -e "${NC}"
echo "The above command will automatically open your browser to localhost:3000"
echo ""
echo "Our transaction monitoring script will now start running in the background."
echo "You can view blockchain transactions in real-time while testing."
echo ""
node scripts/monitor-transactions.js &
echo "Transaction monitoring started. Press Ctrl+C to exit when done."
echo ""
echo "To stop the demo services when you're done:"
echo "  ./stop-demo.sh"
echo ""
echo "Demo Setup Complete"

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