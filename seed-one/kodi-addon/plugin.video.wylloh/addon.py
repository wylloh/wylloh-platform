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
import routing
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
    
    # Check if wallet is connected
    if not wallet.is_connected():
        # Show wallet connection prompt
        if xbmcgui.Dialog().yesno(ADDON_NAME, 'Would you like to connect your wallet to access your licensed content?'):
            connect_wallet()
    
    # Add main menu items
    for key, item in MENU_ITEMS.items():
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


@plugin.route('/my_content')
def my_content():
    """Display user's owned content"""
    log('Displaying my content')
    
    # Check if wallet is connected
    if not wallet.is_connected():
        notify('Wallet not connected', 'Please connect your wallet to view your content')
        return
    
    # Get owned tokens
    try:
        tokens = wallet.get_owned_tokens()
        
        if not tokens:
            # No tokens found
            list_item = xbmcgui.ListItem(label='No content found')
            xbmcplugin.addDirectoryItem(plugin.handle, '', list_item, False)
            xbmcplugin.endOfDirectory(plugin.handle)
            return
        
        # Get content details for each token
        for token in tokens:
            content = api.get_content_by_token(token['id'])
            
            if content:
                list_item = xbmcgui.ListItem(label=content['title'])
                
                # Set artwork
                if 'thumbnailUrl' in content:
                    list_item.setArt({
                        'thumb': content['thumbnailUrl'],
                        'fanart': content.get('imageUrl', content['thumbnailUrl'])
                    })
                
                # Set info
                info = {
                    'title': content['title'],
                    'plot': content['description'],
                    'genre': content.get('contentType', 'Movie'),
                    'year': content.get('releaseYear'),
                    'duration': content.get('duration', 0)
                }
                list_item.setInfo('video', info)
                
                # Set is playable
                list_item.setProperty('IsPlayable', 'true')
                
                # Add context menu
                list_item.addContextMenuItems([
                    ('View Details', 'RunPlugin({0})'.format(
                        plugin.url_for(content_details, content_id=content['id'])
                    ))
                ])
                
                # Add to directory
                url = plugin.url_for(play, content_id=content['id'], token_id=token['id'])
                xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, False)
        
        # Finish directory listing
        xbmcplugin.addSortMethod(plugin.handle, xbmcplugin.SORT_METHOD_LABEL)
        xbmcplugin.endOfDirectory(plugin.handle)
            
    except Exception as e:
        log('Error fetching content: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to retrieve your content')
        xbmcplugin.endOfDirectory(plugin.handle, succeeded=False)


@plugin.route('/marketplace')
def marketplace():
    """Browse content marketplace"""
    log('Displaying marketplace')
    
    try:
        # Get marketplace categories
        categories = api.get_content_categories()
        
        # Add "All Content" category
        list_item = xbmcgui.ListItem(label='All Content')
        url = plugin.url_for(content_list, category='all')
        xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, True)
        
        # Add categories
        for category in categories:
            list_item = xbmcgui.ListItem(label=category['name'])
            if 'iconUrl' in category:
                list_item.setArt({'icon': category['iconUrl']})
            
            url = plugin.url_for(content_list, category=category['id'])
            xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, True)
        
        # Finish directory listing
        xbmcplugin.endOfDirectory(plugin.handle)
        
    except Exception as e:
        log('Error fetching marketplace categories: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to retrieve marketplace categories')
        xbmcplugin.endOfDirectory(plugin.handle, succeeded=False)


@plugin.route('/content_list/<category>')
def content_list(category):
    """Display content list by category"""
    log('Displaying content list for category: {0}'.format(category))
    
    try:
        # Get content list
        content_items = api.get_content_list(category)
        
        if not content_items:
            # No content found
            list_item = xbmcgui.ListItem(label='No content found')
            xbmcplugin.addDirectoryItem(plugin.handle, '', list_item, False)
            xbmcplugin.endOfDirectory(plugin.handle)
            return
        
        # Display content items
        for item in content_items:
            list_item = xbmcgui.ListItem(label=item['title'])
            
            # Set artwork
            if 'thumbnailUrl' in item:
                list_item.setArt({
                    'thumb': item['thumbnailUrl'],
                    'fanart': item.get('imageUrl', item['thumbnailUrl'])
                })
            
            # Set info
            info = {
                'title': item['title'],
                'plot': item['description'],
                'genre': item.get('contentType', 'Movie'),
                'year': item.get('releaseYear'),
                'duration': item.get('duration', 0)
            }
            list_item.setInfo('video', info)
            
            # Add context menu
            list_item.addContextMenuItems([
                ('View Details', 'RunPlugin({0})'.format(
                    plugin.url_for(content_details, content_id=item['id'])
                ))
            ])
            
            # Add to directory - not directly playable, go to details page
            url = plugin.url_for(content_details, content_id=item['id'])
            xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, True)
        
        # Finish directory listing
        xbmcplugin.addSortMethod(plugin.handle, xbmcplugin.SORT_METHOD_LABEL)
        xbmcplugin.endOfDirectory(plugin.handle)
        
    except Exception as e:
        log('Error fetching content list: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to retrieve content list')
        xbmcplugin.endOfDirectory(plugin.handle, succeeded=False)


