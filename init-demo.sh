#!/bin/bash
# Wylloh Demo Environment Initialization Script

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
SAMPLE_CONTENT_DIR="$SCRIPT_DIR/sample_content"
PORT_GANACHE=8545
PORT_IPFS=5001
PORT_IPFS_GATEWAY=8080
PORT_API=8001
PORT_CLIENT=3000
PORT_REDIS=6379
GANACHE_LOG="$LOG_DIR/ganache.log"
IPFS_LOG="$LOG_DIR/ipfs.log"
API_LOG="$LOG_DIR/api.log"
CLIENT_LOG="$LOG_DIR/client.log"
ETH_NETWORK="localhost"
DRY_RUN=false
REDEPLOY_CONTRACTS=false
# Environment files
DEMO_ENV_FILE="$SCRIPT_DIR/.env.demo"
CLIENT_ENV_FILE="$SCRIPT_DIR/client/.env.local"
API_ENV_FILE="$SCRIPT_DIR/api/.env.local"
STORAGE_ENV_FILE="$SCRIPT_DIR/storage/.env.local"
# Default token factory address - this will be updated during contract deployment
TOKEN_FACTORY_ADDRESS="0x0000000000000000000000000000000000000000"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-contracts)
      SKIP_CONTRACTS=true
      shift
      ;;
    --skip-ipfs)
      SKIP_IPFS=true
      shift
      ;;
    --skip-load)
      SKIP_LOAD=true
      shift
      ;;
    --skip-api)
      SKIP_API=true
      shift
      ;;
    --skip-client)
      SKIP_CLIENT=true
      shift
      ;;
    --skip-player)
      SKIP_PLAYER=true
      shift
      ;;
    --only-deploy)
      SKIP_API=true
      SKIP_CLIENT=true
      SKIP_PLAYER=true
      shift
      ;;
    --only-local)
      SKIP_PLAYER=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      echo "🧪 Dry run mode - commands will be printed but not executed"
      shift
      ;;
    --redeploy-contracts)
      REDEPLOY_CONTRACTS=true
      echo "🔄 Force contract redeployment enabled"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --skip-contracts   Skip deploying contracts"
      echo "  --skip-ipfs        Skip starting IPFS"
      echo "  --skip-load        Skip loading sample content"
      echo "  --skip-api         Skip starting API server"
      echo "  --skip-client      Skip starting client"
      echo "  --skip-player      Skip setting up Seed One player"
      echo "  --only-deploy      Only deploy contracts and load content"
      echo "  --only-local       Skip Seed One player setup"
      echo "  --dry-run          Print commands without executing them"
      echo "  --redeploy-contracts Force redeployment of contracts even if they exist"
      echo "  --help, -h         Show this help message"
      exit 0
      ;;
    *)
      echo "⚠️ Unknown option: $1"
      echo "Run '$0 --help' for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BOLD}Wylloh Demo Environment Setup${NC}"
echo "===============================\n"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Running in dry-run mode. No services will be started.${NC}\n"
fi

if [ "$REDEPLOY_CONTRACTS" = true ]; then
  echo -e "${YELLOW}Contracts will be redeployed regardless of previous deployment.${NC}\n"
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
    pkill -f "node api/server.js" || true
    pkill -f "npm run start" || true
    
    # Explicitly check and kill any process using port 3000
    PORT_3000_PID=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$PORT_3000_PID" ]; then
      echo "Killing process using port 3000 (PID: $PORT_3000_PID)..."
      kill $PORT_3000_PID 2>/dev/null || true
    fi
    
    sleep 2
  else
    echo -e "${YELLOW}In dry-run mode - would stop existing services${NC}"
  fi
}

