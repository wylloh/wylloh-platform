#!/bin/bash

# Wylloh Seed One Configuration Fix Tool
# This script fixes common configuration issues with the Seed One

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}Wylloh Seed One Configuration Fix Tool${NC}"
echo "========================================"

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo).${NC}"
  exit 1
fi

# Display current configuration
echo -e "\n${BOLD}Current Configuration:${NC}"
if [ -f "/etc/wylloh/config.json" ]; then
  cat /etc/wylloh/config.json
else
  echo -e "${RED}Configuration file not found at /etc/wylloh/config.json${NC}"
  exit 1
fi

# Get MacBook IP
read -p "Enter your MacBook's IP address: " MACBOOK_IP

# Verify IP format
if [[ ! $MACBOOK_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Invalid IP address format. Please use format: 192.168.1.100${NC}"
  exit 1
fi

echo -e "\n${BOLD}Updating configuration...${NC}"

# Create updated config file
cat > /etc/wylloh/config.json << EOF
{
  "providerUrl": "http://${MACBOOK_IP}:8545",
  "ipfsGateway": "http://${MACBOOK_IP}:8080",
  "apiUrl": "http://${MACBOOK_IP}:4000/api/v1",
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "tokenFactoryAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "demoMode": true,
  "autoConnectWallet": true,
  "logLevel": "info",
  "mediaPath": "/var/lib/wylloh/media",
  "metadataPath": "/var/lib/wylloh/metadata",
  "kodiEnabled": true
}
EOF

echo -e "${GREEN}✓ Configuration updated${NC}"
echo -e "\n${BOLD}New Configuration:${NC}"
cat /etc/wylloh/config.json

# Restart the Wylloh service
echo -e "\n${BOLD}Restarting Wylloh service...${NC}"
systemctl restart wylloh

echo -e "${GREEN}✓ Wylloh service restarted${NC}"

echo -e "\n${GREEN}${BOLD}Configuration fix complete!${NC}"
echo -e "Your Seed One is now configured to connect to your MacBook at ${YELLOW}${MACBOOK_IP}${NC}"
echo -e "\nIf issues persist, you may need to restart the Raspberry Pi:"
echo -e "  sudo reboot"

exit 0 