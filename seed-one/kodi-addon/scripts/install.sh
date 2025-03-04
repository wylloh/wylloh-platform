#!/bin/bash
# Installation script for the Wylloh Kodi addon
# Installs the addon directly to Kodi's addon directory

# Set variables
ADDON_ID="plugin.video.wylloh"
ADDON_DIR="../${ADDON_ID}"

# Function to display messages
function echo_info() {
    echo -e "\e[1;34m[INFO]\e[0m $1"
}

function echo_success() {
    echo -e "\e[1;32m[SUCCESS]\e[0m $1"
}

function echo_error() {
    echo -e "\e[1;31m[ERROR]\e[0m $1"
}

function echo_warning() {
    echo -e "\e[1;33m[WARNING]\e[0m $1"
}

echo_info "Wylloh Kodi Addon Installation Script"

# Detect operating system and set Kodi addon path
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    KODI_ADDON_DIR="$HOME/.kodi/addons"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    KODI_ADDON_DIR="$HOME/Library/Application Support/Kodi/addons"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    KODI_ADDON_DIR="$APPDATA/Kodi/addons"
else
    echo_error "Unsupported operating system: $OSTYPE"
    echo_info "Please manually install the addon by copying the plugin.video.wylloh folder to your Kodi addons directory."
    exit 1
fi

# Check if Kodi addon directory exists
if [ ! -d "$KODI_ADDON_DIR" ]; then
    echo_error "Kodi addon directory not found: $KODI_ADDON_DIR"
    echo_info "Is Kodi installed? If it's installed in a non-standard location, please install the addon manually."
    exit 1
fi

echo_info "Installing to Kodi addon directory: $KODI_ADDON_DIR"

# Check if addon directory exists
if [ ! -d "$ADDON_DIR" ]; then
    echo_error "Addon directory not found: $ADDON_DIR"
    exit 1
fi

# Remove existing addon if it exists
if [ -d "$KODI_ADDON_DIR/$ADDON_ID" ]; then
    echo_warning "Removing existing addon installation"
    rm -rf "$KODI_ADDON_DIR/$ADDON_ID"
fi

# Copy addon to Kodi addon directory
echo_info "Copying addon files..."
cp -r "$ADDON_DIR" "$KODI_ADDON_DIR/"

# Check if installation was successful
if [ $? -eq 0 ] && [ -d "$KODI_ADDON_DIR/$ADDON_ID" ]; then
    echo_success "Addon installed successfully to: $KODI_ADDON_DIR/$ADDON_ID"
    echo_info "Please restart Kodi for the changes to take effect."
else
    echo_error "Failed to install addon"
    exit 1
fi