#!/usr/bin/env python
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
    run() 