#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Wallet QR Code Dialog for Wylloh Kodi Add-on
Displays QR code for wallet connections
"""

import os
import time
import threading
import xbmc
import xbmcgui
import xbmcaddon
import xbmcvfs
from .utils import log
from . import qrcode_utils

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_NAME = ADDON.getAddonInfo('name')
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))

# Get screen dimensions
# Default fallback values if we can't get the actual screen resolution
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080

# Try to get actual screen dimensions
try:
    window_width = xbmcgui.getScreenWidth()
    window_height = xbmcgui.getScreenHeight()
    if window_width > 0 and window_height > 0:
        SCREEN_WIDTH = window_width
        SCREEN_HEIGHT = window_height
except:
    pass  # Use default values if there's an error

# Colors
COLOR_BACKGROUND = '0xDD000000'  # Semi-transparent black
COLOR_TEXT = '0xFFFFFFFF'  # White
COLOR_BUTTON = '0xFF1E88E5'  # Material Blue
COLOR_BUTTON_FOCUS = '0xFF2196F3'  # Material Blue (lighter)

# Alignment constants changed in Kodi v20+
try:
    # Try newer constants first
    ALIGN_CENTER = 0x00000002 + 0x00000004  # XBFONT_CENTER_X + XBFONT_CENTER_Y
except:
    # Fallback to older constants if available
    try:
        ALIGN_CENTER = xbmcgui.ALIGN_CENTER
    except:
        # Default fallback value used in Kodi
        ALIGN_CENTER = 6

class WalletQRDialog(xbmcgui.WindowDialog):
    """
    Dialog window for displaying wallet connection QR code
    """
    
    def __init__(self, wallet_connection):
        """
        Initialize the wallet QR dialog
        
        Args:
            wallet_connection: Instance of WalletConnection class
        """
        super(WalletQRDialog, self).__init__()
        self.wallet = wallet_connection
        self.is_connected = False
        self.is_canceled = False
        self.close_event = threading.Event()
        self.connection_checker = None
        self.connection_url = None
        
        # Calculate dialog dimensions and position
        self.dialog_width = int(SCREEN_WIDTH * 0.6)  # 60% of screen width
        self.dialog_height = int(SCREEN_HEIGHT * 0.7)  # 70% of screen height
        self.dialog_x = (SCREEN_WIDTH - self.dialog_width) // 2
        self.dialog_y = (SCREEN_HEIGHT - self.dialog_height) // 2
        
        # Calculate QR code dimensions and position
        self.qr_size = min(self.dialog_width, self.dialog_height) // 2
        self.qr_x = self.dialog_x + (self.dialog_width - self.qr_size) // 2
        self.qr_y = self.dialog_y + 100  # Leave space for title
        
        # Setup dialog UI
        self._init_ui()
    
    def _init_ui(self):
        """Initialize dialog UI elements"""
        # Create background panel
        self.background = xbmcgui.ControlImage(
            self.dialog_x, 
            self.dialog_y, 
            self.dialog_width, 
            self.dialog_height, 
            filename='',
            colorDiffuse=COLOR_BACKGROUND
        )
        
        # Create title
        self.title = xbmcgui.ControlLabel(
            self.dialog_x, 
            self.dialog_y + 20, 
            self.dialog_width, 
            30, 
            'Connect Your Wallet',
            font='font30_title',
            textColor=COLOR_TEXT,
            alignment=ALIGN_CENTER
        )
        
        # Create QR display area - can be either image or text
        self.qr_image = xbmcgui.ControlImage(
            self.qr_x, 
            self.qr_y, 
            self.qr_size, 
            self.qr_size, 
            filename=ADDON.getAddonInfo('icon')
        )
        
        # Create QR text for non-image QR codes
        self.qr_textbox = xbmcgui.ControlTextBox(
            self.qr_x, 
            self.qr_y, 
            self.qr_size, 
            self.qr_size,
            font='font10'
        )
        
        # Create connection URL textbox
        self.url_textbox = xbmcgui.ControlTextBox(
            self.dialog_x + 50, 
            self.qr_y + self.qr_size + 10, 
            self.dialog_width - 100, 
            30,
            font='font10'
        )
        
        # Create instructions text
        self.instructions = xbmcgui.ControlTextBox(
            self.dialog_x + 50, 
            self.qr_y + self.qr_size + 50, 
            self.dialog_width - 100, 
            80, 
            font='font14'
        )
        
        # Create status text
        self.status_text = xbmcgui.ControlLabel(
            self.dialog_x, 
            self.dialog_y + self.dialog_height - 80, 
            self.dialog_width, 
            30, 
            'Waiting for connection...',
            font='font14',
            textColor=COLOR_TEXT,
            alignment=ALIGN_CENTER
        )
        
        # Create cancel button
        self.cancel_button = xbmcgui.ControlButton(
            self.dialog_x + (self.dialog_width - 200) // 2, 
            self.dialog_y + self.dialog_height - 50, 
            200, 
            40, 
            'Cancel',
            focusTexture=COLOR_BUTTON_FOCUS,
            noFocusTexture=COLOR_BUTTON,
            alignment=ALIGN_CENTER
        )
        
        # Add all controls to the window
        self.addControl(self.background)
        self.addControl(self.title)
        self.addControl(self.qr_image)
        self.addControl(self.qr_textbox)
        self.addControl(self.url_textbox)
        self.addControl(self.instructions)
        self.addControl(self.status_text)
        self.addControl(self.cancel_button)
        
        # Set focus on cancel button
        self.setFocus(self.cancel_button)
        
        # Set instructions text
        self.instructions.setText(
            "1. Open your mobile wallet app\n"
            "2. Scan this QR code\n"
            "3. Approve the connection request on your mobile device"
        )
        
        # Hide QR text initially - we'll show either image or text based on what's available
        self.qr_textbox.setVisible(False)
    
    def update_qr_code(self, connection_url):
        """
        Update the QR code with connection URL
        
        Args:
            connection_url (str): Wallet connection URL
        """
        self.connection_url = connection_url
        
        try:
            # Generate QR code (text or image)
            qr_path = qrcode_utils.create_wallet_connect_qr(connection_url)
            
            # Show URL text
            self.url_textbox.setText(f"Connection URL: {connection_url}")
            
            # Check if we got a text-based QR code
            if qr_path.endswith('.txt'):
                self.qr_image.setVisible(False)
                self.qr_textbox.setVisible(True)
                
                # Read the text file and display it
                with open(qr_path, 'r') as f:
                    qr_text = f.read()
                self.qr_textbox.setText(qr_text)
            else:
                # Image-based QR code
                self.qr_textbox.setVisible(False)
                self.qr_image.setVisible(True)
                self.qr_image.setImage(qr_path)
            
            # Log the connection URL for demo/testing
            log(f"Wallet connection URL: {connection_url}")
        except Exception as e:
            log(f"Error updating QR code: {str(e)}", level='error')
            # Show a fallback message
            self.qr_textbox.setVisible(True)
            self.qr_image.setVisible(False)
            self.qr_textbox.setText(f"Connection URL:\n\n{connection_url}\n\nPlease enter this URL in your wallet app.")
    
    def onControl(self, control):
        """Handle control callbacks"""
        if control == self.cancel_button:
            self.is_canceled = True
            self.close_event.set()
            self.close()
    
    def onAction(self, action):
        """Handle actions"""
        action_id = action.getId()
        # Handle back button, escape, etc.
        if action_id in [9, 10, 92, 216]:  # Back, Previous Menu, Back on remote, etc.
            self.is_canceled = True
            self.close_event.set()
            self.close()
    
    def start_connection_check(self, interval=1.0):
        """
        Start a thread to check for wallet connection
        
        Args:
            interval (float): Check interval in seconds
        """
        self.connection_checker = threading.Thread(
            target=self._check_connection,
            args=(interval,),
            daemon=True
        )
        self.connection_checker.start()
    
    def _check_connection(self, interval):
        """
        Periodically check if wallet has been connected
        
        Args:
            interval (float): Check interval in seconds
        """
        while not self.close_event.is_set():
            # Check if wallet is connected
            if self.wallet.is_connected():
                self.is_connected = True
                self.close_event.set()
                
                # Update UI from the main thread
                xbmc.executebuiltin("Dialog.Close(all, true)")
                return
            
            # Update status text
            self.status_text.setLabel('Waiting for connection... Scan QR with wallet app')
            
            # Wait for next check or stop signal
            time.sleep(interval)
    
    def wait_for_connection(self, timeout=120):
        """
        Wait for wallet connection or timeout
        
        Args:
            timeout (int): Timeout in seconds
            
        Returns:
            bool: True if connected, False if canceled or timeout
        """
        # Start connection checker
        self.start_connection_check()
        
        # Wait for connection or timeout
        self.close_event.wait(timeout)
        
        # Check result
        if self.is_connected:
            return True
        
        # Not connected, ensure dialog is closed
        if not self.is_canceled:  # Only close if not already closed by cancel button
            self.close()
        
        return False


def show_wallet_connect_dialog(wallet_connection, connection_url, timeout=120):
    """
    Show wallet connection QR code dialog
    
    Args:
        wallet_connection: Instance of WalletConnection class
        connection_url (str): Wallet connection URL
        timeout (int): Dialog timeout in seconds
        
    Returns:
        bool: True if connected, False if canceled or timeout
    """
    try:
        # Create and show dialog
        dialog = WalletQRDialog(wallet_connection)
        dialog.update_qr_code(connection_url)
        dialog.show()
        
        # Wait for connection
        result = dialog.wait_for_connection(timeout)
        
        return result
    except Exception as e:
        log(f"Error showing wallet connect dialog: {str(e)}", level='error')
        return False 