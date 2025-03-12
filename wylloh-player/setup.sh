#!/bin/bash

# Wylloh Player Setup Script for Seed One
# This script automates the installation and configuration of Wylloh Player on a Seed One device

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}Wylloh Player Setup for Seed One${NC}"
echo "================================\n"

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo).${NC}"
  exit 1
fi

# Get actual username (not root)
if [ -n "$SUDO_USER" ]; then
  ACTUAL_USER=$SUDO_USER
else
  ACTUAL_USER=$(whoami)
fi

# Get local machine IP for demo environment
read -p "Enter your demo machine's IP address: " LOCAL_IP

# Verify IP format
if [[ ! $LOCAL_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Invalid IP address format. Please use format: 192.168.1.100${NC}"
  exit 1
fi

# Default ports and addresses (can be modified by user)
GANACHE_PORT=8545
IPFS_GATEWAY_PORT=8080
CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
TOKEN_FACTORY_ADDRESS="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

# Ask if user wants to customize ports and addresses
read -p "Do you want to customize ports and contract addresses? (y/n): " CUSTOMIZE

if [[ $CUSTOMIZE == "y" || $CUSTOMIZE == "Y" ]]; then
  read -p "Enter Ganache port [default: 8545]: " CUSTOM_GANACHE_PORT
  GANACHE_PORT=${CUSTOM_GANACHE_PORT:-$GANACHE_PORT}
  
  read -p "Enter IPFS Gateway port [default: 8080]: " CUSTOM_IPFS_PORT
  IPFS_GATEWAY_PORT=${CUSTOM_IPFS_PORT:-$IPFS_GATEWAY_PORT}
  
  read -p "Enter Contract Address [default: 0x5FbDB2315678afecb367f032d93F642f64180aa3]: " CUSTOM_CONTRACT
  CONTRACT_ADDRESS=${CUSTOM_CONTRACT:-$CONTRACT_ADDRESS}
  
  read -p "Enter Token Factory Address [default: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512]: " CUSTOM_TOKEN
  TOKEN_FACTORY_ADDRESS=${CUSTOM_TOKEN:-$TOKEN_FACTORY_ADDRESS}
fi

echo -e "\n${BOLD}1. Updating system packages${NC}"
apt update && apt upgrade -y

echo -e "\n${BOLD}2. Installing dependencies${NC}"
echo "Installing required packages for Wylloh Player on Seed One (Raspberry Pi OS)..."
apt install -y git cmake build-essential autoconf libtool pkg-config
apt install -y libssl-dev zlib1g-dev libyajl-dev libxml2-dev libxslt1-dev python3-dev
apt install -y libcurl4-openssl-dev libsqlite3-dev libmicrohttpd-dev
apt install -y rapidjson-dev libfmt-dev
apt install -y libegl1-mesa-dev libgles2-mesa-dev libgl1-mesa-dev
apt install -y libudev-dev libpulse-dev libavahi-client-dev

echo -e "\n${BOLD}3. Creating directory structure${NC}"
mkdir -p /etc/wylloh
mkdir -p /var/lib/wylloh/media
mkdir -p /var/lib/wylloh/metadata
mkdir -p /home/$ACTUAL_USER/.config/wylloh-player

echo -e "\n${BOLD}4. Cloning Wylloh Player repository${NC}"
cd /home/$ACTUAL_USER
if [ -d "wylloh-player" ]; then
  echo "Wylloh Player directory already exists, updating..."
  cd wylloh-player
  git pull
else
  echo "Cloning Wylloh Player repository..."
  sudo -u $ACTUAL_USER git clone https://github.com/wy1bur/wylloh-player.git
  cd wylloh-player
fi

echo -e "\n${BOLD}5. Creating Wylloh Player configuration${NC}"
# Create config directory if it doesn't exist
mkdir -p /etc/wylloh

# Create Wylloh configuration file
cat > /etc/wylloh/config.json << EOF
{
  "providerUrl": "http://$LOCAL_IP:$GANACHE_PORT",
  "ipfsGateway": "http://$LOCAL_IP:$IPFS_GATEWAY_PORT/ipfs/",
  "contractAddress": "$CONTRACT_ADDRESS",
  "tokenFactoryAddress": "$TOKEN_FACTORY_ADDRESS",
  "demoMode": true,
  "logLevel": "info",
  "mediaPath": "/var/lib/wylloh/media",
  "metadataPath": "/var/lib/wylloh/metadata"
}
EOF

chown $ACTUAL_USER:$ACTUAL_USER /etc/wylloh/config.json

echo -e "\n${BOLD}6. Setting up build environment${NC}"
# Set ownership
chown -R $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/wylloh-player

# Create build directory and prepare for compilation
cd /home/$ACTUAL_USER/wylloh-player
sudo -u $ACTUAL_USER mkdir -p build
cd build

echo -e "\n${BOLD}7. Configuring Wylloh Player${NC}"
sudo -u $ACTUAL_USER cmake -DCMAKE_BUILD_TYPE=Release -DENABLE_TESTING=OFF ..

echo -e "\n${BOLD}8. Compiling Wylloh Player${NC}"
echo "This may take some time on the Seed One..."
sudo -u $ACTUAL_USER make -j$(nproc)

echo -e "\n${BOLD}9. Creating desktop shortcut${NC}"
# Create desktop entry
cat > /home/$ACTUAL_USER/.local/share/applications/wylloh-player.desktop << EOF
[Desktop Entry]
Type=Application
Name=Wylloh Player
Comment=Wylloh Media Player
Exec=/home/$ACTUAL_USER/wylloh-player/build/wylloh-player
Icon=/home/$ACTUAL_USER/wylloh-player/media/icon256x256.png
Terminal=false
Categories=AudioVideo;Video;Player;TV;
EOF

chown $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/.local/share/applications/wylloh-player.desktop

echo -e "\n${BOLD}10. Setting up autostart${NC}"
# Create autostart directory if it doesn't exist
sudo -u $ACTUAL_USER mkdir -p /home/$ACTUAL_USER/.config/autostart

# Create autostart entry
cat > /home/$ACTUAL_USER/.config/autostart/wylloh-player.desktop << EOF
[Desktop Entry]
Type=Application
Name=Wylloh Player
Comment=Wylloh Media Player
Exec=/home/$ACTUAL_USER/wylloh-player/build/wylloh-player
Icon=/home/$ACTUAL_USER/wylloh-player/media/icon256x256.png
Terminal=false
Categories=AudioVideo;Video;Player;TV;
EOF

chown $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/.config/autostart/wylloh-player.desktop

echo -e "\n${GREEN}${BOLD}Wylloh Player setup complete!${NC}"
echo -e "Wylloh Player has been built and configured to connect to your demo environment at ${YELLOW}$LOCAL_IP${NC}"
echo -e "\nTo start Wylloh Player manually, run:"
echo -e "cd /home/$ACTUAL_USER/wylloh-player/build && ./wylloh-player"
echo -e "\nLaunch Wylloh Player to finish the setup:"
echo -e "  1. Navigate to Settings > Wylloh > General"
echo -e "  2. Enable 'Demo Mode'"
echo -e "  3. Verify that the following settings are correct:"
echo -e "     - IPFS Gateway URL: http://$LOCAL_IP:$IPFS_GATEWAY_PORT/ipfs/"
echo -e "     - Provider URL: http://$LOCAL_IP:$GANACHE_PORT"
echo -e "     - Contract Address: $CONTRACT_ADDRESS"
echo -e "\nRestart your Seed One to complete the setup process."

exit 0 