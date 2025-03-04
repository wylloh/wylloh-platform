#!/bin/bash
# Package script for the Wylloh Kodi addon
# Creates a ZIP file that can be installed in Kodi

# Set variables
ADDON_ID="plugin.video.wylloh"
ADDON_VERSION=$(grep -oP '<addon id="plugin.video.wylloh" name="Wylloh" version="\K[^"]+' "../${ADDON_ID}/addon.xml")
OUTPUT_DIR="../dist"
ADDON_DIR="../${ADDON_ID}"

# Create output directory if it doesn't exist
mkdir -p ${OUTPUT_DIR}

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

echo_info "Building Wylloh Kodi addon version ${ADDON_VERSION}"

# Verify addon directory exists
if [ ! -d "${ADDON_DIR}" ]; then
    echo_error "Addon directory not found: ${ADDON_DIR}"
    exit 1
fi

# Verify addon.xml exists
if [ ! -f "${ADDON_DIR}/addon.xml" ]; then
    echo_error "addon.xml not found in: ${ADDON_DIR}"
    exit 1
fi

# Clean previous build
rm -f "${OUTPUT_DIR}/${ADDON_ID}-${ADDON_VERSION}.zip"
echo_info "Removed previous build"

# Create package
echo_info "Creating addon package..."
cd "${ADDON_DIR}"

# Create zip file (excluding unwanted files)
zip -r "${OUTPUT_DIR}/${ADDON_ID}-${ADDON_VERSION}.zip" . -x "*.git*" "*.pyc" "*.pyo" "*.pyd" "__pycache__/*" "*.idea*" "*.vscode*" "*.DS_Store" "*.swp"

# Verify the zip was created
if [ $? -eq 0 ] && [ -f "${OUTPUT_DIR}/${ADDON_ID}-${ADDON_VERSION}.zip" ]; then
    echo_success "Addon package created successfully: ${OUTPUT_DIR}/${ADDON_ID}-${ADDON_VERSION}.zip"
else
    echo_error "Failed to create addon package"
    exit 1
fi

# Calculate package size
SIZE=$(du -h "${OUTPUT_DIR}/${ADDON_ID}-${ADDON_VERSION}.zip" | cut -f1)
echo_info "Package size: ${SIZE}"

echo_success "Build completed."