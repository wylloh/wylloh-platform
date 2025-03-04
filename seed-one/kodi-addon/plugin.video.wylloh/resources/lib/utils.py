#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Utility functions for Wylloh Kodi Addon
"""

import xbmc
import xbmcgui
import xbmcaddon

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_NAME = ADDON.getAddonInfo('name')

# Log levels
LOG_LEVELS = {
    'debug': xbmc.LOGDEBUG,
    'info': xbmc.LOGINFO,
    'notice': xbmc.LOGNOTICE if hasattr(xbmc, 'LOGNOTICE') else xbmc.LOGINFO,
    'warning': xbmc.LOGWARNING,
    'error': xbmc.LOGERROR,
    'severe': xbmc.LOGSEVERE if hasattr(xbmc, 'LOGSEVERE') else xbmc.LOGERROR,
    'fatal': xbmc.LOGFATAL if hasattr(xbmc, 'LOGFATAL') else xbmc.LOGERROR
}


def log(message, level='debug'):
    """
    Log a message to the Kodi log file
    
    Args:
        message (str): Message to log
        level (str): Log level (debug, info, notice, warning, error, severe, fatal)
    """
    log_level = LOG_LEVELS.get(level.lower(), xbmc.LOGDEBUG)
    xbmc.log(f"[{ADDON_ID}] {message}", level=log_level)


def notify(heading, message, icon='default', time=5000, sound=True):
    """
    Show a notification to the user
    
    Args:
        heading (str): Notification heading
        message (str): Notification message
        icon (str): Icon to display ('default', 'info', 'warning', 'error')
        time (int): Time to display notification in milliseconds
        sound (bool): Whether to play a sound
    """
    # Determine icon path
    if icon == 'info':
        icon_path = xbmcgui.NOTIFICATION_INFO
    elif icon == 'warning':
        icon_path = xbmcgui.NOTIFICATION_WARNING
    elif icon == 'error':
        icon_path = xbmcgui.NOTIFICATION_ERROR
    else:
        icon_path = ADDON.getAddonInfo('icon')
    
    # Show notification
    xbmcgui.Dialog().notification(heading, message, icon_path, time, sound)


def get_setting(setting_id):
    """
    Get an addon setting
    
    Args:
        setting_id (str): Setting ID
    
    Returns:
        The setting value
    """
    return ADDON.getSetting(setting_id)


def set_setting(setting_id, value):
    """
    Set an addon setting
    
    Args:
        setting_id (str): Setting ID
        value (any): Setting value
    """
    ADDON.setSetting(setting_id, str(value))


def format_bytes(size):
    """
    Format bytes to human-readable size
    
    Args:
        size (int): Size in bytes
    
    Returns:
        Formatted size string
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}" if unit != 'B' else f"{size} {unit}"
        size /= 1024.0
    return f"{size:.2f} PB"


def format_duration(seconds):
    """
    Format duration in seconds to human-readable time
    
    Args:
        seconds (int): Duration in seconds
    
    Returns:
        Formatted duration string (HH:MM:SS)
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


def extract_cid_from_ipfs_uri(uri):
    """
    Extract the CID from an IPFS URI
    
    Args:
        uri (str): IPFS URI (ipfs://CID)
    
    Returns:
        CID if found, otherwise None
    """
    if not uri:
        return None
        
    if uri.startswith('ipfs://'):
        return uri[7:]  # Remove 'ipfs://' prefix
    elif uri.startswith('http') and '/ipfs/' in uri:
        # Handle HTTP gateway URLs
        parts = uri.split('/ipfs/')
        if len(parts) > 1:
            cid_part = parts[1].split('?')[0]  # Remove query parameters
            return cid_part
    
    return None


def get_ipfs_gateway_url(cid, gateway=None):
    """
    Get a full IPFS gateway URL for a CID
    
    Args:
        cid (str): IPFS Content Identifier
        gateway (str, optional): Gateway URL (without trailing slash)
    
    Returns:
        Full gateway URL
    """
    if not cid:
        return None
    
    # Remove 'ipfs://' prefix if present
    if cid.startswith('ipfs://'):
        cid = cid[7:]
    
    # Use specified gateway or get from settings
    if not gateway:
        gateway = get_setting('gateway_url') or 'https://gateway.wylloh.com/ipfs'
    
    # Ensure gateway doesn't have trailing slash
    gateway = gateway.rstrip('/')
    
    # Combine gateway and CID
    return f"{gateway}/{cid}"


def parse_token_rights(token_data):
    """
    Parse token rights information into human-readable format
    
    Args:
        token_data (dict): Token data including rights information
    
    Returns:
        List of rights strings
    """
    rights = []
    
    try:
        # Basic viewing right is always included
        rights.append("Personal Viewing")
        
        # Get additional rights based on token data
        if token_data.get('rightsLevel') == 'commercial':
            rights.append("Commercial Use")
        if token_data.get('rightsLevel') == 'distribution':
            rights.append("Distribution Rights")
        
        # Handle specific rights types
        if token_data.get('publicScreening'):
            rights.append("Public Screening")
        if token_data.get('streaming'):
            rights.append("Streaming Rights")
        if token_data.get('remix'):
            rights.append("Remix Rights")
    except Exception as e:
        log(f"Error parsing token rights: {str(e)}", level='error')
    
    return rights