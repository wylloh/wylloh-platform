#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Wallet Connection for Wylloh Kodi Add-on
Handles wallet connection notifications and monitoring
"""

import os
import time
import threading
import xbmc
import xbmcgui
import xbmcaddon
import xbmcvfs
from . import wallet
from .utils import log, get_setting, notify
from .wallet_qr_dialog import show_wallet_connect_dialog

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_NAME = ADDON.getAddonInfo('name')
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))

# Check frequency (in seconds)
CHECK_INTERVAL = 2  # Check more frequently for better responsiveness
CONNECT_DELAY = 3  # Delay before auto-connecting on startup (seconds)
NAVIGATION_TIMEOUT = 1.0  # Time to wait for navigation events (seconds)

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

# Banner dimensions and position
BANNER_WIDTH = 300
BANNER_HEIGHT = 60
BANNER_X = SCREEN_WIDTH - BANNER_WIDTH - 40  # 40px from right edge
BANNER_Y = 100  # Position at top of screen with some margin

# Colors
COLOR_CONNECTED = '0xFF00FF00'  # Green
COLOR_DISCONNECTED = '0xFFFF0000'  # Red
COLOR_BACKGROUND = '0xDD000000'  # Semi-transparent black
COLOR_TEXT = '0xFFFFFFFF'  # White
COLOR_FOCUSED = '0xFF0088FF'  # Bright blue when focused
COLOR_BORDER = '0xFFFFFFFF'  # White border

# Alignment constants changed in Kodi v20+
try:
    # Try newer constants first
    ALIGN_CENTER = 0x00000002 + 0x00000004  # XBFONT_CENTER_X + XBFONT_CENTER_Y
    ALIGN_LEFT = 0x00000000  # XBFONT_LEFT
    ALIGN_RIGHT = 0x00000002  # XBFONT_RIGHT
    ALIGN_CENTER_Y = 0x00000004  # XBFONT_CENTER_Y
except:
    # Fallback to older constants if available
    try:
        ALIGN_CENTER = xbmcgui.ALIGN_CENTER
        ALIGN_LEFT = xbmcgui.ALIGN_LEFT 
        ALIGN_RIGHT = xbmcgui.ALIGN_RIGHT
        ALIGN_CENTER_Y = 6  # Approximate value
    except:
        # Default fallback values used in Kodi
        ALIGN_CENTER = 6
        ALIGN_LEFT = 0
        ALIGN_RIGHT = 2
        ALIGN_CENTER_Y = 4

# Create a texture path for focus/selection
def create_texture(color, width, height, border_width=5, border_color=None):
    """Create a texture file for button states"""
    filename = f"button_{color.replace('0x', '')}_{width}x{height}.png"
    filepath = os.path.join(xbmcvfs.translatePath(ADDON.getAddonInfo('profile')), filename)
    
    # Check if file already exists
    if os.path.exists(filepath):
        return filepath
    
    try:
        # Ensure directory exists
        dirname = os.path.dirname(filepath)
        if not os.path.exists(dirname):
            os.makedirs(dirname)
            
        # Try to use PIL if available
        try:
            from PIL import Image, ImageDraw
            
            # Create an RGBA image
            img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Parse color (format: 0xAARRGGBB)
            a = int(color[2:4], 16)
            r = int(color[4:6], 16)
            g = int(color[6:8], 16)
            b = int(color[8:10], 16)
            
            # Draw filled rectangle
            draw.rectangle([(0, 0), (width, height)], fill=(r, g, b, a))
            
            # Add border if specified
            if border_width > 0 and border_color:
                # Parse border color
                ba = int(border_color[2:4], 16)
                br = int(border_color[4:6], 16)
                bg = int(border_color[6:8], 16)
                bb = int(border_color[8:10], 16)
                
                # Draw border
                for i in range(border_width):
                    draw.rectangle(
                        [(i, i), (width-i-1, height-i-1)], 
                        outline=(br, bg, bb, ba)
                    )
            
            # Save image
            img.save(filepath, 'PNG')
            return filepath
        except ImportError:
            # PIL not available, create a text file as fallback
            with open(filepath, 'w') as f:
                f.write(f"Color: {color}\n")
                f.write(f"Size: {width}x{height}\n")
            
            # Use a default texture from the skin
            default_texture = os.path.join(xbmcvfs.translatePath('special://skin'), 'media', 'button-focus.png')
            if os.path.exists(default_texture):
                return default_texture
            
            # Last resort, use addon icon
            return ADDON.getAddonInfo('icon')
    except Exception as e:
        log(f"Error creating texture: {str(e)}", level='error')
        return ADDON.getAddonInfo('icon')


class WalletBanner(xbmcgui.WindowDialog):
    """
    Creates a selectable wallet notification banner
    """
    
    def __init__(self, wallet_connection):
        """
        Initialize the wallet banner
        
        Args:
            wallet_connection: Instance of WalletConnection class
        """
        super(WalletBanner, self).__init__()
        self.wallet = wallet_connection
        self.is_visible = False
        self.last_status = False
        self.is_focused = False
        self.navigation_timer = None
        
        # Create button textures
        self.normal_texture = create_texture(COLOR_BACKGROUND, BANNER_WIDTH, BANNER_HEIGHT, 0)
        self.focus_texture = create_texture(COLOR_FOCUSED, BANNER_WIDTH, BANNER_HEIGHT, 3, COLOR_BORDER)
        
        # Create background
        self.background = xbmcgui.ControlImage(
            BANNER_X, 
            BANNER_Y, 
            BANNER_WIDTH, 
            BANNER_HEIGHT, 
            filename='',
            colorDiffuse=COLOR_BACKGROUND
        )
        
        # Create wallet icon
        icon_path = os.path.join(ADDON_PATH, 'resources', 'media', 'wallet_icon.png')
        if not os.path.exists(icon_path):
            # Fallback to addon icon
            icon_path = ADDON.getAddonInfo('icon')
            
        self.status_icon = xbmcgui.ControlImage(
            BANNER_X + 10, 
            BANNER_Y + 10, 
            BANNER_HEIGHT - 20, 
            BANNER_HEIGHT - 20, 
            filename=icon_path,
            colorDiffuse=COLOR_DISCONNECTED
        )
        
        # Create message text - showing wallet status
        self.status_text = xbmcgui.ControlLabel(
            BANNER_X + BANNER_HEIGHT, 
            BANNER_Y + 5,
            BANNER_WIDTH - BANNER_HEIGHT - 20, 
            25, 
            'Wallet: Not Connected',
            font='font14',
            textColor=COLOR_TEXT,
            alignment=ALIGN_LEFT
        )
        
        # Create address text - will show address when connected
        self.address_text = xbmcgui.ControlLabel(
            BANNER_X + BANNER_HEIGHT, 
            BANNER_Y + 30, 
            BANNER_WIDTH - BANNER_HEIGHT - 20, 
            25, 
            'Press OK to connect',
            font='font12',
            textColor=COLOR_TEXT,
            alignment=ALIGN_LEFT
        )
        
        # Create selectable button for the entire banner
        self.banner_button = xbmcgui.ControlButton(
            BANNER_X, 
            BANNER_Y, 
            BANNER_WIDTH, 
            BANNER_HEIGHT, 
            '',  # No text, just button area
            focusTexture=self.focus_texture,
            noFocusTexture=self.normal_texture,
            focusedColor=COLOR_TEXT,
            textOffsetX=5,
            textOffsetY=5
        )
        
        # Add controls to the window - order matters for navigation
        self.addControl(self.background)
        self.addControl(self.status_icon)
        self.addControl(self.status_text)
        self.addControl(self.address_text)
        self.addControl(self.banner_button)
        
        # Set banner button as focused/selectable control
        self.setFocus(self.banner_button)
        
        # Set initial state
        self.update_status()
        
        # Start navigation listener
        self.start_navigation_monitor()
        
    def start_navigation_monitor(self):
        """Start monitoring for navigation events to capture focus"""
        if self.navigation_timer is None:
            self.navigation_timer = threading.Timer(NAVIGATION_TIMEOUT, self.check_navigation)
            self.navigation_timer.daemon = True
            self.navigation_timer.start()
    
    def check_navigation(self):
        """Check if we should capture navigation focus"""
        try:
            # Try to detect right arrow press and capture focus
            action_string = xbmc.getInfoLabel('System.CurrentControl')
            if action_string and 'right' in action_string.lower():
                log("Right navigation detected, capturing focus")
                self.capture_focus()
        except:
            pass
            
        # Restart timer for next check
        self.navigation_timer = threading.Timer(NAVIGATION_TIMEOUT, self.check_navigation)
        self.navigation_timer.daemon = True
        self.navigation_timer.start()
    
    def capture_focus(self):
        """Capture focus to the wallet banner"""
        try:
            xbmc.executebuiltin("SetFocus(9000)")  # Attempt to reset focus to home menu
            self.setFocus(self.banner_button)
            self.is_focused = True
            self.background.setColorDiffuse(COLOR_FOCUSED)  # Highlight background
            xbmc.executebuiltin("Action(FirstPage)")  # Try to show first page of home menu
        except:
            pass
        
    def update_status(self):
        """Update wallet status display"""
        is_connected = self.wallet.is_connected()
        
        # Only update if status changed
        if is_connected != self.last_status:
            self.last_status = is_connected
            
            if is_connected:
                # Connected - show wallet address
                self.status_icon.setColorDiffuse(COLOR_CONNECTED)
                self.status_text.setLabel('Wallet: Connected')
                
                # Show address
                address = self.wallet.get_address()
                if address:
                    short_address = f"{address[:8]}...{address[-6:]}"
                    self.address_text.setLabel(f"Address: {short_address}")
                else:
                    self.address_text.setLabel("Press OK for options")
            else:
                # Not connected - prompt to connect
                self.status_icon.setColorDiffuse(COLOR_DISCONNECTED)
                self.status_text.setLabel('Wallet: Not Connected')
                self.address_text.setLabel("Press OK to connect")
    
    def show_overlay(self):
        """Show the banner overlay"""
        if not self.is_visible:
            self.show()
            self.is_visible = True
            # Update status when showing
            self.update_status()
            
            # Add action listener for right arrow key
            xbmc.executebuiltin("SendClick(2000, 7)")  # Simulate a click on banner (may not work)
    
    def hide_overlay(self):
        """Hide the banner overlay"""
        # Stop the navigation timer
        if self.navigation_timer:
            self.navigation_timer.cancel()
            self.navigation_timer = None
            
        if self.is_visible:
            self.close()
            self.is_visible = False
    
    def onControl(self, control):
        """Handle control activation"""
        if control == self.banner_button:
            self._handle_banner_click()
    
    def onAction(self, action):
        """Handle key actions"""
        action_id = action.getId()
        button_code = action.getButtonCode()
        
        log(f"Banner received action: {action_id}, button code: {button_code}")
        
        # Handle navigation keys - capture right key from main menu
        if action_id in [3, 13, 14]:  # Right, stop, pause
            self.is_focused = True
            self.background.setColorDiffuse(COLOR_FOCUSED)
        # Handle back button (exit overlay)
        elif action_id in [9, 10, 92, 216]:  # Back, Previous Menu
            self.is_focused = False
            self.background.setColorDiffuse(COLOR_BACKGROUND)
            xbmc.executebuiltin("Action(FirstPage)")  # Try to show first page of home menu
        # Handle W key as alternative activation
        elif button_code == 87:  # W key
            self._handle_banner_click()
        # Handle OK/Select button when focused
        elif action_id in [7, 100]:  # Select/Click/Enter
            if self.is_focused:
                self._handle_banner_click()
    
    def _handle_banner_click(self):
        """Handle banner click action"""
        # Check if already connected
        if self.wallet.is_connected():
            # Show options dialog for connected wallet
            options = ["View Wallet Info", "Disconnect Wallet", "Cancel"]
            choice = xbmcgui.Dialog().select("Wallet Options", options)
            
            if choice == 0:  # View Wallet Info
                self._show_wallet_info()
            elif choice == 1:  # Disconnect Wallet
                result = self.wallet.disconnect()
                if result.get('success'):
                    notify("Wallet Disconnected", "Your wallet has been disconnected", time=3000)
                    # Update status immediately
                    self.update_status()
                else:
                    notify("Error", f"Failed to disconnect wallet: {result.get('message')}", time=5000)
            
            return
        
        # Not connected, try to connect
        notify("Connecting Wallet", "Starting wallet connection...", time=2000)
        
        try:
            # Hide banner during connection process
            self.hide_overlay()
            
            # Use QR code-based connection
            result = self.wallet.connect(use_qr=True)
            
            if result.get('success'):
                address = self.wallet.get_address()
                short_address = f"{address[:8]}...{address[-6:]}" if address else "Unknown"
                notify("Wallet Connected", f"Address: {short_address}", time=5000)
                
                # Update status after connection
                self.update_status()
                # Show banner again
                self.show_overlay()
            else:
                error = result.get('message', 'Connection failed')
                notify("Wallet Error", error, time=5000)
                
                # Show banner again
                self.show_overlay()
                
                # Show more detailed dialog
                xbmcgui.Dialog().ok("Wallet Connection Failed", 
                                     error,
                                     "Please check that the Wylloh service is running",
                                     "and your wallet is accessible.")
        except Exception as e:
            error_msg = str(e)
            log(f"Error connecting wallet: {error_msg}", level='error')
            notify("Wallet Error", "Failed to connect. Check logs.", time=5000)
            
            # Show banner again
            self.show_overlay()
    
    def _show_wallet_info(self):
        """Show wallet information dialog"""
        if not self.wallet.is_connected():
            notify("Not Connected", "Wallet is not connected", time=3000)
            return
            
        # Get wallet data
        address = self.wallet.get_address()
        short_address = f"{address[:8]}...{address[-6:]}" if address else "Unknown"
        balance = self.wallet.get_balance()
        tokens = self.wallet.get_owned_tokens()
        token_count = len(tokens)
        
        # Show dialog
        lines = [
            f"Address: {short_address}",
            f"Balance: {balance}",
            f"Owned Tokens: {token_count}",
            "\nPress OK to close"
        ]
        
        xbmcgui.Dialog().textviewer("Wallet Information", "\n".join(lines))


class WalletMonitor(xbmc.Monitor):
    """
    Monitor class for handling wallet connection status and banner
    """
    
    def __init__(self, wallet_connection):
        """Initialize the monitor"""
        super(WalletMonitor, self).__init__()
        self.wallet = wallet_connection
        self.banner = None
        self.monitor_thread = None
        self.stop_thread = threading.Event()
        self.key_monitor_active = False
        self.first_run = True
        self.suspended = False
        
    def start_monitoring(self):
        """Start the monitor thread"""
        if self.monitor_thread and self.monitor_thread.is_alive():
            # Thread already running
            return
        
        # Reset stop flag
        self.stop_thread.clear()
        
        # Create wallet banner
        if not self.banner:
            self.banner = WalletBanner(self.wallet)
        
        # Start thread
        self.monitor_thread = threading.Thread(
            target=self.monitor_worker,
            name="WyllohWalletMonitorThread"
        )
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        
        # Register key handler for W key to connect wallet
        try:
            # Ensure the path exists first
            script_path = os.path.join(xbmcvfs.translatePath(f'special://home/addons/{ADDON_ID}'), 
                                     'resources', 'lib', 'key_monitor_launcher.py')
            
            if os.path.exists(script_path):
                xbmc.executebuiltin(f"RunScript({script_path})")
                self.key_monitor_active = True
                log("Key monitor activated")
            else:
                log(f"Key monitor script not found at: {script_path}", level='error')
        except Exception as e:
            log(f"Error activating key monitor: {str(e)}", level='error')
        
    def monitor_worker(self):
        """Worker thread for managing wallet connection and banner"""
        log("Starting wallet monitor thread")
        
        # Wait a moment before starting auto-connect
        # This gives the system time to stabilize
        if self.first_run:
            self.first_run = False
            if not self.stop_thread.wait(CONNECT_DELAY):
                # Try auto-connect on first run if enabled
                if get_setting('auto_connect') == 'true' and not self.wallet.is_connected():
                    log("Attempting auto-connect on startup")
                    result = self.wallet.auto_connect()
                    
                    if result.get('success'):
                        notify("Wallet Connected", 
                             f"Your wallet is now connected\nAddress: {self.wallet.get_address()[:8]}...",
                             time=3000)
                        log("Auto-connected wallet successfully")
                    else:
                        log(f"Auto-connect failed: {result.get('message')}", level='info')
        
        # Boolean to track banner visibility state
        banner_should_be_visible = False
        last_banner_visibility = False
        
        # Main monitoring loop
        while not self.stop_thread.is_set() and not self.abortRequested():
            try:
                # Only update if not suspended
                if not self.suspended:
                    # Check if home screen and not playing video
                    current_window = xbmc.getInfoLabel('System.CurrentWindow')
                    is_playing = xbmc.Player().isPlayingVideo()
                    
                    # Determine if banner should be visible
                    banner_should_be_visible = (current_window in ['Home', 'home'] and not is_playing)
                    
                    # Only take action if visibility state changed or we need to update status
                    if banner_should_be_visible != last_banner_visibility:
                        # Show/hide banner based on condition
                        if banner_should_be_visible:
                            if self.banner and not self.banner.is_visible:
                                self.banner.show_overlay()
                        else:
                            if self.banner and self.banner.is_visible:
                                self.banner.hide_overlay()
                        
                        # Update tracking variable
                        last_banner_visibility = banner_should_be_visible
                    
                    # Update banner status if visible (even if state didn't change)
                    if self.banner and self.banner.is_visible:
                        self.banner.update_status()
            
            except Exception as e:
                log(f"Error in wallet monitor worker: {str(e)}", level='error')
            
            # Wait for next check or stop signal
            if self.stop_thread.wait(CHECK_INTERVAL):
                break
                
        log("Wallet monitor thread stopped")
    
    def suspend(self):
        """Suspend monitoring temporarily"""
        self.suspended = True
        if self.banner and self.banner.is_visible:
            self.banner.hide_overlay()
    
    def resume(self):
        """Resume monitoring"""
        self.suspended = False
        
    def stop_monitoring(self):
        """Stop the monitor thread"""
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.stop_thread.set()
            self.monitor_thread.join(1.0)  # Wait for thread to finish
            
        # Close banner if exists
        if self.banner:
            try:
                self.banner.hide_overlay()
            except:
                pass
            
    def onSettingsChanged(self):
        """Called when addon settings are changed"""
        pass


def start_wallet_overlay(wallet_connection):
    """
    Start the wallet monitoring
    
    Args:
        wallet_connection: Instance of WalletConnection
    """
    try:
        log("Starting wallet monitor")
        monitor = WalletMonitor(wallet_connection)
        monitor.start_monitoring()
        return monitor
    except Exception as e:
        log(f"Error starting wallet monitor: {str(e)}", level='error')
        return None 