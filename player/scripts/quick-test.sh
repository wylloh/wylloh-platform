#!/bin/bash

# quick-test.sh
# Script to quickly test the Wylloh Player with minimal setup

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}Wylloh Player Quick Test${NC}"
echo "========================\n"

# Ensure we're in the player directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLAYER_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PLAYER_DIR" || { echo -e "${RED}Failed to locate player directory${NC}"; exit 1; }

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required dependencies
echo -e "${BOLD}Checking dependencies...${NC}"
if ! command_exists yarn; then
  echo -e "${RED}Error: yarn is not installed. Please install yarn first.${NC}"
  exit 1
fi

if ! command_exists node; then
  echo -e "${RED}Error: node is not installed. Please install Node.js first.${NC}"
  exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d '.' -f 1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${YELLOW}Warning: Node.js version $NODE_VERSION detected. Wylloh Player works best with Node.js 18+${NC}"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo -e "\n${BOLD}Installing dependencies...${NC}"
  yarn install || { echo -e "${RED}Failed to install dependencies${NC}"; exit 1; }
fi

# Determine test mode
TEST_MODE="web"
if [ "$1" == "--seedone" ] || [ "$1" == "-s" ]; then
  TEST_MODE="seedone"
fi

# Start the player in the appropriate mode
echo -e "\n${BOLD}Starting Wylloh Player in ${TEST_MODE} mode...${NC}"
echo -e "${BLUE}The player will be available at http://localhost:3001${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the player when done testing${NC}\n"

if [ "$TEST_MODE" == "seedone" ]; then
  yarn start:seedone
else
  yarn start:web
fi

# This point is reached only if the player is stopped
echo -e "\n${GREEN}${BOLD}Testing completed!${NC}"
echo -e "For more testing options, see the ${BOLD}TESTING.md${NC} and ${BOLD}INTEGRATION-README.md${NC} files."
exit 0 