@plugin.route('/content_details/<content_id>')
def content_details(content_id):
    """Display content details"""
    log('Displaying content details for ID: {0}'.format(content_id))
    
    try:
        # Get content details
        content = api.get_content_details(content_id)
        
        if not content:
            notify('Error', 'Content not found')
            return
        
        # Create dialog
        dialog = xbmcgui.Dialog()
        
        # Format details for display
        details = [
            '{0}: {1}'.format('Title', content['title']),
            '{0}: {1}'.format('Type', content.get('contentType', 'Movie')),
            '{0}: {1}'.format('Creator', content.get('creator', 'Unknown')),
            '{0}: {1}'.format('Description', content['description']),
        ]
        
        if 'releaseYear' in content:
            details.append('{0}: {1}'.format('Year', content['releaseYear']))
            
        if 'duration' in content:
            details.append('{0}: {1}'.format('Duration', content['duration']))
            
        # Show details dialog
        dialog.textviewer('Content Details', '\n\n'.join(details))
        
        # Check if user owns this content
        if wallet.is_connected():
            has_token = wallet.has_token_for_content(content_id)
            
            if has_token:
                # User owns this content, ask if they want to play it
                if dialog.yesno('Content Owned', 'You own this content. Would you like to play it?'):
                    # Get token id for this content
                    token_id = wallet.get_token_id_for_content(content_id)
                    if token_id:
                        plugin.redirect(plugin.url_for(play, content_id=content_id, token_id=token_id))
            else:
                # User doesn't own this content, ask if they want to purchase
                if dialog.yesno('Purchase Content', 'Would you like to purchase this content?\nPrice: {0} MATIC'.format(content.get('price', '0.01'))):
                    result = wallet.purchase_token(content_id)
                    if result.get('success'):
                        dialog.ok('Purchase Successful', 'Content purchased successfully. You can now access it from your library.')
                    else:
                        dialog.ok('Purchase Failed', result.get('message', 'Unknown error occurred'))
        else:
            # Wallet not connected
            if dialog.yesno('Wallet Required', 'You need to connect your wallet to purchase or play this content. Would you like to connect now?'):
                connect_wallet()
        
    except Exception as e:
        log('Error displaying content details: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to display content details')


@plugin.route('/play/<content_id>/<token_id>')
def play(content_id, token_id):
    """Play content"""
    log('Playing content ID: {0} with token ID: {1}'.format(content_id, token_id))
    
    try:
        # Verify token ownership
        if not wallet.has_token(token_id):
            notify('Error', 'You do not own this content')
            return
        
        # Get content details and stream URL
        content = api.get_content_details(content_id)
        stream_url = api.get_stream_url(content_id, token_id)
        
        if not stream_url:
            notify('Error', 'Failed to get stream URL')
            return
        
        # Create list item for playback
        list_item = xbmcgui.ListItem(label=content['title'], path=stream_url)
        
        # Set artwork
        if 'thumbnailUrl' in content:
            list_item.setArt({
                'thumb': content['thumbnailUrl'],
                'fanart': content.get('imageUrl', content['thumbnailUrl'])
            })
        
        # Set info
        info = {
            'title': content['title'],
            'plot': content['description'],
            'genre': content.get('contentType', 'Movie'),
            'year': content.get('releaseYear'),
            'duration': content.get('duration', 0)
        }
        list_item.setInfo('video', info)
        
        # Set content type
        xbmcplugin.setContent(plugin.handle, 'movies')
        
        # Start playback
        xbmcplugin.setResolvedUrl(plugin.handle, True, listitem=list_item)
        
        # Register custom player to handle DRM and license verification
        player.play_content(content_id, token_id, stream_url)
        
    except Exception as e:
        log('Error playing content: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to play content')
        xbmcplugin.setResolvedUrl(plugin.handle, False, xbmcgui.ListItem())


