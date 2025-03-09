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
    
    // Get MacBook IP from API URL
    const macbookIpMatch = config.apiUrl.match(/http:\/\/([^:]+):/);
    const macbookIp = macbookIpMatch ? macbookIpMatch[1] : null;
    
    // Update the XML settings
    settingsXml = settingsXml
      .replace(/<setting id="api_url"[^>]*>.*?<\/setting>/g, 
               `<setting id="api_url" default="true">${apiUrl}</setting>`)
      .replace(/<setting id="gateway_url"[^>]*>.*?<\/setting>/g, 
               `<setting id="gateway_url" default="true">${ipfsGateway}</setting>`)
      .replace(/<setting id="auto_connect"[^>]*>.*?<\/setting>/g, 
               `<setting id="auto_connect">${config.autoConnectWallet}</setting>`);
    
    // Update wallet API URL to use MacBook IP if available
    if (macbookIp) {
      settingsXml = settingsXml.replace(
        /<setting id="wallet_api_url"[^>]*>.*?<\/setting>/g,
        `<setting id="wallet_api_url" default="true">http://${macbookIp}:3333/api/</setting>`
      );
    }
    
    // Ensure the directory exists
    const dirname = path.dirname(KODI_ADDON_SETTINGS_PATH);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    
    // Write the updated settings
    fs.writeFileSync(KODI_ADDON_SETTINGS_PATH, settingsXml);
    log(`Kodi addon settings updated with API URL: ${apiUrl} and IPFS Gateway: ${ipfsGateway}`);
    log(`Auto-connect wallet set to ${config.autoConnectWallet}`);
    
    // Install patched files for better error handling
    installPatchedFiles();
    
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

