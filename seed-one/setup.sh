#!/bin/bash
# Wylloh Seed One Setup Script
# Sets up the Seed One device to run the Wylloh web player in Chromium kiosk mode

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}Wylloh Seed One Setup${NC}"
echo "========================\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: This script must be run as root${NC}"
  echo "Please run with: sudo $0"
  exit 1
fi

# Get the Wylloh server IP address
read -p "Enter the IP address of your Wylloh server (e.g. your MacBook): " SERVER_IP
if [ -z "$SERVER_IP" ]; then
  echo -e "${RED}Error: Server IP address is required${NC}"
  exit 1
fi

# Configuration
KIOSK_URL="http://$SERVER_IP:3000/player"
CONFIG_DIR="/etc/wylloh"
AUTOSTART_DIR="/home/pi/.config/autostart"

echo -e "\n${BOLD}1. Installing dependencies${NC}"
apt update
apt install -y chromium-browser xdotool unclutter

echo -e "\n${BOLD}2. Creating configuration directories${NC}"
mkdir -p "$CONFIG_DIR"
mkdir -p "$AUTOSTART_DIR"

echo -e "\n${BOLD}3. Creating configuration file${NC}"
cat > "$CONFIG_DIR/config.json" << EOF
{
  "providerUrl": "http://$SERVER_IP:8545",
  "ipfsGateway": "http://$SERVER_IP:8080/ipfs/",
  "playerUrl": "$KIOSK_URL",
  "demoMode": true
}
EOF

echo -e "\n${BOLD}4. Setting up Chromium kiosk mode${NC}"
KIOSK_SCRIPT_DIR="$(dirname "$(readlink -f "$0")")/kiosk-setup"
KIOSK_SCRIPT="$KIOSK_SCRIPT_DIR/configure-kiosk.sh"

if [ -f "$KIOSK_SCRIPT" ]; then
  bash "$KIOSK_SCRIPT" "$KIOSK_URL"
else
  echo -e "${YELLOW}Warning: Kiosk configuration script not found at $KIOSK_SCRIPT${NC}"
  echo "Setting up basic autostart configuration..."
  
  # Create autostart entries
  cat > "$AUTOSTART_DIR/wylloh-kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Wylloh Player
Comment=Wylloh Media Player
Exec=chromium-browser --kiosk --no-default-browser-check --no-first-run --disable-translate --disable-infobars --disable-suggestions-service --disable-save-password-bubble --disable-session-crashed-bubble --start-maximized --noerrdialogs --disable-pinch --overscroll-history-navigation=0 $KIOSK_URL
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

  # Hide cursor and disable screen blanking
  cat > "$AUTOSTART_DIR/unclutter.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Unclutter
Comment=Hide the mouse cursor
Exec=unclutter -idle 0.5
Terminal=false
X-GNOME-Autostart-enabled=true
EOF
fi

echo -e "\n${BOLD}5. Disabling screen blanking${NC}"
# Disable screen blanking in X
cat > "/etc/xdg/lxsession/LXDE-pi/autostart" << EOF
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
EOF

echo -e "\n${GREEN}${BOLD}Wylloh Seed One setup complete!${NC}"
echo "The Wylloh Player will automatically start in kiosk mode on next boot."
echo -e "\nTo reboot now, run:${BOLD}"
echo "  sudo reboot"
echo -e "${NC}"



