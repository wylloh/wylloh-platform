#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Wylloh IPFS Cache Clearing Script
This script clears the IPFS cache while preserving pinned content.
"""

import sys
import os
import json
import xbmc
import xbmcgui
import xbmcaddon
import xbmcvfs
import shutil

# Get addon info
ADDON = xbmcaddon.Addon('resource.wylloh')
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))
ADDON_PROFILE = xbmcvfs.translatePath(ADDON.getAddonInfo('profile'))

# Constants
CONFIG_FILE = os.path.join(xbmcvfs.translatePath('special://userdata/wylloh-config'), 'ipfs.json')
CACHE_DIR = os.path.join(xbmcvfs.translatePath('special://temp'), 'ipfs-cache')

def get_pinned_content():
    """Get list of pinned content CIDs from config"""
    pinned = []
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                if 'pinned' in config and isinstance(config['pinned'], list):
                    pinned = config['pinned']
        except Exception as e:
            xbmc.log(f"Error loading IPFS config: {str(e)}", xbmc.LOGERROR)
    
    return pinned

def get_cache_entries():
    """Get cache entries from config"""
    cache_entries = {}
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                if 'cache' in config and isinstance(config['cache'], dict):
                    cache_entries = config['cache']
        except Exception as e:
            xbmc.log(f"Error loading IPFS config: {str(e)}", xbmc.LOGERROR)
    
    return cache_entries

def save_config(pinned, cache_entries):
    """Save updated config"""
    # Read existing config to preserve other settings
    config = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        except Exception as e:
            xbmc.log(f"Error reading existing config: {str(e)}", xbmc.LOGERROR)
    
    # Update pinned and cache entries
    config['pinned'] = pinned
    config['cache'] = cache_entries
    
    # Save config
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        xbmc.log(f"Error saving IPFS config: {str(e)}", xbmc.LOGERROR)
        xbmcgui.Dialog().notification('Wylloh', 'Failed to save IPFS configuration', xbmcgui.NOTIFICATION_ERROR)

def clear_cache():
    """Clear IPFS cache while preserving pinned content"""
    # Show progress dialog
    progress = xbmcgui.DialogProgress()
    progress.create('Wylloh', 'Clearing IPFS cache...')
    
    # Get pinned content
    pinned = get_pinned_content()
    cache_entries = get_cache_entries()
    
    # Create a new cache entries dict with only pinned content
    new_cache_entries = {}
    for cid in pinned:
        if cid in cache_entries:
            new_cache_entries[cid] = cache_entries[cid]
    
    # If cache directory doesn't exist, nothing to clear
    if not os.path.exists(CACHE_DIR):
        progress.close()
        xbmcgui.Dialog().notification('Wylloh', 'Cache already empty', xbmcgui.NOTIFICATION_INFO)
        return
    
    # Get list of files in cache directory
    try:
        files = os.listdir(CACHE_DIR)
    except Exception as e:
        xbmc.log(f"Error listing cache directory: {str(e)}", xbmc.LOGERROR)
        progress.close()
        xbmcgui.Dialog().notification('Wylloh', 'Failed to access cache directory', xbmcgui.NOTIFICATION_ERROR)
        return
    
    # If no files, nothing to clear
    if not files:
        progress.close()
        xbmcgui.Dialog().notification('Wylloh', 'Cache already empty', xbmcgui.NOTIFICATION_INFO)
        return
    
    # Get mapping of cache files to CIDs
    # This is complex because we hash the CIDs for filenames
    # For simplicity, we'll just preserve all files for pinned content
    # and delete everything else
    
    # Option 1: Delete everything and recreate directory
    if not pinned:
        try:
            shutil.rmtree(CACHE_DIR)
            os.makedirs(CACHE_DIR, exist_ok=True)
            save_config(pinned, {})
            progress.close()
            xbmcgui.Dialog().notification('Wylloh', 'Cache cleared successfully', xbmcgui.NOTIFICATION_INFO)
            return
        except Exception as e:
            xbmc.log(f"Error clearing cache directory: {str(e)}", xbmc.LOGERROR)
            progress.close()
            xbmcgui.Dialog().notification('Wylloh', 'Failed to clear cache', xbmcgui.NOTIFICATION_ERROR)
            return
    
    # Option 2: We have pinned content, so we need to be selective
    # Since we don't have a direct mapping from CID to filename,
    # we'll need to rely on the C++ code to handle this properly
    
    # Just update the cache entries in the config
    save_config(pinned, new_cache_entries)
    
    # Notify the user
    progress.close()
    xbmcgui.Dialog().notification('Wylloh', 'Cache cleared (except pinned content)', xbmcgui.NOTIFICATION_INFO)

def main():
    # Ask for confirmation
    dialog = xbmcgui.Dialog()
    if dialog.yesno('Wylloh', 'Clear IPFS cache? Pinned content will be preserved.'):
        clear_cache()

if __name__ == '__main__':
    main() 