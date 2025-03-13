#!/bin/bash
# Wylloh Chromium Kiosk Mode Configuration Script

# This script configures Chromium to run in kiosk mode for the Wylloh player

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for URL parameter
if [ -z "$1" ]; then
  echo -e "${RED}Error: URL parameter is required${NC}"
  echo "Usage: $0 <player_url>"
  exit 1
fi

PLAYER_URL="$1"
AUTOSTART_DIR="/home/pi/.config/autostart"
CHROMIUM_PREFS_DIR="/home/pi/.config/chromium/Default"

echo -e "${BOLD}Configuring Chromium for Kiosk Mode${NC}"
echo "========================================\n"

# Ensure directories exist
mkdir -p "$AUTOSTART_DIR"
mkdir -p "$CHROMIUM_PREFS_DIR"

# Create the desktop file for autostart
echo "Creating autostart entry..."
cat > "$AUTOSTART_DIR/wylloh-kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Wylloh Player
Comment=Wylloh Media Player in Kiosk Mode
Exec=/bin/bash -c "chromium-browser --kiosk --disable-features=TranslateUI --no-default-browser-check --no-first-run --disable-translate --disable-infobars --disable-suggestions-service --disable-save-password-bubble --disable-session-crashed-bubble --start-maximized --noerrdialogs --disable-pinch --overscroll-history-navigation=0 --disable-notifications --disable-popup-blocking --enable-features=OverlayScrollbar $PLAYER_URL"
Icon=/usr/share/pixmaps/chromium-browser.png
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

# Create entry to hide the cursor
echo "Creating unclutter autostart entry to hide cursor..."
cat > "$AUTOSTART_DIR/unclutter.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Unclutter
Comment=Hide the mouse cursor
Exec=unclutter -idle 0.5 -root
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

# Configure Chromium preferences for kiosk mode
echo "Configuring Chromium preferences..."
cat > "$CHROMIUM_PREFS_DIR/Preferences" << EOF
{
  "browser": {
    "check_default_browser": false,
    "show_home_button": false,
    "custom_chrome_frame": false
  },
  "bookmark_bar": {
    "show_on_all_tabs": false
  },
  "distribution": {
    "skip_first_run_ui": true,
    "show_welcome_page": false,
    "import_bookmarks": false,
    "import_history": false,
    "import_home_page": false,
    "import_search_engine": false,
    "suppress_first_run_bubble": true,
    "create_all_shortcuts": false,
    "do_not_create_desktop_shortcut": true,
    "do_not_create_quick_launch_shortcut": true,
    "do_not_launch_chrome": true,
    "do_not_register_for_update_launch": true,
    "make_chrome_default": false,
    "suppress_first_run_default_browser_prompt": true
  },
  "profile": {
    "password_manager_enabled": false
  },
  "translate": {
    "enabled": false
  }
}
EOF

# Configure Chromium command line flags
echo "Setting up Chromium command line flags..."
cat > "$CHROMIUM_PREFS_DIR/Local State" << EOF
{
  "browser": {
    "enabled_labs_experiments": [
      "overlay-scrollbars@1"
    ]
  }
}
EOF

# Set file permissions
echo "Setting file permissions..."
chown -R pi:pi "$AUTOSTART_DIR"
chown -R pi:pi "$CHROMIUM_PREFS_DIR"

echo -e "\n${GREEN}${BOLD}Chromium kiosk mode configured successfully!${NC}"
echo "The Wylloh Player will launch in kiosk mode to: $PLAYER_URL"
