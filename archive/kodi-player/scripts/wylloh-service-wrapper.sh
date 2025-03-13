#!/bin/bash

# Wylloh Service Wrapper Script
# This script ensures configuration synchronization before starting the main service

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Run configuration synchronization script
log "Running configuration synchronization..."
/home/seed/scripts/sync-config.js
SYNC_RESULT=$?

if [ $SYNC_RESULT -ne 0 ]; then
  log "Warning: Configuration synchronization failed with code $SYNC_RESULT"
  # Continue anyway - we don't want to prevent the service from starting
fi

# Start the main Wylloh service
log "Starting Wylloh service..."
exec /usr/bin/node /opt/wylloh/src/index.js 