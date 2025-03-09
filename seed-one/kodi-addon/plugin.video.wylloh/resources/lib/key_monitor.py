#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Key Monitor for Wylloh
Listens for specific key presses to trigger wallet connection
"""

import xbmc
import xbmcaddon
import xbmcgui
import xbmcvfs
import json
import os
import sys

# Default addon ID for when it's not passed
DEFAULT_ADDON_ID = 'plugin.video.wylloh'

# Initialize addon with addon_id parameter
def initialize_addon(addon_id=None):
    """Initialize the addon, safely handling addon ID issues"""
    addon_id = addon_id or DEFAULT_ADDON_ID
    try:
        addon = xbmcaddon.Addon(addon_id)
        addon_path = xbmcvfs.translatePath(addon.getAddonInfo('path'))
        addon_id = addon.getAddonInfo('id')
        return addon, addon_path, addon_id
    except Exception as e:
        xbmc.log(f"Error initializing addon: {str(e)}", level=xbmc.LOGERROR)
        # Try with default ID as fallback
        try:
            addon = xbmcaddon.Addon(DEFAULT_ADDON_ID)
            addon_path = xbmcvfs.translatePath(addon.getAddonInfo('path'))
            addon_id = addon.getAddonInfo('id')
            return addon, addon_path, addon_id
        except:
            # Last resort fallback
            return None, None, addon_id

# Key codes
KEY_W = 87
KEY_WALLET = 87  # W key

# Import utils and wallet modules - will be done in main() to ensure addon is initialized


class WalletKeyMonitor(xbmc.Monitor):
    """
    Monitors keyboard input for wallet connection shortcuts
    """
    def __init__(self, addon_id=None):
        """Initialize the key monitor"""
        super(WalletKeyMonitor, self).__init__()
        
        # Initialize the addon
        self.addon, self.addon_path, self.addon_id = initialize_addon(addon_id)
        
        # Lazy import utils and wallet modules
        from resources.lib.utils import log, notify, get_setting
        from resources.lib.wallet import WalletConnection
        
        self.log = log
        self.notify = notify
        self.get_setting = get_setting
        self.wallet_connection = WalletConnection()
        self.player = xbmc.Player()
        self.log("Key monitor initialized")

    def onAction(self, action):
        """Handle key press actions"""
        action_id = action.getId()
        button_code = action.getButtonCode()
        
        self.log(f"Action received: ID={action_id}, Button Code={button_code}")
        
        # Check for W key (may be triggered through different action IDs)
        if button_code == KEY_W or (action_id == 0 and button_code == 0):
            self._handle_wallet_key()
            
    def _handle_wallet_key(self):
        """Handle wallet key press"""
        # Don't interrupt video playback
        if self.player.isPlayingVideo():
            return
            
        # Check if already connected
        if self.wallet_connection.is_connected():
            # Show current connection info
            address = self.wallet_connection.get_address()
            short_address = f"{address[:8]}...{address[-6:]}" if address else "Unknown"
            self.notify("Wallet Connected", f"Address: {short_address}", time=5000)
            
            # Show options dialog
            options = ["View Wallet Info", "Disconnect Wallet", "Cancel"]
            choice = xbmcgui.Dialog().select("Wallet Options", options)
            
            if choice == 0:  # View Wallet Info
                self._show_wallet_info()
            elif choice == 1:  # Disconnect Wallet
                result = self.wallet_connection.disconnect()
                if result.get('success'):
                    self.notify("Wallet Disconnected", "Your wallet has been disconnected", time=3000)
                else:
                    self.notify("Error", f"Failed to disconnect wallet: {result.get('message')}", time=5000)
            
            return
        
        # Try to connect wallet
        self.log("Wallet key pressed, attempting to connect wallet")
        self.notify("Connecting Wallet", "Please wait...", time=2000)
        
        try:
            # Use QR code-based connection
            result = self.wallet_connection.connect(use_qr=True)
            
            if result.get('success'):
                address = self.wallet_connection.get_address()
                short_address = f"{address[:8]}...{address[-6:]}" if address else "Unknown"
                self.notify("Wallet Connected", f"Address: {short_address}", time=5000)
                
                # Execute addon to refresh content if we're on the main screen
                current_window = xbmc.getInfoLabel('System.CurrentWindow')
                if current_window in ['Home', 'home']:
                    xbmc.executebuiltin(f"RunAddon({self.addon_id})")
            else:
                error = result.get('message', 'Connection failed')
                self.notify("Wallet Error", error, time=5000)
                
                # Show more detailed dialog
                xbmcgui.Dialog().ok("Wallet Connection Failed", 
                                     error,
                                     "Please check that the Wylloh service is running",
                                     "and your wallet is accessible.")
        except Exception as e:
            error_msg = str(e)
            self.log(f"Error connecting wallet: {error_msg}", level='error')
            self.notify("Wallet Error", "Failed to connect. Check logs.", time=5000)
    
    def _show_wallet_info(self):
        """Show wallet information dialog"""
        if not self.wallet_connection.is_connected():
            self.notify("Not Connected", "Wallet is not connected", time=3000)
            return
            
        # Get wallet data
        address = self.wallet_connection.get_address()
        short_address = f"{address[:8]}...{address[-6:]}" if address else "Unknown"
        balance = self.wallet_connection.get_balance()
        tokens = self.wallet_connection.get_owned_tokens()
        token_count = len(tokens)
        
        # Show dialog
        lines = [
            f"Address: {short_address}",
            f"Balance: {balance}",
            f"Owned Tokens: {token_count}",
            "\nPress OK to close"
        ]
        
        xbmcgui.Dialog().textviewer("Wallet Information", "\n".join(lines))


class KeyInputMonitor(xbmc.Monitor):
    """
    Keyboard input monitor using Player class as a hack to receive onAction events
    """
    
    def __init__(self, addon_id=None):
        """Initialize the input monitor"""
        super(KeyInputMonitor, self).__init__()
        
        # Initialize the addon
        self.addon, self.addon_path, self.addon_id = initialize_addon(addon_id)
        
        # Lazy import utils and wallet modules
        from resources.lib.utils import log
        from resources.lib.wallet import WalletConnection
        
        self.log = log
        self.wallet_connection = WalletConnection()
        self.log("Input monitor initialized")
    
    def run(self):
        """Start monitoring"""
        player = WalletKeyPlayer(self.wallet_connection, self.addon_id)
        player.run()
        return player


class WalletKeyPlayer(xbmc.Player):
    """
    Custom player that captures key events
    This is a hack to get key events without interfering with normal navigation
    """
    
    def __init__(self, wallet_connection, addon_id=None):
        """Initialize the player"""
        super(WalletKeyPlayer, self).__init__()
        self.wallet_connection = wallet_connection
        
        # Initialize the addon
        self.addon, self.addon_path, self.addon_id = initialize_addon(addon_id)
    
    def run(self):
        """Start the player with a dummy item to get key events"""
        dummy_playlist = xbmc.PlayList(xbmc.PLAYLIST_MUSIC)
        dummy_playlist.clear()
        dummy_file = os.path.join(self.addon_path, 'resources', 'media', 'silence.mp3')
        
        # Create dummy silence file if it doesn't exist
        if not os.path.exists(dummy_file):
            dummy_dir = os.path.dirname(dummy_file)
            if not os.path.exists(dummy_dir):
                os.makedirs(dummy_dir)
            with open(dummy_file, 'wb') as f:
                # Write a minimal valid MP3 file
                f.write(b'\xFF\xFB\x90\x44\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00')
            
        dummy_playlist.add(dummy_file)
        self.play(dummy_playlist, windowed=True)
        self.setVolume(0)  # Mute the dummy audio
        
    def onAction(self, action):
        """Handle key press actions"""
        action_id = action.getId()
        button_code = action.getButtonCode()
        
        # Check for W key
        if button_code == KEY_W:
            self._handle_wallet_key()
    
    def _handle_wallet_key(self):
        """Handle wallet key press"""
        # Don't interrupt real video playback
        if self.isPlayingVideo():
            return
            
        # Use the monitor's handler since it's already implemented
        monitor = WalletKeyMonitor(self.addon_id)
        monitor._handle_wallet_key()


def main(addon_id=None):
    """Main function when script is run directly"""
    # Initialize logging - need to do this directly since we can't import yet
    addon_id = addon_id or DEFAULT_ADDON_ID
    xbmc.log(f"[{addon_id}] Starting wallet key monitor script", level=xbmc.LOGINFO)
    
    # Try different approaches - we have multiple options here to see what works best
    try:
        # Approach 1: Direct key monitor through onAction
        # This might not catch all keys but is simplest
        monitor = WalletKeyMonitor(addon_id)
        
        # Wait for abort
        while not monitor.abortRequested():
            if monitor.waitForAbort(1):
                break
    except Exception as e:
        xbmc.log(f"[{addon_id}] Error in key monitor: {str(e)}", level=xbmc.LOGERROR)
        
        try:
            # Approach 2: Using a dummy player as a hack to get key events
            xbmc.log(f"[{addon_id}] Trying alternative key monitoring approach", level=xbmc.LOGINFO)
            input_monitor = KeyInputMonitor(addon_id)
            player = input_monitor.run()
            
            # Keep monitoring until abort requested
            while not input_monitor.abortRequested():
                if input_monitor.waitForAbort(1):
                    break
                
            # Stop player when done
            if player.isPlaying():
                player.stop()
        except Exception as e2:
            xbmc.log(f"[{addon_id}] Error in alternative key monitor: {str(e2)}", level=xbmc.LOGERROR)
    
    xbmc.log(f"[{addon_id}] Wallet key monitor script stopped", level=xbmc.LOGINFO)


if __name__ == "__main__":
    # When run as a script
    main() 