@plugin.route('/search')
def search():
    """Search for content"""
    log('Displaying search interface')
    
    dialog = xbmcgui.Dialog()
    search_term = dialog.input('Search Content', type=xbmcgui.INPUT_ALPHANUM)
    
    if not search_term:
        # User cancelled search
        return
    
    try:
        # Search for content
        results = api.search_content(search_term)
        
        if not results:
            # No results found
            list_item = xbmcgui.ListItem(label='No results found')
            xbmcplugin.addDirectoryItem(plugin.handle, '', list_item, False)
            xbmcplugin.endOfDirectory(plugin.handle)
            return
        
        # Display search results
        for item in results:
            list_item = xbmcgui.ListItem(label=item['title'])
            
            # Set artwork
            if 'thumbnailUrl' in item:
                list_item.setArt({
                    'thumb': item['thumbnailUrl'],
                    'fanart': item.get('imageUrl', item['thumbnailUrl'])
                })
            
            # Set info
            info = {
                'title': item['title'],
                'plot': item['description'],
                'genre': item.get('contentType', 'Movie'),
                'year': item.get('releaseYear'),
                'duration': item.get('duration', 0)
            }
            list_item.setInfo('video', info)
            
            # Add context menu
            list_item.addContextMenuItems([
                ('View Details', 'RunPlugin({0})'.format(
                    plugin.url_for(content_details, content_id=item['id'])
                ))
            ])
            
            # Add to directory - go to details page
            url = plugin.url_for(content_details, content_id=item['id'])
            xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, True)
        
        # Finish directory listing
        xbmcplugin.addSortMethod(plugin.handle, xbmcplugin.SORT_METHOD_LABEL)
        xbmcplugin.endOfDirectory(plugin.handle)
        
    except Exception as e:
        log('Error searching content: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to search content')
        xbmcplugin.endOfDirectory(plugin.handle, succeeded=False)


@plugin.route('/wallet')
def wallet():
    """Wallet management"""
    log('Displaying wallet management')
    
    # Create wallet menu items
    
    # Connect/Disconnect Wallet
    if wallet.is_connected():
        list_item = xbmcgui.ListItem(label='Disconnect Wallet')
        url = plugin.url_for(disconnect_wallet)
        xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, False)
        
        # Wallet Address
        address = wallet.get_address()
        list_item = xbmcgui.ListItem(label='Wallet Address: {0}...{1}'.format(
            address[:8], address[-6:]))
        xbmcplugin.addDirectoryItem(plugin.handle, '', list_item, False)
        
        # Wallet Balance
        balance = wallet.get_balance()
        list_item = xbmcgui.ListItem(label='Balance: {0} MATIC'.format(balance))
        xbmcplugin.addDirectoryItem(plugin.handle, '', list_item, False)
        
        # View Tokens
        list_item = xbmcgui.ListItem(label='View Tokens')
        url = plugin.url_for(view_tokens)
        xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, True)
        
        # Refresh Wallet
        list_item = xbmcgui.ListItem(label='Refresh Wallet')
        url = plugin.url_for(refresh_wallet)
        xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, False)
    else:
        list_item = xbmcgui.ListItem(label='Connect Wallet')
        url = plugin.url_for(connect_wallet)
        xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, False)
        
        # Import Wallet
        list_item = xbmcgui.ListItem(label='Import Wallet')
        url = plugin.url_for(import_wallet)
        xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, False)
    
    # Finish directory listing
    xbmcplugin.endOfDirectory(plugin.handle)


@plugin.route('/connect_wallet')
def connect_wallet():
    """Connect to wallet"""
    log('Connecting wallet')
    
    try:
        result = wallet.connect()
        
        if result.get('success'):
            address = result.get('address', '')
            notify('Wallet Connected', 'Address: {0}...{1}'.format(address[:8], address[-6:]))
            
            # Refresh screen
            xbmc.executebuiltin('Container.Refresh')
        else:
            notify('Connection Failed', result.get('message', 'Unknown error occurred'))
            
    except Exception as e:
        log('Error connecting wallet: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to connect wallet')


@plugin.route('/import_wallet')
def import_wallet():
    """Import wallet from private key"""
    log('Importing wallet')
    
    dialog = xbmcgui.Dialog()
    private_key = dialog.input('Enter your private key (0x...)', type=xbmcgui.INPUT_ALPHANUM)
    
    if not private_key:
        # User cancelled import
        return
    
    try:
        result = wallet.import_wallet(private_key)
        
        if result.get('success'):
            address = result.get('address', '')
            notify('Wallet Imported', 'Address: {0}...{1}'.format(address[:8], address[-6:]))
            
            # Clear private key from input history for security
            dialog.input('', type=xbmcgui.INPUT_ALPHANUM)
            
            # Refresh screen
            xbmc.executebuiltin('Container.Refresh')
        else:
            notify('Import Failed', result.get('message', 'Unknown error occurred'))
            
    except Exception as e:
        log('Error importing wallet: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to import wallet')


@plugin.route('/disconnect_wallet')
def disconnect_wallet():
    """Disconnect wallet"""
    log('Disconnecting wallet')
    
    try:
        result = wallet.disconnect()
        
        if result.get('success'):
            notify('Wallet Disconnected', 'Wallet has been disconnected')
            
            # Refresh screen
            xbmc.executebuiltin('Container.Refresh')
        else:
            notify('Disconnection Failed', result.get('message', 'Unknown error occurred'))
            
    except Exception as e:
        log('Error disconnecting wallet: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to disconnect wallet')


