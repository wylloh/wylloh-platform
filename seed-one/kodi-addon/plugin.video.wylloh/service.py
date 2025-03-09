#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Wylloh Kodi Add-on Service
Background service for wallet connections and system monitoring
"""

import xbmc
import xbmcaddon
import xbmcgui
import xbmcvfs
import os
import sys
import time
import threading
import json

# Add-on info
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_NAME = ADDON.getAddonInfo('name')

# Add resources/lib to path
try:
    # Get the main add-on directory
    main_dir = os.path.dirname(os.path.abspath(__file__))
    lib_dir = os.path.join(main_dir, 'resources', 'lib')
    sys.path.insert(0, lib_dir)
    
    # Import our modules
    from resources.lib import wallet
    from resources.lib.wallet_overlay import start_wallet_overlay
    from resources.lib.utils import log, get_setting
except Exception as e:
    xbmc.log(f"[{ADDON_ID}] Error loading modules: {str(e)}", level=xbmc.LOGERROR)
    raise


class WyllohMonitor(xbmc.Monitor):
    """
    Wylloh service monitor class
    Monitors Kodi state and manages background services
    """
    
    def __init__(self):
        """Initialize the monitor"""
        super(WyllohMonitor, self).__init__()
        
        # Initialize variables
        self.wallet_connection = None
        self.wallet_monitor = None
        self.key_monitor_started = False
    
    def run(self):
        """Main service entry point"""
        log("Wylloh service starting")
        
        try:
            # Initialize wallet connection
            self.wallet_connection = wallet.WalletConnection()
            log("Wallet connection initialized")
            
            # Start wallet overlay/notifications
            log("Starting wallet overlay")
            self.wallet_monitor = start_wallet_overlay(self.wallet_connection)
            
            # Start key monitor for wallet connection shortcut
            self._start_key_monitor()
        
        except Exception as e:
            log(f"Error in service initialization: {str(e)}", level='error')
        
        # Main monitoring loop
        log("Entering main monitoring loop")
        while not self.abortRequested():
            # Check if we should exit
            if self.waitForAbort(1):
                break
                
            # If key monitor not started yet or failed, try again periodically
            if not self.key_monitor_started:
                self._start_key_monitor()
        
        # Cleanup
        self._cleanup()
        log("Wylloh service stopped")
    
    def _start_key_monitor(self):
        """Start the key monitoring script"""
        if self.key_monitor_started:
            return
            
        try:
            # Only try to start the key monitor if it's not already running
            log("Starting wallet key monitor")
            # Use a fully qualified path to the launcher script
            script_path = os.path.join(xbmcvfs.translatePath('special://home/addons/' + ADDON_ID), 
                                     'resources', 'lib', 'key_monitor_launcher.py')
            xbmc.executebuiltin(f"RunScript({script_path})")
            self.key_monitor_started = True
            log("Key monitor started successfully")
        except Exception as e:
            log(f"Error starting key monitor: {str(e)}", level='error')
            self.key_monitor_started = False
    
    def _cleanup(self):
        """Clean up resources before exiting"""
        log("Cleaning up before service exit")
        
        # Stop wallet overlay/notifications
        if self.wallet_monitor:
            try:
                self.wallet_monitor.stop_monitoring()
            except Exception as e:
                log(f"Error stopping wallet monitor: {str(e)}", level='error')
        
        # Disconnect wallet if connected
        if self.wallet_connection and self.wallet_connection.is_connected():
            try:
                self.wallet_connection.disconnect()
            except Exception as e:
                log(f"Error disconnecting wallet: {str(e)}", level='error')


# Entry point
if __name__ == '__main__':
    # Start the service
    monitor = WyllohMonitor()
    monitor.run() 