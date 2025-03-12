#!/bin/bash
# Script to build Wylloh Player using the pre-built dependencies

set -e  # Exit on error

# Configuration
BUILD_DIR="$HOME/wylloh-platform/wylloh-player"
CMAKE_BUILD_TYPE="Release"
DEPENDS_BUILD_DIR="$HOME/wylloh-depends-build"
BUILD_OUTPUT_DIR="$HOME/wylloh-player-build"
CORES=$(nproc)  # Use all available cores

echo "=== Building Wylloh Player using pre-built dependencies ==="

# Create build directory
mkdir -p "$BUILD_OUTPUT_DIR"
cd "$BUILD_OUTPUT_DIR"

# Configure with CMake using toolchain file from depends
cmake -DCMAKE_BUILD_TYPE=$CMAKE_BUILD_TYPE \
      -DCMAKE_TOOLCHAIN_FILE="$DEPENDS_BUILD_DIR/toolchain.cmake" \
      -DPLATFORM="linux" \
      -DCORE_PLATFORM_NAME="gbm" \
      -DAPP_RENDER_SYSTEM="gles" \
      -DWYLLOH_IPFS_SUPPORT=ON \
      -DWYLLOH_WALLET_SUPPORT=ON \
      "$BUILD_DIR"

# Build
cmake --build . -- -j$CORES

echo "=== Build completed successfully! ==="
echo "Wylloh Player has been built at: $BUILD_OUTPUT_DIR/wylloh-player" 