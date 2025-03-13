#!/bin/bash

# Wylloh Player Build Environment Setup Script
# This script installs all dependencies and makes necessary modifications
# to build the Wylloh Player successfully.

set -e  # Exit on error

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}Wylloh Player Build Environment Setup${NC}"
echo "========================================"

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run this script with sudo or as root${NC}"
  exit 1
fi

# Function to install a package if not already installed
install_pkg() {
  if ! dpkg -l "$1" | grep -q "^ii"; then
    echo -e "Installing ${BOLD}$1${NC}..."
    apt-get install -y "$1"
    echo -e "${GREEN}✓ Installed $1${NC}"
  else
    echo -e "${GREEN}✓ $1 already installed${NC}"
  fi
}

# 1. Update package lists
echo -e "\n${BOLD}Updating package lists...${NC}"
apt-get update

# 2. Install required dependencies
echo -e "\n${BOLD}Installing build dependencies...${NC}"

# Core build tools
install_pkg build-essential
install_pkg cmake
install_pkg git

# Media libraries
install_pkg libass-dev
install_pkg libtag1-dev
install_pkg libtinyxml-dev
install_pkg libtinyxml2-dev
install_pkg libspdlog-dev
install_pkg libfstrcmp-dev
install_pkg libcdio-dev

# Graphics and display libraries
install_pkg libdrm-dev
install_pkg libgbm-dev
install_pkg libxrandr-dev
install_pkg libxkbcommon-dev
install_pkg libinput-dev
install_pkg wayland-protocols
install_pkg libwayland-dev

# Tools and runtime
install_pkg swig
install_pkg default-jre
install_pkg libgtest-dev

# 3. Create required directories and files
echo -e "\n${BOLD}Setting up project files...${NC}"

# Define project root (adjust if needed)
PROJECT_ROOT="$PWD/wylloh-player"

echo "Checking for missing directories and files..."

# Create wallet directory
if [ ! -d "$PROJECT_ROOT/xbmc/wylloh/wallet" ]; then
  echo "Creating wallet directory..."
  mkdir -p "$PROJECT_ROOT/xbmc/wylloh/wallet"
  
  # Create minimal CMakeLists.txt for wallet
  echo "Creating wallet CMakeLists.txt..."
  cat > "$PROJECT_ROOT/xbmc/wylloh/wallet/CMakeLists.txt" << 'CMAKEFILE'
set(SOURCES)
set(HEADERS)
core_add_library(wylloh_wallet)
CMAKEFILE
fi

# Create AddonBindings.cmake
if [ ! -f "$PROJECT_ROOT/xbmc/addons/AddonBindings.cmake" ]; then
  echo "Creating AddonBindings.cmake..."
  mkdir -p "$PROJECT_ROOT/xbmc/addons"
  echo '# Empty AddonBindings.cmake file' > "$PROJECT_ROOT/xbmc/addons/AddonBindings.cmake"
fi

# 4. Apply code modifications
echo -e "\n${BOLD}Applying code modifications...${NC}"

# Fix target name in CMakeLists.txt
echo "Fixing target name in CMakeLists.txt..."
sed -i 's/add_custom_target(wylloh-player-libraries)/add_custom_target(wyllohplayer-libraries)/' "$PROJECT_ROOT/CMakeLists.txt"

# Disable file COPY that requires root permissions
echo "Disabling problematic file COPY in CMakeLists.txt..."
sed -i '658s|file(COPY.*|# Disabled file copy that requires root permissions|' "$PROJECT_ROOT/CMakeLists.txt"

# Fix application name in version.txt
echo "Fixing application name in version.txt..."
if grep -q "APP_NAME: Wylloh Player" "$PROJECT_ROOT/version.txt"; then
  sed -i 's/APP_NAME: Wylloh Player/APP_NAME: WyllohPlayer/' "$PROJECT_ROOT/version.txt" 
fi

# 5. Create build instructions
echo -e "\n${BOLD}Creating build instructions...${NC}"

cat > "$PROJECT_ROOT/BUILD.md" << 'BUILDMD'
# Wylloh Player Build Instructions

## Prerequisites

The setup script (`setup-build-environment.sh`) should have installed all necessary dependencies.

## Building the Wylloh Player

1. Create a build directory:
   ```
   cd wylloh-player
   mkdir -p build
   cd build
   ```

2. Configure the build:
   ```
   cmake -DAPP_RENDER_SYSTEM=gles -DENABLE_INTERNAL_FLATBUFFERS=ON -DENABLE_INTERNAL_FFMPEG=ON -DCORE_PLATFORM_NAME=x11 -DENABLE_TESTING=OFF ..
   ```

3. Build the player:
   ```
   make -j$(nproc)  # Uses all available CPU cores
   ```

## Running the Wylloh Player

After building, you can run the player:
```
./wyllohplayer
```

## Troubleshooting

If you encounter build issues, check the following:
- Ensure all dependencies are installed (run the setup script again)
- Clear the build directory and restart the build process
- Check CMake error messages for specific missing dependencies
BUILDMD

echo -e "\n${GREEN}${BOLD}Setup complete!${NC}"
echo -e "You can now build the Wylloh Player by following the instructions in ${BOLD}$PROJECT_ROOT/BUILD.md${NC}"
echo -e "Basic build commands:\n"
echo -e "  cd $PROJECT_ROOT"
echo -e "  mkdir -p build && cd build"
echo -e "  cmake -DAPP_RENDER_SYSTEM=gles -DENABLE_INTERNAL_FLATBUFFERS=ON -DENABLE_INTERNAL_FFMPEG=ON -DCORE_PLATFORM_NAME=x11 -DENABLE_TESTING=OFF .."
echo -e "  make -j$(nproc)"
echo -e "\nHappy building!" 