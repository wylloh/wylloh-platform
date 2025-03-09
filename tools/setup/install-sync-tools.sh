#!/bin/bash
# Wylloh Configuration Sync Tools Installation Script
# This script installs the configuration synchronization tools on the Seed One device

set -e

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Configuration
SCRIPTS_DIR="/home/seed/scripts"
SYSTEMD_SERVICE="/etc/systemd/system/wylloh.service"

# Create scripts directory
mkdir -p "$SCRIPTS_DIR"
chown seed:seed "$SCRIPTS_DIR"

# Install sync script
cat > "$SCRIPTS_DIR/sync-config.js" << 'EOL'
#!/usr/bin/env node

/**
 * Configuration Synchronization Script for Wylloh
 * 
 * This script synchronizes the main Wylloh configuration (/etc/wylloh/config.json)
 * with the Kodi addon settings, ensuring that both use consistent URLs and settings.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Paths
const WYLLOH_CONFIG_PATH = '/etc/wylloh/config.json';
const KODI_USER_HOME = os.homedir();
const KODI_ADDON_SETTINGS_PATH = path.join(KODI_USER_HOME, '.kodi/userdata/addon_data/plugin.video.wylloh/settings.xml');

// Log function
function log(message) {
  console.log(`[Wylloh Config Sync] ${message}`);
}

// Function to read the main Wylloh configuration
function readWyllohConfig() {
  try {
    const configData = fs.readFileSync(WYLLOH_CONFIG_PATH, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    log(`Error reading Wylloh config: ${error.message}`);
    return null;
  }
}

// Function to read the Kodi addon settings
function readKodiSettings() {
  try {
    if (!fs.existsSync(KODI_ADDON_SETTINGS_PATH)) {
      log('Kodi addon settings file does not exist yet. It will be created when needed.');
      return null;
    }
    
    const settingsData = fs.readFileSync(KODI_ADDON_SETTINGS_PATH, 'utf8');
    return settingsData;
  } catch (error) {
    log(`Error reading Kodi settings: ${error.message}`);
    return null;
  }
}

// Function to update the Kodi addon settings
function updateKodiSettings(config) {
  try {
    // Read existing settings or use a template if it doesn't exist
    let settingsXml = readKodiSettings();
    
    if (!settingsXml) {
      // Create a basic template if the file doesn't exist
      settingsXml = `<settings version="2">
    <setting id="auto_connect">true</setting>
    <setting id="preferred_quality">1</setting>
    <setting id="buffer_size">1</setting>
    <setting id="clear_cache" default="true" />
    <setting id="api_url" default="true">https://api.wylloh.com/api/v1/</setting>
    <setting id="gateway_url" default="true">https://gateway.wylloh.com/ipfs/</setting>
    <setting id="api_token" default="true" />
    <setting id="wallet_api_url" default="true">http://localhost:3333/api/</setting>
    <setting id="wallet_api_key" default="true">local-seed-one-key</setting>
    <setting id="enable_subtitles">true</setting>
    <setting id="auto_resume">true</setting>
    <setting id="verification_interval">5</setting>
    <setting id="enable_watermark">true</setting>
    <setting id="watermark_position">2</setting>
    <setting id="watermark_opacity">30</setting>
    <setting id="debug_logging" default="true">false</setting>
    <setting id="cache_ttl">24</setting>
    <setting id="expert_mode" default="true">false</setting>
    <setting id="custom_parameters" default="true" />
</settings>`;
    }

    // Extract API URL and IPFS Gateway from the main config
    const apiUrl = `${config.apiUrl.replace(/\/$/, '')}/`;
    const ipfsGateway = `${config.ipfsGateway.replace(/\/$/, '')}/ipfs/`;
    
    // Update the XML settings
    settingsXml = settingsXml
      .replace(/<setting id="api_url"[^>]*>.*?<\/setting>/g, 
               `<setting id="api_url" default="true">${apiUrl}</setting>`)
      .replace(/<setting id="gateway_url"[^>]*>.*?<\/setting>/g, 
               `<setting id="gateway_url" default="true">${ipfsGateway}</setting>`)
      .replace(/<setting id="auto_connect"[^>]*>.*?<\/setting>/g, 
               `<setting id="auto_connect">${config.autoConnectWallet}</setting>`);
    
    // Ensure the directory exists
    const dirname = path.dirname(KODI_ADDON_SETTINGS_PATH);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    
    // Write the updated settings
    fs.writeFileSync(KODI_ADDON_SETTINGS_PATH, settingsXml);
    log(`Kodi addon settings updated with API URL: ${apiUrl} and IPFS Gateway: ${ipfsGateway}`);
    
    // Restart Kodi if it's running
    try {
      execSync('pidof kodi.bin && killall kodi.bin || true');
      log('Kodi restart triggered');
    } catch (error) {
      log('Kodi is not running, no need to restart');
    }
    
    return true;
  } catch (error) {
    log(`Error updating Kodi settings: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  log('Starting configuration synchronization');
  
  // Read the main Wylloh configuration
  const config = readWyllohConfig();
  if (!config) {
    log('Cannot proceed without valid Wylloh configuration');
    process.exit(1);
  }
  
  // Update the Kodi addon settings
  const success = updateKodiSettings(config);
  
  if (success) {
    log('Configuration synchronization completed successfully');
  } else {
    log('Configuration synchronization had errors');
    process.exit(1);
  }
}

// Run the main function
main();
EOL

# Install service wrapper script
cat > "$SCRIPTS_DIR/wylloh-service-wrapper.sh" << 'EOL'
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
EOL

# Set permissions
chmod +x "$SCRIPTS_DIR/sync-config.js"
chmod +x "$SCRIPTS_DIR/wylloh-service-wrapper.sh"
chown seed:seed "$SCRIPTS_DIR/sync-config.js"
chown seed:seed "$SCRIPTS_DIR/wylloh-service-wrapper.sh"

# Back up and modify systemd service
if [ -f "$SYSTEMD_SERVICE" ]; then
  cp "$SYSTEMD_SERVICE" "${SYSTEMD_SERVICE}.bak"
  sed -i 's|ExecStart=/usr/bin/node /opt/wylloh/src/index.js|ExecStart=/home/seed/scripts/wylloh-service-wrapper.sh|' "$SYSTEMD_SERVICE"
  systemctl daemon-reload
  echo "Systemd service updated to use wrapper script"
else
  echo "Warning: Wylloh service file not found at $SYSTEMD_SERVICE"
fi

echo "Configuration synchronization tools installed successfully" 