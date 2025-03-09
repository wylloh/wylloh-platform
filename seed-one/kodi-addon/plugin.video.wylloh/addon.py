#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Wylloh Addon for Kodi
A blockchain-based media licensing platform with token verification
"""

import sys
import os
import json
import xbmc
import xbmcgui
import xbmcplugin
import xbmcaddon
from resources.lib import routing
from urllib.parse import urlencode, parse_qsl

# Import internal modules
from resources.lib.api import WyllohAPI
from resources.lib.wallet import WalletConnection
from resources.lib.player import WyllohPlayer
from resources.lib.cache import Cache
from resources.lib.utils import log, notify, get_setting, set_setting

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_NAME = ADDON.getAddonInfo('name')
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_PATH = ADDON.getAddonInfo('path')
ADDON_VERSION = ADDON.getAddonInfo('version')

# Initialize routing plugin
plugin = routing.Plugin()

# Initialize API client
api = WyllohAPI()

# Initialize wallet connection
wallet = WalletConnection()

# Initialize cache
cache = Cache()

# Initialize player
player = WyllohPlayer()

# Main menu items
MENU_ITEMS = {
    'connect_wallet': {'label': 'Connect Wallet [IMPORTANT]', 'icon': 'wallet.png'},
    'my_content': {'label': 'My Content', 'icon': 'myContent.png'},
    'marketplace': {'label': 'Browse Marketplace', 'icon': 'marketplace.png'},
    'search': {'label': 'Search', 'icon': 'search.png'},
    'wallet': {'label': 'Wallet & Tokens', 'icon': 'wallet.png'},
    'settings': {'label': 'Settings', 'icon': 'settings.png'}
}


@plugin.route('/')
def index():
    """Main menu"""
    log('Displaying main menu')
    
    # Add wallet status item at the top
    if wallet.is_connected():
        wallet_status_item = xbmcgui.ListItem(label='[COLOR green]Wallet Connected[/COLOR] - Click to disconnect')
        wallet_status_item.setArt({'icon': os.path.join(ADDON_PATH, 'resources', 'media', 'wallet.png')})
        wallet_status_url = plugin.url_for(disconnect_wallet)
        xbmcplugin.addDirectoryItem(plugin.handle, wallet_status_url, wallet_status_item, False)
    else:
        wallet_status_item = xbmcgui.ListItem(label='[COLOR red]Wallet Not Connected[/COLOR] - Click to connect')
        wallet_status_item.setArt({'icon': os.path.join(ADDON_PATH, 'resources', 'media', 'wallet.png')})
        wallet_status_url = plugin.url_for(connect_wallet)
        xbmcplugin.addDirectoryItem(plugin.handle, wallet_status_url, wallet_status_item, False)
    
    # Add main menu items
    for key, item in MENU_ITEMS.items():
        # Skip connect_wallet item if already connected
        if key == 'connect_wallet' and wallet.is_connected():
            continue
            
        list_item = xbmcgui.ListItem(label=item['label'])
        list_item.setArt({'icon': os.path.join(ADDON_PATH, 'resources', 'media', item['icon'])})
        
        # Add context menu items
        context_menu_items = []
        if key == 'wallet':
            context_menu_items.append(
                ('View Tokens', 'RunPlugin({0})'.format(plugin.url_for(view_tokens)))
            )
        list_item.addContextMenuItems(context_menu_items)
        
        # Add directory item
        url = plugin.url_for(globals()[key])
        xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, True)
    
    # Finish directory listing
    xbmcplugin.endOfDirectory(plugin.handle) 