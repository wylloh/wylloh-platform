#!/bin/bash
# Master script to build Wylloh Player on Seed One

set -e  # Exit on error

# Configuration
SCRIPTS_DIR="$HOME/wylloh-platform/wylloh-player/build-scripts"
LOG_FILE="$HOME/wylloh-player-build.log"

echo "=== Wylloh Player Build Process ==="
echo "This process will build Wylloh Player in two stages:"
echo "1. Build dependencies (including FFmpeg)"
echo "2. Build Wylloh Player using those dependencies"
echo ""
echo "Build log will be saved to: $LOG_FILE"
echo ""
echo "Starting build process..."
echo ""

# Start with a clean log file
> "$LOG_FILE"

echo "=== Stage 1: Building Dependencies ===" | tee -a "$LOG_FILE"
echo "$(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

"$SCRIPTS_DIR/build-depends.sh" 2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "Error building dependencies. See log for details." | tee -a "$LOG_FILE"
    exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "=== Stage 2: Building Wylloh Player ===" | tee -a "$LOG_FILE"
echo "$(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

"$SCRIPTS_DIR/build-with-depends.sh" 2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "Error building Wylloh Player. See log for details." | tee -a "$LOG_FILE"
    exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "=== Build Completed Successfully! ===" | tee -a "$LOG_FILE"
echo "$(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Wylloh Player has been built successfully." | tee -a "$LOG_FILE"
echo "You can find the executable at: $HOME/wylloh-player-build/wylloh-player" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To run Wylloh Player:" | tee -a "$LOG_FILE"
echo "cd $HOME/wylloh-player-build && ./wylloh-player" | tee -a "$LOG_FILE" 