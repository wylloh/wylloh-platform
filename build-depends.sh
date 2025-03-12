#!/bin/bash
# Script to build Wylloh Player dependencies using Kodi depends system

set -e  # Exit on error

# Configuration
BUILD_DIR="$HOME/wylloh-platform/wylloh-player"
DEPENDS_DIR="$BUILD_DIR/tools/depends"
PLATFORM="linux"  # Platform is Linux
TARGET_PLATFORM="gbm"  # Target platform is GBM for Raspberry Pi
DEPENDS_BUILD_DIR="$HOME/wylloh-depends-build"
CORES=$(nproc)  # Use all available cores

echo "=== Building Wylloh Player dependencies for $PLATFORM/$TARGET_PLATFORM ==="
echo "This may take a significant amount of time..."

# Create build directory
mkdir -p "$DEPENDS_BUILD_DIR"
cd "$DEPENDS_DIR"

# Run bootstrap if configure doesn't exist
if [ ! -f "./configure" ]; then
    echo "Running bootstrap to generate configure script..."
    ./bootstrap
fi

cd "$DEPENDS_BUILD_DIR"

# Configure depends build for Raspberry Pi 4
"$DEPENDS_DIR/configure" \
  --prefix="$DEPENDS_BUILD_DIR" \
  --with-toolchain=/usr \
  --with-platform=linux \
  --with-rendersystem=gles \
  --disable-debug

# Build essential dependencies
cd "$DEPENDS_DIR"
make -j$CORES ffmpeg prefix="$DEPENDS_BUILD_DIR"

echo "=== Dependencies built successfully! ==="
echo "You can now build Wylloh Player using the generated toolchain file."
echo "Toolchain file: $DEPENDS_BUILD_DIR/toolchain.cmake" 