# 1. Start local blockchain
start_ganache() {
  echo -e "\n${BOLD}1. Starting local blockchain (Ganache)${NC}"
  echo "Starting Ganache on port $PORT_GANACHE..."
  
  if [ "$DRY_RUN" = false ]; then
    # Start Ganache with deterministic addresses and specific chain ID, and higher balance
    ganache --deterministic --chain.chainId 1337 --wallet.defaultBalance 2000 --port $PORT_GANACHE > $GANACHE_LOG 2>&1 &
    
    GANACHE_PID=$!
    echo $GANACHE_PID > /tmp/ganache.pid
    sleep 2
    
    if ps -p $GANACHE_PID > /dev/null; then
      echo -e "${GREEN}✓ Ganache started successfully (PID: $GANACHE_PID)${NC}"
      # Extract account information
      TEST_ACCOUNT=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' http://localhost:$PORT_GANACHE | jq -r '.result[2]')
      TEST_PRIVATE_KEY="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"  # Third deterministic private key from Ganache
      echo "Test account: $TEST_ACCOUNT"
    else
      echo -e "${RED}✗ Failed to start Ganache${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}In dry-run mode - would start Ganache on port $PORT_GANACHE${NC}"
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
    ipfs daemon --offline > $IPFS_LOG 2>&1 &
    
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

# Deploy smart contracts to the blockchain
function deploy_contracts() {
  local output=""
  local contract_address=""
  local marketplace_address=""
  local deploy_success=false
  
  section "Deploying Smart Contracts"
  
  # Check if contracts are already deployed
  if [[ -f "$SCRIPT_DIR/artifacts/contracts/addresses.json" && "$REDEPLOY_CONTRACTS" != "true" ]]; then
    echo "📄 Found existing contract deployment at:"
    echo "    $(cat "$SCRIPT_DIR/artifacts/contracts/addresses.json" | grep -E 'token|marketplace')"
    
    # Extract addresses from the file
    contract_address=$(cat "$SCRIPT_DIR/artifacts/contracts/addresses.json" | grep -o '"token": "[^"]*"' | cut -d'"' -f4)
    marketplace_address=$(cat "$SCRIPT_DIR/artifacts/contracts/addresses.json" | grep -o '"marketplace": "[^"]*"' | cut -d'"' -f4)
    
    if [[ -n "$contract_address" && -n "$marketplace_address" ]]; then
      echo "🔍 Using existing contract addresses:"
      echo "    Token: $contract_address"
      echo "    Marketplace: $marketplace_address"
      
      # Prompt for redeployment
      read -p "❓ Do you want to use these existing contracts? (Y/n): " use_existing
      use_existing=${use_existing:-Y}
      
      if [[ "$use_existing" =~ ^[Yy]$ ]]; then
        echo "✅ Using existing contract deployment"
        deploy_success=true
      else
        echo "🔄 Redeploying contracts as requested"
        REDEPLOY_CONTRACTS=true
      fi
    else
      echo "⚠️ Could not extract contract addresses from existing deployment"
      echo "🔄 Redeploying contracts"
      REDEPLOY_CONTRACTS=true
    fi
  fi
  
  # Deploy contracts if needed
  if [[ "$deploy_success" != "true" ]]; then
    echo "📄 Deploying smart contracts to the local blockchain..."
    
    # Run deployment script
    if [[ "$DRY_RUN" == "true" ]]; then
      echo "[DRY RUN] Would run: cd $SCRIPT_DIR && npx hardhat run scripts/deploy/deploy.cjs --network localhost"
    else
      cd "$SCRIPT_DIR"
      output=$(npx hardhat run scripts/deploy/deploy.cjs --network localhost 2>&1)
      
      if [[ $? -ne 0 ]]; then
        echo "❌ Contract deployment failed!"
        echo "$output"
        return 1
      fi
      
      # Parse contract addresses from output
      contract_address=$(echo "$output" | grep -o "WyllohToken: 0x[0-9a-fA-F]\{40\}")
      contract_address=${contract_address#"WyllohToken: "}
      
      marketplace_address=$(echo "$output" | grep -o "WyllohMarketplace: 0x[0-9a-fA-F]\{40\}")
      marketplace_address=${marketplace_address#"WyllohMarketplace: "}
      
      # Export the addresses as global variables
      export contract_address
      export marketplace_address
      
      # Validate addresses
      if [[ ! "$contract_address" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
        echo "❌ Invalid token contract address: $contract_address"
        return 1
      fi
      
      if [[ ! "$marketplace_address" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
        echo "❌ Invalid marketplace contract address: $marketplace_address"
        return 1
      fi
      
      echo "✅ Smart contracts deployed successfully!"
      echo "📄 Token contract: $contract_address"
      echo "📄 Marketplace contract: $marketplace_address"
      deploy_success=true
    fi
  fi
  
  # Update contract addresses in environment files
  if [[ "$deploy_success" == "true" && "$DRY_RUN" != "true" ]]; then
    echo "📝 Updating contract addresses in environment files..."
    
    # Update .env.local files
    sed -i.bak "s/REACT_APP_CONTRACT_ADDRESS=.*/REACT_APP_CONTRACT_ADDRESS=$contract_address/" "$SCRIPT_DIR/client/.env.local"
    sed -i.bak "s/REACT_APP_MARKETPLACE_ADDRESS=.*/REACT_APP_MARKETPLACE_ADDRESS=$marketplace_address/" "$SCRIPT_DIR/client/.env.local"
    
    # Update .env.demo file
    sed -i.bak "s/REACT_APP_CONTRACT_ADDRESS=.*/REACT_APP_CONTRACT_ADDRESS=$contract_address/" "$SCRIPT_DIR/.env.demo"
    sed -i.bak "s/REACT_APP_MARKETPLACE_ADDRESS=.*/REACT_APP_MARKETPLACE_ADDRESS=$marketplace_address/" "$SCRIPT_DIR/.env.demo"
    
    echo "✅ Environment files updated with contract addresses"
  fi
  
  # Return success
  return 0
}

# Verify deployed contracts
function verify_contracts() {
  section "Verifying Deployed Contracts"
  
  # Check if contract addresses are set in the current environment
  if [[ -z "$contract_address" || -z "$marketplace_address" ]]; then
    echo "⚠️ Contract addresses not set in variables, looking in environment files"
    
    # Get the contract addresses from artifacts if they exist
    if [[ -f "$SCRIPT_DIR/artifacts/contracts/addresses.json" ]]; then
      echo "📄 Reading contract addresses from artifacts file"
      contract_address=$(grep -o '"token": "[^"]*"' "$SCRIPT_DIR/artifacts/contracts/addresses.json" | cut -d'"' -f4)
      marketplace_address=$(grep -o '"marketplace": "[^"]*"' "$SCRIPT_DIR/artifacts/contracts/addresses.json" | cut -d'"' -f4)
    fi
    
    # If still not found, try env files
    if [[ -z "$contract_address" || -z "$marketplace_address" ]]; then
      echo "📄 Reading contract addresses from environment files"
      # Try client env file first since it was just updated
      if [[ -f "$SCRIPT_DIR/client/.env.local" ]]; then
        contract_address=$(grep "REACT_APP_CONTRACT_ADDRESS" "$SCRIPT_DIR/client/.env.local" | cut -d'=' -f2 | tr -d '"')
        marketplace_address=$(grep "REACT_APP_MARKETPLACE_ADDRESS" "$SCRIPT_DIR/client/.env.local" | cut -d'=' -f2 | tr -d '"')
      fi
      
      # If still not found, try demo env
      if [[ -z "$contract_address" || -z "$marketplace_address" ]]; then
        if [[ -f "$SCRIPT_DIR/.env.demo" ]]; then
          contract_address=$(grep "REACT_APP_CONTRACT_ADDRESS" "$SCRIPT_DIR/.env.demo" | cut -d'=' -f2 | tr -d '"')
          marketplace_address=$(grep "REACT_APP_MARKETPLACE_ADDRESS" "$SCRIPT_DIR/.env.demo" | cut -d'=' -f2 | tr -d '"')
        fi
      fi
    fi
    
    if [[ -z "$contract_address" || -z "$marketplace_address" ]]; then
      echo "❌ Could not find contract addresses in environment files"
      return 1
    fi
    
    echo "🔍 Found contract addresses:"
    echo "    Token: $contract_address"
    echo "    Marketplace: $marketplace_address"
  fi
  
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY RUN] Would verify contracts at addresses:"
    echo "    Token: $contract_address"
    echo "    Marketplace: $marketplace_address"
    return 0
  fi
  
  echo "🔍 Verifying contracts on local blockchain..."
  
  # Create temporary verification script
  local verify_script="$SCRIPT_DIR/temp-verify.cjs"
  cat > "$verify_script" << EOF
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Connect to local blockchain
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    
    // Check if token contract exists
    const tokenAddress = '$contract_address';
    const tokenCode = await provider.getCode(tokenAddress);
    if (tokenCode === '0x') {
      console.error('⚠️ No contract found at token address:', tokenAddress);
      process.exit(1);
    }
    console.log('✅ Token contract verified at', tokenAddress);
    
    // Check if marketplace contract exists
    const marketplaceAddress = '$marketplace_address';
    const marketplaceCode = await provider.getCode(marketplaceAddress);
    if (marketplaceCode === '0x') {
      console.error('⚠️ No contract found at marketplace address:', marketplaceAddress);
      process.exit(1);
    }
    console.log('✅ Marketplace contract verified at', marketplaceAddress);
    
    // Try to connect to token contract
    const tokenAbi = require('./artifacts/contracts/token/WyllohToken.sol/WyllohToken.json').abi;
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    
    // Call a function to verify interface
    const adminRole = await tokenContract.ADMIN_ROLE();
    console.log('✅ Token contract interface verified, ADMIN_ROLE:', adminRole);
    
    console.log('✅ All contracts verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Contract verification failed:', error.message);
    process.exit(1);
  }
}

main();
EOF
  
  # Run verification script
  cd "$SCRIPT_DIR"
  if npx hardhat run "$verify_script" --network localhost; then
    echo "✅ All contracts verified successfully!"
    rm "$verify_script"
    return 0
  else
    echo "❌ Contract verification failed!"
    
    # Prompt to continue
    read -p "❓ Do you want to continue with the demo setup? (Y/n): " continue_demo
    continue_demo=${continue_demo:-Y}
    
    if [[ "$continue_demo" =~ ^[Yy]$ ]]; then
      echo "⚠️ Continuing with demo setup despite contract verification failure"
      rm "$verify_script"
      return 0
    else
      echo "❌ Aborting demo setup due to contract verification failure"
      rm "$verify_script"
      return 1
    fi
  fi
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
    sed -i '' "s|REACT_APP_CONTRACT_ADDRESS=.*|REACT_APP_CONTRACT_ADDRESS=\"$contract_address\"|g" "$CLIENT_ENV_FILE"
    sed -i '' "s|REACT_APP_TOKEN_FACTORY_ADDRESS=.*|REACT_APP_TOKEN_FACTORY_ADDRESS=\"$TOKEN_FACTORY_ADDRESS\"|g" "$CLIENT_ENV_FILE"
    sed -i '' "s|REACT_APP_TEST_ACCOUNT_ADDRESS=.*|REACT_APP_TEST_ACCOUNT_ADDRESS=\"$TEST_ACCOUNT\"|g" "$CLIENT_ENV_FILE"
    sed -i '' "s|REACT_APP_TEST_PRIVATE_KEY=.*|REACT_APP_TEST_PRIVATE_KEY=\"$TEST_PRIVATE_KEY\"|g" "$CLIENT_ENV_FILE"
    sed -i '' "s|REACT_APP_SAMPLE_MOVIE_CID=.*|REACT_APP_SAMPLE_MOVIE_CID=\"$MOVIE_CID\"|g" "$CLIENT_ENV_FILE"
    sed -i '' "s|REACT_APP_LOCAL_IP=.*|REACT_APP_LOCAL_IP=\"$LOCAL_IP\"|g" "$CLIENT_ENV_FILE"
    
    # Update API environment values
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=\"wylloh-demo-secret\"|g" "$API_ENV_FILE"
    sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=\"mongodb://localhost:27017/wylloh-demo\"|g" "$API_ENV_FILE"
    sed -i '' "s|API_PORT=.*|API_PORT=4000|g" "$API_ENV_FILE"
    sed -i '' "s|TOKEN_CONTRACT_ADDRESS=.*|TOKEN_CONTRACT_ADDRESS=\"$contract_address\"|g" "$API_ENV_FILE"
    
    # Update storage environment values
    sed -i '' "s|IPFS_API_URL=.*|IPFS_API_URL=\"http://localhost:$PORT_IPFS\"|g" "$STORAGE_ENV_FILE"
    sed -i '' "s|IPFS_GATEWAY_URL=.*|IPFS_GATEWAY_URL=\"http://localhost:$PORT_IPFS_GATEWAY\"|g" "$STORAGE_ENV_FILE"
    sed -i '' "s|STORAGE_PORT=.*|STORAGE_PORT=4001|g" "$STORAGE_ENV_FILE"

    # Update .env.demo for backend services
    sed -i.bak "s/WEB3_PROVIDER_URL=.*/WEB3_PROVIDER_URL=$WEB3_PROVIDER_URL/" "$SCRIPT_DIR/.env.demo"
    sed -i.bak "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$contract_address/" "$SCRIPT_DIR/.env.demo"
    sed -i.bak "s/REACT_APP_MARKETPLACE_ADDRESS=.*/REACT_APP_MARKETPLACE_ADDRESS=$marketplace_address/" "$SCRIPT_DIR/.env.demo"

    # Create JSON config file for client
    CONFIG_DIR="$SCRIPT_DIR/client/src/config"
    CONFIG_FILE="$CONFIG_DIR/deployedAddresses.json"
    mkdir -p "$CONFIG_DIR"
    echo "{
      \"tokenAddress\": \"$contract_address\",
      \"marketplaceAddress\": \"$marketplace_address\"
    }" > "$CONFIG_FILE"
    echo "✅ Created client config file: $CONFIG_FILE"

    # Clean up backup files created by sed
    find "$SCRIPT_DIR/client" -name '.env.local.bak' -delete
    find "$SCRIPT_DIR" -name '.env.demo.bak' -delete

    # --- Demo Only: Pre-approve Marketplace Contract ---
    # In a real application, the seller would need to grant this approval via the UI.
    # For the demo, we automatically approve the marketplace using the seller's (Ganache account 0) private key.
    echo "Pre-approving marketplace contract ($marketplace_address) for token transfers by seller ($contract_address)..."
    cast send "$contract_address" "setApprovalForAll(address,bool)" "$marketplace_address" true --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
    echo "Marketplace approval set."
    # --- End Demo Only ---

    echo "---------------------------------------"
    echo "Writing deployed addresses to client config..."
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
  echo "   ./setup/configure-demo.sh --local-ip=$LOCAL_IP --ganache-port=$PORT_GANACHE --ipfs-port=$PORT_IPFS_GATEWAY"
  echo "   --contract=$contract_address --token-factory=$TOKEN_FACTORY_ADDRESS"
  
  echo -e "\n${YELLOW}OPTION B: Legacy Kodi Add-on (Deprecated)${NC}"
  echo -e "If you need to use the legacy Kodi add-on implementation on your Seed One:"
  echo "1. Update the following file on your Seed One:"
  echo "   /etc/wylloh/config.json"
  echo
  echo "2. Use this configuration:"
  cat << EOF
{
  "providerUrl": "http://$LOCAL_IP:$PORT_GANACHE",
  "ipfsGateway": "http://$LOCAL_IP:$PORT_IPFS_GATEWAY",
  "contractAddress": "$contract_address",
  "tokenFactoryAddress": "$TOKEN_FACTORY_ADDRESS",
  "demoMode": true,
  "playerUrl": "http://$LOCAL_IP:3000/player"
}
EOF
  echo
  echo "3. Restart the Wylloh service on your Seed One:"
  echo "   sudo systemctl restart wylloh"
}

# Function to display section headers
function section() {
  echo -e "\n${BOLD}$1${NC}"
  echo "-------------------------------"
}

# Function to create a stop script
function create_stop_script() {
  echo "Creating stop script..."
  
  STOP_SCRIPT="$SCRIPT_DIR/stop-demo.sh"
  
  if [ "$DRY_RUN" = false ]; then
    cat > "$STOP_SCRIPT" << EOF
#!/bin/bash
# Script to stop Wylloh demo environment

echo "Stopping Wylloh demo environment..."

# Stop services
pkill -f "ganache" || true
pkill -f "ipfs daemon" || true
pkill -f "node api/server.js" || true
pkill -f "npm run start" || true

# Explicitly check and kill any process using port 3000
PORT_3000_PID=\$(lsof -ti:3000 2>/dev/null)
if [ ! -z "\$PORT_3000_PID" ]; then
  echo "Killing process using port 3000 (PID: \$PORT_3000_PID)..."
  kill -9 \$PORT_3000_PID 2>/dev/null || true
  sleep 1
  
  # Verify the port is free
  if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Warning: Failed to kill process on port 3000. Try manually with: kill -9 \$(lsof -ti:3000)"
  else
    echo "Successfully freed port 3000."
  fi
fi

# Check for React development server processes that might have been missed
REACT_PIDS=\$(ps aux | grep "react-scripts/scripts/start" | grep -v grep | awk '{print \$2}')
if [ ! -z "\$REACT_PIDS" ]; then
  echo "Killing React development server processes..."
  for pid in \$REACT_PIDS; do
    echo "Killing React process with PID: \$pid"
    kill -9 \$pid 2>/dev/null || true
  done
fi

echo "All services stopped."
EOF
    
    chmod +x "$STOP_SCRIPT"
    echo "✓ Stop script created: $STOP_SCRIPT"
  else
    echo -e "${YELLOW}In dry-run mode - would create stop script${NC}"
  fi
}

# Function to create necessary directories
function create_directories() {
  echo "Creating necessary directories..."
  
  if [ "$DRY_RUN" = false ]; then
    # Create logs directory
    mkdir -p "$LOG_DIR"
    echo "✓ Created logs directory: $LOG_DIR"
    
    # Create other required directories
    mkdir -p "$SCRIPT_DIR/client"
    mkdir -p "$SCRIPT_DIR/api"
    mkdir -p "$SCRIPT_DIR/storage"
    mkdir -p "$SCRIPT_DIR/artifacts/contracts"
    
    # Sample content directory
    SAMPLE_CONTENT_DIR="$SCRIPT_DIR/sample_content"
    mkdir -p "$SAMPLE_CONTENT_DIR"
    
    echo "✓ All required directories created"
  else
    echo -e "${YELLOW}In dry-run mode - would create necessary directories${NC}"
  fi
}

# Start API server
function start_api() {
  section "Starting API Server"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would start API server on port $PORT_API"
    return 0
  fi
  
  echo "Starting API server on port $PORT_API..."
  
  # Check if API server is already running
  if pgrep -f "node api/server.js" > /dev/null; then
    echo "⚠️ API server is already running"
    return 0
  fi
  
  # Install API dependencies if needed
  cd "$SCRIPT_DIR/api"
  echo "Installing API dependencies..."
  npm install > /dev/null 2>&1
  
  # Run in background
  echo "Starting API server..."
  npm run dev > "$API_LOG" 2>&1 &
  
  API_PID=$!
  echo $API_PID > /tmp/wylloh-api.pid
  
  # Wait for API to start
  sleep 3
  
  # Check if API is running
  if ps -p $API_PID > /dev/null; then
    echo "✅ API server started successfully (PID: $API_PID)"
    return 0
  else
    echo "❌ Failed to start API server"
    return 1
  fi
}

# Start client
function start_client() {
  section "Starting Client Application"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would start client on port $PORT_CLIENT"
    return 0
  fi
  
  echo "Starting client on port $PORT_CLIENT..."
  
  # Check if client is already running
  if pgrep -f "npm run start" > /dev/null; then
    echo "⚠️ Client is already running"
    return 0
  fi
  
  # Check if port 3000 is in use by another process
  PORT_3000_PID=$(lsof -ti:3000 2>/dev/null)
  if [ ! -z "$PORT_3000_PID" ]; then
    echo "⚠️ Port 3000 is already in use by process $PORT_3000_PID. Attempting to terminate..."
    kill $PORT_3000_PID 2>/dev/null || true
    sleep 2
    
    # Check again after kill attempt
    if lsof -ti:3000 > /dev/null; then
      echo "❌ Failed to free port 3000. Please manually stop the process and try again."
      return 1
    else
      echo "✅ Successfully freed port 3000"
    fi
  fi
  
  # Install client dependencies if needed
  cd "$SCRIPT_DIR/client"
  echo "Installing client dependencies..."
  npm install > /dev/null 2>&1
  
  # Run in background
  echo "Starting client application..."
  npm run start > "$CLIENT_LOG" 2>&1 &
  
  CLIENT_PID=$!
  echo $CLIENT_PID > /tmp/wylloh-client.pid
  
  # Wait for client to start
  sleep 5
  
  # Check if client is running
  if ps -p $CLIENT_PID > /dev/null; then
    echo "✅ Client started successfully (PID: $CLIENT_PID)"
    echo "🌐 Client available at: http://localhost:$PORT_CLIENT"
    return 0
  else
    # Check if there was a port conflict in the log
    if grep -q "Something is already running on port 3000" "$CLIENT_LOG"; then
      echo "❌ Failed to start client due to port conflict. Check logs for details."
      return 1
    else
      echo "❌ Failed to start client. Check logs for details."
      return 1
    fi
  fi
}

# Main execution flow
function main() {
  start_time=$(date +%s)
  
  # Create directories
  create_directories
  
  # Stop running services
  stop_services
  
  # Start Ganache
  if [[ "$SKIP_CONTRACTS" != "true" ]]; then
    start_ganache || exit 1
  fi
  
  # Start IPFS
  if [[ "$SKIP_IPFS" != "true" ]]; then
    start_ipfs || exit 1
  fi
  
  # Deploy contracts
  if [[ "$SKIP_CONTRACTS" != "true" ]]; then
    deploy_contracts || exit 1
    verify_contracts || exit 1
  fi
  
  # Load sample content
  if [[ "$SKIP_LOAD" != "true" ]]; then
    load_sample_content || exit 1
  fi
  
  # Update configurations
  update_configuration
  
  # Start API server
  if [[ "$SKIP_API" != "true" ]]; then
    start_api || exit 1
  fi
  
  # Start client
  if [[ "$SKIP_CLIENT" != "true" ]]; then
    start_client || exit 1
  fi
  
  # Set up Seed One
  if [[ "$SKIP_PLAYER" != "true" ]]; then
    setup_seed_one || exit 1
  fi
  
  # Create stop script
  create_stop_script
  
  # Print summary
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  section "Demo Environment Setup Complete"
  echo "✅ Setup completed in $duration seconds"
  echo "📱 Demo environment is ready!"
  echo ""
  echo "🌐 Access the client at: http://localhost:$PORT_CLIENT"
  echo "🚀 API server running at: http://localhost:$PORT_API"
  echo "💰 Local blockchain at: http://localhost:$PORT_GANACHE"
  echo "📦 IPFS gateway at: http://localhost:$PORT_IPFS_GATEWAY"
  echo ""
  echo "📋 To stop the demo environment, run: ./stop-demo.sh"
}

# Main execution
main