@plugin.route('/refresh_wallet')
def refresh_wallet():
    """Refresh wallet data"""
    log('Refreshing wallet')
    
    try:
        result = wallet.refresh()
        
        if result.get('success'):
            notify('Wallet Refreshed', 'Wallet data has been updated')
            
            # Refresh screen
            xbmc.executebuiltin('Container.Refresh')
        else:
            notify('Refresh Failed', result.get('message', 'Unknown error occurred'))
            
    except Exception as e:
        log('Error refreshing wallet: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to refresh wallet')


@plugin.route('/view_tokens')
def view_tokens():
    """View owned tokens"""
    log('Viewing tokens')
    
    # Check if wallet is connected
    if not wallet.is_connected():
        notify('Wallet not connected', 'Please connect your wallet to view your tokens')
        return
    
    try:
        # Get owned tokens
        tokens = wallet.get_owned_tokens()
        
        if not tokens:
            # No tokens found
            list_item = xbmcgui.ListItem(label='No tokens found')
            xbmcplugin.addDirectoryItem(plugin.handle, '', list_item, False)
            xbmcplugin.endOfDirectory(plugin.handle)
            return
        
        # Group tokens by content
        token_groups = {}
        for token in tokens:
            content_id = token.get('contentId', 'unknown')
            if content_id not in token_groups:
                token_groups[content_id] = {
                    'content': api.get_content_by_token(token['id']),
                    'tokens': []
                }
            token_groups[content_id]['tokens'].append(token)
        
        # Display token groups
        for content_id, group in token_groups.items():
            content = group['content']
            token_count = len(group['tokens'])
            
            if content:
                list_item = xbmcgui.ListItem(label='{0} ({1} tokens)'.format(content['title'], token_count))
                
                # Set artwork
                if 'thumbnailUrl' in content:
                    list_item.setArt({
                        'thumb': content['thumbnailUrl'],
                        'fanart': content.get('imageUrl', content['thumbnailUrl'])
                    })
                
                # Set info
                info = {
                    'title': content['title'],
                    'plot': content['description'],
                    'genre': content.get('contentType', 'Movie')
                }
                list_item.setInfo('video', info)
                
                # Add context menu
                list_item.addContextMenuItems([
                    ('View Details', 'RunPlugin({0})'.format(
                        plugin.url_for(content_details, content_id=content['id'])
                    )),
                    ('Play Content', 'RunPlugin({0})'.format(
                        plugin.url_for(play, content_id=content['id'], token_id=group['tokens'][0]['id'])
                    ))
                ])
                
                # Add to directory
                url = plugin.url_for(token_details, content_id=content['id'])
                xbmcplugin.addDirectoryItem(plugin.handle, url, list_item, True)
        
        # Finish directory listing
        xbmcplugin.addSortMethod(plugin.handle, xbmcplugin.SORT_METHOD_LABEL)
        xbmcplugin.endOfDirectory(plugin.handle)
            
    except Exception as e:
        log('Error viewing tokens: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to view tokens')
        xbmcplugin.endOfDirectory(plugin.handle, succeeded=False)


@plugin.route('/token_details/<content_id>')
def token_details(content_id):
    """View details for tokens related to specific content"""
    log('Viewing token details for content ID: {0}'.format(content_id))
    
    try:
        # Get content details
        content = api.get_content_details(content_id)
        
        if not content:
            notify('Error', 'Content not found')
            return
        
        # Get tokens for this content
        tokens = wallet.get_tokens_for_content(content_id)
        
        if not tokens:
            notify('Error', 'No tokens found for this content')
            return
        
        # Display token details in dialog
        dialog = xbmcgui.Dialog()
        
        token_info = []
        for i, token in enumerate(tokens):
            token_info.append('Token #{0}:'.format(i+1))
            token_info.append('- ID: {0}'.format(token['id']))
            token_info.append('- Contract: {0}...{1}'.format(token['contract'][:8], token['contract'][-6:]))
            token_info.append('- Rights: {0}'.format(token.get('rightsLevel', 'Basic')))
            token_info.append('')
        
        dialog.textviewer('Tokens for {0}'.format(content['title']), '\n'.join(token_info))
        
    except Exception as e:
        log('Error viewing token details: {0}'.format(str(e)), xbmc.LOGERROR)
        notify('Error', 'Failed to view token details')


@plugin.route('/settings')
def settings():
    """Open addon settings"""
    log('Opening settings')
    ADDON.openSettings()
    # Refresh screen after settings are closed
    xbmc.executebuiltin('Container.Refresh')


def run():
    """Run the addon"""
    plugin.run()


if __name__ == '__main__':
    run()