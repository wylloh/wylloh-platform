#!/bin/bash
# Simplified build script for Wylloh Player using internal libraries
# Designed for Seed One (Raspberry Pi 4)

set -e  # Exit on error

# Configuration
BUILD_DIR="$HOME/wylloh-platform/wylloh-player"
BUILD_OUTPUT_DIR="$HOME/wylloh-player-build"
LOG_FILE="$HOME/wylloh-player-build.log"
CORES=$(nproc)  # Use all available cores

echo "=== Wylloh Player Direct Build ==="
echo "Using system FFmpeg 6.0.1 and internal libraries for other dependencies"
echo "Build log: $LOG_FILE"
echo "$(date)"
echo ""

# Start with a clean log file
> "$LOG_FILE"

# Clean build directory if it exists
echo "=== Cleaning build directory ==="
rm -rf "$BUILD_OUTPUT_DIR"

# Create build directory
echo "=== Creating build directory ==="
mkdir -p "$BUILD_OUTPUT_DIR"
cd "$BUILD_OUTPUT_DIR"

# Configure with CMake
echo "=== Configuring Wylloh Player ==="
cmake -DCMAKE_BUILD_TYPE=Debug \
      -DENABLE_INTERNAL_FFMPEG=OFF \
      -DWITH_FFMPEG=/usr \
      -DENABLE_INTERNAL_UDFREAD=ON \
      -DENABLE_INTERNAL_CROSSGUID=ON \
      -DENABLE_INTERNAL_FLATBUFFERS=ON \
      -DENABLE_INTERNAL_FMT=ON \
      -DENABLE_INTERNAL_FSTRCMP=ON \
      -DENABLE_INTERNAL_RapidJSON=ON \
      -DENABLE_INTERNAL_SPDLOG=ON \
      -DENABLE_INTERNAL_TAGLIB=ON \
      -DENABLE_INTERNAL_GTEST=ON \
      -DENABLE_INTERNAL_KISSFFT=ON \
      -DCORE_PLATFORM_NAME=gbm \
      -DAPP_RENDER_SYSTEM=gles \
      "$BUILD_DIR" 2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "Error configuring Wylloh Player. See log for details." | tee -a "$LOG_FILE"
    exit 1
fi

# Build
echo "=== Building Wylloh Player ==="
make -j$CORES 2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "Error building Wylloh Player. See log for details." | tee -a "$LOG_FILE"
    exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "=== Build completed successfully! ===" | tee -a "$LOG_FILE"
echo "$(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Wylloh Player built at: $BUILD_OUTPUT_DIR/wylloh-player" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To run Wylloh Player:" | tee -a "$LOG_FILE"
echo "cd $BUILD_OUTPUT_DIR && ./wylloh-player" | tee -a "$LOG_FILE" 