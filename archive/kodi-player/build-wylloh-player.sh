#!/bin/bash

# Build script for Wylloh Player
# This script automates the process of building the Wylloh Player application

# Exit on error
set -e

# Display help information
show_help() {
    echo "Wylloh Player Build Script"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean         Clean the build directory before building"
    echo "  --setup         Run the setup script first (requires sudo)"
    echo "  --threads N     Use N threads for building (default: number of CPU cores)"
    echo "  --prefix PATH   Install to PATH (default: /usr/local)"
    echo "  --help          Display this help message"
    echo ""
    echo "Example: $0 --clean --setup --threads 4"
}

# Parse command line arguments
CLEAN=0
SETUP=0
THREADS=$(nproc)
PREFIX="/usr/local"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --clean)
            CLEAN=1
            shift
            ;;
        --setup)
            SETUP=1
            shift
            ;;
        --threads)
            THREADS="$2"
            shift 2
            ;;
        --prefix)
            PREFIX="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Make sure we're in the wylloh-player directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run setup script if requested
if [ $SETUP -eq 1 ]; then
    echo "Running setup script..."
    if [ "$(id -u)" -ne 0 ]; then
        echo "Setup requires sudo access. Please enter your password if prompted."
        sudo ./setup-build-environment.sh
    else
        ./setup-build-environment.sh
    fi
fi

# Create and/or enter build directory
mkdir -p build
cd build

# Clean if requested
if [ $CLEAN -eq 1 ]; then
    echo "Cleaning build directory..."
    rm -rf *
fi

# Configure the build
echo "Configuring build..."
cmake \
  -DAPP_RENDER_SYSTEM=gles \
  -DENABLE_INTERNAL_FLATBUFFERS=ON \
  -DENABLE_INTERNAL_FFMPEG=ON \
  -DCORE_PLATFORM_NAME=x11 \
  -DENABLE_TESTING=OFF \
  -DENABLE_XSLT=OFF \
  -DENABLE_MICROHTTPD=OFF \
  -DCMAKE_INSTALL_PREFIX="$PREFIX" \
  ..

# Build
echo "Building with $THREADS threads..."
make -j"$THREADS"

# Done
echo ""
echo "Build complete!"
echo "You can run the player with: ./wyllohplayer"
echo "Or install it with: sudo make install"
echo "" 