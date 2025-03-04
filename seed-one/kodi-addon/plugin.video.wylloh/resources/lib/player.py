#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Custom Player for Wylloh Kodi Addon
Handles content playback with token verification
"""

import time
import threading
import xbmc
import xbmcaddon
from .utils import log, notify, get_setting

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_NAME = ADDON.getAddonInfo('name')

# Verification interval in seconds
DEFAULT_VERIFICATION_INTERVAL = 300  # 5 minutes


class WyllohPlayer(xbmc.Player):
    """
    Custom player implementation for Wylloh content.
    
    Extends xbmc.Player with additional functionality:
    - License verification during playback
    - Periodic token verification
    - Watermark support
    """
    
    def __init__(self):
        """Initialize the player"""
        super(WyllohPlayer, self).__init__()
        self.content_id = None
        self.token_id = None
        self.stream_url = None
        self.is_playing_wylloh_content = False
        
        # Track verification thread
        self.verification_thread = None
        self.stop_verification = threading.Event()
        
        # Settings
        self.verification_interval = int(get_setting('verification_interval') or DEFAULT_VERIFICATION_INTERVAL)

    def play_content(self, content_id, token_id, stream_url):
        """
        Play Wylloh content with token verification
        
        Args:
            content_id (str): Content ID
            token_id (str): Token ID for license verification
            stream_url (str): Streaming URL
        """
        log(f"Playing Wylloh content: {content_id} with token: {token_id}")
        self.content_id = content_id
        self.token_id = token_id
        self.stream_url = stream_url
        self.is_playing_wylloh_content = True
        
        # Start verification thread
        self.start_verification_thread()

    def onPlayBackStarted(self):
        """Called when playback starts"""
        if self.is_playing_wylloh_content:
            log("Wylloh content playback started")
            
            # Verify we're playing the right content
            current_file = self.getPlayingFile()
            if current_file != self.stream_url:
                log(f"Playing file {current_file} doesn't match expected Wylloh stream URL", level='warning')

    def onPlayBackEnded(self):
        """Called when playback ends"""
        if self.is_playing_wylloh_content:
            log("Wylloh content playback ended normally")
            self.cleanup()

    def onPlayBackStopped(self):
        """Called when playback is stopped by user"""
        if self.is_playing_wylloh_content:
            log("Wylloh content playback stopped by user")
            self.cleanup()

    def onPlayBackError(self):
        """Called when playback encounters an error"""
        if self.is_playing_wylloh_content:
            log("Wylloh content playback error occurred", level='error')
            notify('Playback Error', 'An error occurred during playback', icon='error')
            self.cleanup()

    def cleanup(self):
        """Clean up resources when playback ends"""
        self.stop_verification.set()
        if self.verification_thread and self.verification_thread.is_alive():
            self.verification_thread.join(1.0)  # Wait for thread to finish
            
        self.content_id = None
        self.token_id = None
        self.stream_url = None
        self.is_playing_wylloh_content = False
        self.stop_verification.clear()

    def start_verification_thread(self):
        """Start the background verification thread"""
        if self.verification_thread and self.verification_thread.is_alive():
            # Thread already running
            return
            
        # Reset stop flag
        self.stop_verification.clear()
        
        # Start thread
        self.verification_thread = threading.Thread(
            target=self.verification_worker,
            name="WyllohVerificationThread"
        )
        self.verification_thread.daemon = True
        self.verification_thread.start()

    def verification_worker(self):
        """Worker thread for periodic license verification"""
        log("Starting license verification thread")
        
        # Initial verification
        self.verify_license()
        
        # Periodic verification
        while not self.stop_verification.is_set() and not xbmc.Monitor().abortRequested():
            # Check if still playing
            if not self.isPlaying() or not self.is_playing_wylloh_content:
                log("No longer playing Wylloh content, stopping verification thread")
                break
                
            # Wait for next verification interval
            if self.stop_verification.wait(self.verification_interval):
                break
                
            # Verify license
            self.verify_license()
            
        log("License verification thread stopped")

    def verify_license(self):
        """
        Verify license token during playback
        
        Returns:
            bool: True if verification succeeded, False otherwise
        """
        if not self.is_playing_wylloh_content or not self.token_id:
            return False
            
        log(f"Verifying license for token {self.token_id}")
        
        try:
            # TODO: Implement actual license verification logic
            # Here we would call the API to verify the token is still valid
            
            # For demo, just simulate success
            verified = True
            
            if not verified:
                log("License verification failed", level='error')
                notify('License Error', 'Your license could not be verified', icon='error')
                self.stop()
                return False
                
            return True
        except Exception as e:
            log(f"Error during license verification: {str(e)}", level='error')
            return False