// Function to install patched files for Kodi addon
function installPatchedFiles() {
  try {
    // Install patched service.py
    const kodiServicePath = path.join(KODI_USER_HOME, '.kodi/addons/plugin.video.wylloh/service.py');
    if (fs.existsSync(kodiServicePath)) {
      log('Installing patched service.py for better error handling');
      
      // Create patched service.py file
      const patchedServiceContent = `#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Background service for the Wylloh Kodi addon.
Handles wallet connection, cache management, and periodic license verification.
"""

import time
import threading
import xbmc
import xbmcaddon
from resources.lib.utils import log, notify, get_setting
from resources.lib.cache import Cache
from resources.lib.wallet import WalletConnection

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_NAME = ADDON.getAddonInfo('name')
ADDON_VERSION = ADDON.getAddonInfo('version')

# Cache prune interval (in seconds)
CACHE_PRUNE_INTERVAL = 3600  # 1 hour

# Initialize components
cache = Cache()
wallet = WalletConnection()


class WyllohMonitor(xbmc.Monitor):
    """
    Monitor class for handling Kodi events and managing background tasks.
    """
    
    def __init__(self):
        """Initialize the monitor"""
        super(WyllohMonitor, self).__init__()
        self.cache_thread = None
        self.stop_cache_thread = threading.Event()

    def onSettingsChanged(self):
        """Called when addon settings are changed"""
        log("Settings changed")
        
        # Reload settings that might have changed
        wallet.api_url = get_setting('wallet_api_url') or wallet.api_url
        wallet.api_key = get_setting('wallet_api_key') or wallet.api_key

    def start_cache_thread(self):
        """Start the cache management thread"""
        if self.cache_thread and self.cache_thread.is_alive():
            # Thread already running
            return
            
        # Reset stop flag
        self.stop_cache_thread.clear()
        
        # Start thread
        self.cache_thread = threading.Thread(
            target=self.cache_worker,
            name="WyllohCacheThread"
        )
        self.cache_thread.daemon = True
        self.cache_thread.start()

    def cache_worker(self):
        """Worker thread for periodic cache maintenance"""
        log("Starting cache maintenance thread")
        
        while not self.stop_cache_thread.is_set() and not self.abortRequested():
            # Prune expired cache entries
            cache.prune()
            
            # Wait for next interval or stop signal
            if self.stop_cache_thread.wait(CACHE_PRUNE_INTERVAL):
                break
                
        log("Cache maintenance thread stopped")

    def stop_threads(self):
        """Stop all background threads"""
        if self.cache_thread and self.cache_thread.is_alive():
            self.stop_cache_thread.set()
            self.cache_thread.join(1.0)  # Wait for thread to finish


def auto_connect_wallet():
    """Automatically connect to wallet if enabled in settings"""
    if get_setting('auto_connect') == 'true':
        log("Auto-connecting wallet")
        try:
            result = wallet.connect()
            if result.get('success'):
                log("Wallet auto-connected successfully")
                notify("Wallet Connected", "Your wallet has been automatically connected")
            else:
                log(f"Wallet auto-connect failed: {result.get('message')}", level='warning')
                # Don't show error notification at startup - this would be annoying
                # Users will still see they're not connected in the UI
        except Exception as e:
            log(f"Wallet auto-connect error: {str(e)}", level='error')
            # The addon will continue to function without a connected wallet


def run():
    """Main service entry point"""
    log(f"{ADDON_NAME} service starting (v{ADDON_VERSION})")
    
    # Create monitor
    monitor = WyllohMonitor()
    
    try:
        # Start background tasks
        monitor.start_cache_thread()
        
        # Wait a few seconds before auto-connecting wallet
        # This gives the system time to stabilize
        if monitor.waitForAbort(5):
            return
        
        # Auto-connect wallet with error handling to prevent crashes
        try:
            auto_connect_wallet()
        except Exception as e:
            log(f"Auto-connect exception: {str(e)}", level='error')
        
        # Main service loop
        while not monitor.abortRequested():
            if monitor.waitForAbort(10):
                # Abort was requested while waiting
                break
    except Exception as e:
        log(f"Service error: {str(e)}", level='error')
    finally:
        # Clean up
        monitor.stop_threads()
        log(f"{ADDON_NAME} service stopping")


if __name__ == '__main__':
    run()`;
      
      fs.writeFileSync(kodiServicePath, patchedServiceContent);
    }
    
    // Install patched wallet.py
    const kodiWalletPath = path.join(KODI_USER_HOME, '.kodi/addons/plugin.video.wylloh/resources/lib/wallet.py');
    if (fs.existsSync(kodiWalletPath)) {
      log('Installing patched wallet.py for better error handling');
      
      // Create patched wallet.py with better error handling
      const patchedWalletContent = `#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Wallet Connection for Wylloh Kodi Addon
Interfaces with the Seed One app wallet service and blockchain
"""

import os
import json
import hashlib
import time
import xbmcaddon
import xbmcvfs
import requests
from urllib.parse import urljoin
from .utils import log, get_setting, set_setting

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))
ADDON_PROFILE = xbmcvfs.translatePath(ADDON.getAddonInfo('profile'))
WALLET_FILE = os.path.join(ADDON_PROFILE, 'wallet.json')

# Ensure the addon profile directory exists
if not os.path.exists(ADDON_PROFILE):
    os.makedirs(ADDON_PROFILE)

# Default API settings
DEFAULT_API_URL = "http://localhost:3333/api/"
DEFAULT_API_KEY = "local-seed-one-key"

# Connection retry settings
MAX_RETRIES = 1  # Reduced from default to fail fast and not cause UI delays
CONNECTION_TIMEOUT = 3  # Fast timeout to prevent UI blocking


class WalletConnection:
    """
    Manages wallet connections and token ownership verification.
    Uses the Seed One application's local API to interact with the blockchain.
    """
    
    def __init__(self):
        """Initialize the wallet connection"""
        self.api_url = get_setting('wallet_api_url') or DEFAULT_API_URL
        self.api_key = get_setting('wallet_api_key') or DEFAULT_API_KEY
        self.connected = False
        self.address = None
        self.tokens = []
        self.last_connection_attempt = 0
        self.connection_error = None
        
        # Load wallet from persistent storage
        self._load_wallet()

    def _load_wallet(self):
        """Load wallet data from storage"""
        try:
            if os.path.exists(WALLET_FILE):
                with open(WALLET_FILE, 'r') as f:
                    data = json.load(f)
                    self.connected = data.get('connected', False)
                    self.address = data.get('address')
                    self.tokens = data.get('tokens', [])
        except Exception as e:
            log('Error loading wallet data: {0}'.format(str(e)), level='error')
            # Reset wallet data in case of error
            self.connected = False
            self.address = None
            self.tokens = []

    def _save_wallet(self):
        """Save wallet data to storage"""
        try:
            data = {
                'connected': self.connected,
                'address': self.address,
                'tokens': self.tokens
            }
            with open(WALLET_FILE, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            log('Error saving wallet data: {0}'.format(str(e)), level='error')

    def _api_request(self, endpoint, method='get', data=None):
        """Make an API request to the Seed One wallet service"""
        try:
            headers = {
                'X-API-Key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            url = urljoin(self.api_url, endpoint)
            
            if method.lower() == 'get':
                response = requests.get(url, headers=headers, timeout=CONNECTION_TIMEOUT)
            elif method.lower() == 'post':
                response = requests.post(url, json=data, headers=headers, timeout=CONNECTION_TIMEOUT)
            elif method.lower() == 'put':
                response = requests.put(url, json=data, headers=headers, timeout=CONNECTION_TIMEOUT)
            elif method.lower() == 'delete':
                response = requests.delete(url, headers=headers, timeout=CONNECTION_TIMEOUT)
                
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            log('API request error: {0}'.format(str(e)), level='error')
            # Store the last connection error
            self.connection_error = str(e)
            return {'success': False, 'message': str(e)}

    def is_connected(self):
        """Check if wallet is connected"""
        return self.connected

    def get_address(self):
        """Get wallet address"""
        return self.address
        
    def get_connection_error(self):
        """Get the last connection error message"""
        return self.connection_error

    def connect(self):
        """Connect to wallet through Seed One API"""
        # Avoid spamming connection attempts
        current_time = time.time()
        if current_time - self.last_connection_attempt < 5:  # 5 second rate limit
            log('Throttling connection attempts', level='debug')
            return {'success': False, 'message': 'Connection attempt throttled. Please try again in a few seconds.'}
            
        self.last_connection_attempt = current_time
        self.connection_error = None
        
        try:
            response = self._api_request('wallet/connect', method='post')
            
            if response.get('success'):
                self.connected = True
                self.address = response.get('address')
                self._save_wallet()
                
                # Fetch tokens after connecting
                self.refresh()
                
                return {'success': True, 'address': self.address}
            else:
                error_msg = response.get('message', 'Failed to connect wallet')
                self.connection_error = error_msg
                log('Wallet connection failed: {0}'.format(error_msg), level='warning')
                return {'success': False, 'message': error_msg}
        except Exception as e:
            error_msg = str(e)
            self.connection_error = error_msg
            log('Error connecting wallet: {0}'.format(error_msg), level='error')
            return {'success': False, 'message': error_msg}

    def disconnect(self):
        """Disconnect wallet"""
        try:
            response = self._api_request('wallet/disconnect', method='post')
            
            if response.get('success'):
                self.connected = False
                self.address = None
                self.tokens = []
                self._save_wallet()
                
                return {'success': True}
            else:
                return {'success': False, 'message': response.get('message', 'Failed to disconnect wallet')}
        except Exception as e:
            log('Error disconnecting wallet: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def import_wallet(self, private_key):
        """Import wallet using private key"""
        try:
            response = self._api_request('wallet/import', method='post', data={
                'privateKey': private_key
            })
            
            if response.get('success'):
                self.connected = True
                self.address = response.get('address')
                self._save_wallet()
                
                # Fetch tokens after importing
                self.refresh()
                
                return {'success': True, 'address': self.address}
            else:
                return {'success': False, 'message': response.get('message', 'Failed to import wallet')}
        except Exception as e:
            log('Error importing wallet: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def refresh(self):
        """Refresh wallet data"""
        try:
            if not self.connected:
                return {'success': False, 'message': 'Wallet not connected'}
            
            # Get balance
            balance_response = self._api_request('wallet/balance')
            
            # Get tokens
            tokens_response = self._api_request('wallet/tokens')
            
            if tokens_response.get('success'):
                self.tokens = tokens_response.get('tokens', [])
                self._save_wallet()
                
                return {'success': True}
            else:
                return {'success': False, 'message': tokens_response.get('message', 'Failed to refresh wallet')}
        except Exception as e:
            log('Error refreshing wallet: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def get_balance(self):
        """Get wallet balance"""
        try:
            if not self.connected:
                return '0.0'
            
            response = self._api_request('wallet/balance')
            
            if response.get('success'):
                return response.get('balance', '0.0')
            else:
                return '0.0'
        except Exception as e:
            log('Error getting balance: {0}'.format(str(e)), level='error')
            return '0.0'

    def get_owned_tokens(self):
        """Get all owned tokens"""
        if not self.connected:
            return []
        
        # Use cached tokens
        return self.tokens

    def has_token(self, token_id):
        """Check if user owns a specific token"""
        if not self.connected:
            return False
        
        for token in self.tokens:
            if token['id'] == token_id:
                return True
        
        return False

    def has_token_for_content(self, content_id):
        """Check if user owns any token for specific content"""
        if not self.connected:
            return False
        
        for token in self.tokens:
            if token.get('contentId') == content_id:
                return True
        
        return False

    def get_token_id_for_content(self, content_id):
        """Get a token ID for specific content"""
        if not self.connected:
            return None
        
        for token in self.tokens:
            if token.get('contentId') == content_id:
                return token['id']
        
        return None

    def get_tokens_for_content(self, content_id):
        """Get all tokens for specific content"""
        if not self.connected:
            return []
        
        return [token for token in self.tokens if token.get('contentId') == content_id]

    def purchase_token(self, content_id):
        """Purchase a token for content"""
        try:
            if not self.connected:
                return {'success': False, 'message': 'Wallet not connected'}
            
            response = self._api_request('marketplace/purchase', method='post', data={
                'contentId': content_id
            })
            
            if response.get('success'):
                # Refresh tokens after purchase
                self.refresh()
                
                return {'success': True, 'tokenId': response.get('tokenId')}
            else:
                return {'success': False, 'message': response.get('message', 'Failed to purchase token')}
        except Exception as e:
            log('Error purchasing token: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}`;
      
      fs.writeFileSync(kodiWalletPath, patchedWalletContent);
    }
    
    log('Patched files installed successfully');
    return true;
  } catch (error) {
    log(`Error installing patched files: ${error.message}`);
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