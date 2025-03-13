#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Wylloh IPFS Content Player
This script handles playing content from IPFS by downloading it to a temporary location
and then playing it with the appropriate player.
"""

import sys
import os
import json
import xbmc
import xbmcgui
import xbmcaddon
import xbmcvfs
import time
import urllib.parse
from urllib.parse import parse_qs

# Get addon info
ADDON = xbmcaddon.Addon('resource.wylloh')
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))
ADDON_PROFILE = xbmcvfs.translatePath(ADDON.getAddonInfo('profile'))

# Constants
TEMP_DIR = os.path.join(xbmcvfs.translatePath('special://temp'), 'ipfs-playback')

def log(msg, level=xbmc.LOGINFO):
    """Log message to Kodi log"""
    xbmc.log(f"Wylloh IPFS Player: {msg}", level)

def get_cid_from_url(url):
    """Extract CID from IPFS URL"""
    # Handle ipfs:// URLs
    if url.startswith('ipfs://'):
        return url[7:]
    
    # Handle http(s)://gateway/ipfs/CID URLs
    if '/ipfs/' in url:
        parts = url.split('/ipfs/')
        if len(parts) > 1:
            return parts[1].split('?')[0].split('#')[0]
    
    # Handle direct CIDs
    return url

def get_file_extension(content_type, filename=''):
    """Get file extension based on content type and/or filename"""
    # Try to get extension from filename first
    if filename and '.' in filename:
        return os.path.splitext(filename)[1]
    
    # Map content types to extensions
    content_map = {
        'video/mp4': '.mp4',
        'video/x-matroska': '.mkv',
        'video/webm': '.webm',
        'audio/mpeg': '.mp3',
        'audio/mp4': '.m4a',
        'audio/ogg': '.ogg',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif'
    }
    
    return content_map.get(content_type, '.bin')

def download_content(cid, progress_dialog=None):
    """Download content from IPFS using the Wylloh C++ API"""
    # Create temp directory if it doesn't exist
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR, exist_ok=True)
    
    # Generate a temporary filename
    temp_path = os.path.join(TEMP_DIR, f"{cid}")
    
    # Show progress dialog if not provided
    close_progress = False
    if progress_dialog is None:
        progress_dialog = xbmcgui.DialogProgress()
        progress_dialog.create('Wylloh', f'Loading content from IPFS...\n{cid}')
        close_progress = True
    
    # Call the C++ API to download the content
    # Since we can't directly call C++ from Python, we'll use a JSON-RPC call
    # to a custom Wylloh JSON-RPC method
    
    # Update progress
    progress_dialog.update(10, f'Requesting content...\n{cid}')
    
    # Make JSON-RPC call to Wylloh.GetIPFSContent
    request = {
        'jsonrpc': '2.0',
        'method': 'Wylloh.GetIPFSContent',
        'params': {
            'cid': cid,
            'destination': temp_path
        },
        'id': 1
    }
    
    response_json = xbmc.executeJSONRPC(json.dumps(request))
    response = json.loads(response_json)
    
    # Check for errors
    if 'error' in response:
        error_msg = response['error'].get('message', 'Unknown error')
        log(f"Error downloading content: {error_msg}", xbmc.LOGERROR)
        if close_progress:
            progress_dialog.close()
        return None
    
    # Get result
    result = response.get('result', {})
    success = result.get('success', False)
    file_path = result.get('path', '')
    content_type = result.get('content_type', '')
    
    if not success or not file_path:
        log(f"Failed to download content: {cid}", xbmc.LOGERROR)
        if close_progress:
            progress_dialog.close()
        return None
    
    # Update progress
    progress_dialog.update(100, f'Content loaded successfully')
    
    # Close progress dialog if we created it
    if close_progress:
        time.sleep(1)  # Show "Content loaded" message briefly
        progress_dialog.close()
    
    return {
        'path': file_path,
        'content_type': content_type
    }

def play_content(content_info):
    """Play the downloaded content"""
    if not content_info:
        xbmcgui.Dialog().notification('Wylloh', 'Failed to load content', xbmcgui.NOTIFICATION_ERROR)
        return
    
    file_path = content_info['path']
    content_type = content_info['content_type']
    
    # Create a ListItem with the appropriate info
    item = xbmcgui.ListItem(path=file_path)
    
    # Set content type
    if content_type.startswith('video/'):
        item.setInfo('video', {'Title': os.path.basename(file_path)})
        item.setMimeType(content_type)
    elif content_type.startswith('audio/'):
        item.setInfo('music', {'Title': os.path.basename(file_path)})
        item.setMimeType(content_type)
    elif content_type.startswith('image/'):
        item.setInfo('pictures', {'Title': os.path.basename(file_path)})
        item.setMimeType(content_type)
    
    # Play the content
    xbmc.Player().play(file_path, item)

def main():
    # Get CID from arguments
    if len(sys.argv) < 2:
        log("No CID provided", xbmc.LOGERROR)
        xbmcgui.Dialog().notification('Wylloh', 'No content ID provided', xbmcgui.NOTIFICATION_ERROR)
        return
    
    # Parse arguments
    args = sys.argv[1]
    params = parse_qs(args.lstrip('?'))
    
    # Get CID
    cid = params.get('cid', [''])[0]
    if not cid:
        # Try to get from URL
        url = params.get('url', [''])[0]
        if url:
            cid = get_cid_from_url(url)
    
    if not cid:
        log("No valid CID found in arguments", xbmc.LOGERROR)
        xbmcgui.Dialog().notification('Wylloh', 'No valid content ID provided', xbmcgui.NOTIFICATION_ERROR)
        return
    
    # Download content
    content_info = download_content(cid)
    
    # Play content
    if content_info:
        play_content(content_info)
    else:
        xbmcgui.Dialog().notification('Wylloh', 'Failed to load content', xbmcgui.NOTIFICATION_ERROR)

if __name__ == '__main__':
    main() 