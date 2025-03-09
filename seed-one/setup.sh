#!/bin/bash

# Wylloh Seed One Setup Script
# This script automates the installation of Wylloh on a Raspberry Pi

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}Wylloh Seed One Setup${NC}"
echo "========================\n"

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

# Get MacBook IP
read -p "Enter your MacBook's IP address: " MACBOOK_IP

# Verify IP format
if [[ ! $MACBOOK_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Invalid IP address format. Please use format: 192.168.1.100${NC}"
  exit 1
fi

echo -e "\n${BOLD}1. Updating system packages${NC}"
apt update
apt upgrade -y

echo -e "\n${BOLD}2. Installing dependencies${NC}"
# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  apt install -y nodejs
fi

# Install other dependencies
apt install -y git python3 python3-pip ffmpeg kodi kodi-peripheral-joystick

echo -e "\n${BOLD}3. Creating directory structure${NC}"
mkdir -p /opt/wylloh
mkdir -p /etc/wylloh
mkdir -p /var/lib/wylloh
mkdir -p /var/lib/wylloh/media
mkdir -p /var/lib/wylloh/metadata
mkdir -p /home/$ACTUAL_USER/scripts

echo -e "\n${BOLD}4. Copying Wylloh files${NC}"
# Copy files from the repository structure to the system
cp -r * /opt/wylloh/
chown -R $ACTUAL_USER:$ACTUAL_USER /opt/wylloh
chown -R $ACTUAL_USER:$ACTUAL_USER /var/lib/wylloh
chown -R $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/scripts

# Make tools executable
if [ -d "/opt/wylloh/tools" ]; then
  echo "Making tools executable..."
  find /opt/wylloh/tools -type f -name "*.sh" -exec chmod +x {} \;
fi

echo -e "\n${BOLD}5. Installing Wylloh dependencies${NC}"
cd /opt/wylloh
sudo -u $ACTUAL_USER npm install

echo -e "\n${BOLD}6. Installing Kodi addon${NC}"
# Create Kodi addons directory
sudo -u $ACTUAL_USER mkdir -p /home/$ACTUAL_USER/.kodi/addons

# Copy the Wylloh addon
cp -r /opt/wylloh/kodi-addon/plugin.video.wylloh /home/$ACTUAL_USER/.kodi/addons/
chown -R $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/.kodi/addons/plugin.video.wylloh

echo -e "\n${BOLD}7. Creating configuration file${NC}"
# Create config with the provided MacBook IP
cat config.json.template | sed "s/\${MACBOOK_IP}/$MACBOOK_IP/g" > /etc/wylloh/config.json
chown $ACTUAL_USER:$ACTUAL_USER /etc/wylloh/config.json

echo -e "\n${BOLD}8. Installing configuration sync tools${NC}"
# Install the configuration sync tools
if [ -f "/opt/wylloh/tools/setup/install-sync-tools.sh" ]; then
  echo "Installing configuration sync tools..."
  bash /opt/wylloh/tools/setup/install-sync-tools.sh
  
  # Update the actual user for scripts
  chown -R $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/scripts
else
  echo -e "${YELLOW}Warning: Configuration sync tools not found. Kodi settings may need manual configuration.${NC}"
  
  # Create a basic service file without the wrapper
  cat wylloh.service | sed "s/\${USER}/$ACTUAL_USER/g" > /etc/systemd/system/wylloh.service
fi

echo -e "\n${BOLD}9. Setting up Kodi autostart${NC}"
# Create autostart directory
sudo -u $ACTUAL_USER mkdir -p /home/$ACTUAL_USER/.config/autostart

# Copy kodi.desktop file
cp kodi.desktop /home/$ACTUAL_USER/.config/autostart/
chown $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/.config/autostart/kodi.desktop

echo -e "\n${BOLD}10. Starting services${NC}"
# Reload systemd and enable/start Wylloh service
systemctl daemon-reload
systemctl enable wylloh
systemctl start wylloh

echo -e "\n${GREEN}${BOLD}Wylloh Seed One setup complete!${NC}"
echo "To check status, run: systemctl status wylloh"
echo "To view logs, run: journalctl -u wylloh -f"
echo -e "\nYour Wylloh Seed One is now configured to connect to your MacBook at ${YELLOW}$MACBOOK_IP${NC}"
echo "Restart your Raspberry Pi to complete the setup process."

exit 0 