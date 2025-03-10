#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Wylloh IPFS Gateway Management Script
This script allows users to add, remove, and test IPFS gateways.
"""

import sys
import os
import json
import xbmc
import xbmcgui
import xbmcaddon
import xbmcvfs
import requests
from urllib.parse import urlparse

# Get addon info
ADDON = xbmcaddon.Addon('resource.wylloh')
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))
ADDON_PROFILE = xbmcvfs.translatePath(ADDON.getAddonInfo('profile'))

# Constants
CONFIG_FILE = os.path.join(xbmcvfs.translatePath('special://userdata/wylloh-config'), 'ipfs.json')
TEST_CID = 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A'  # Small test file
TIMEOUT = 5  # Timeout in seconds for gateway tests

# Localized strings
def get_localized_string(string_id):
    return ADDON.getLocalizedString(string_id)

class GatewayManager:
    def __init__(self):
        self.gateways = []
        self.load_config()
    
    def load_config(self):
        """Load gateway configuration from file"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    if 'gateways' in config and isinstance(config['gateways'], list):
                        self.gateways = config['gateways']
            except Exception as e:
                xbmc.log(f"Error loading gateway config: {str(e)}", xbmc.LOGERROR)
                self.gateways = []
        
        # Ensure we have at least the default gateways
        default_gateways = [
            "https://ipfs.io/ipfs/",
            "https://gateway.ipfs.io/ipfs/",
            "https://dweb.link/ipfs/"
        ]
        
        for gateway in default_gateways:
            if gateway not in self.gateways:
                self.gateways.append(gateway)
    
    def save_config(self):
        """Save gateway configuration to file"""
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        
        # Read existing config to preserve other settings
        config = {}
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
            except Exception as e:
                xbmc.log(f"Error reading existing config: {str(e)}", xbmc.LOGERROR)
        
        # Update gateways
        config['gateways'] = self.gateways
        
        # Save config
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            xbmc.log(f"Error saving gateway config: {str(e)}", xbmc.LOGERROR)
            xbmcgui.Dialog().notification('Wylloh', 'Failed to save gateway configuration', xbmcgui.NOTIFICATION_ERROR)
    
    def add_gateway(self, gateway):
        """Add a new gateway to the list"""
        # Normalize gateway URL
        if not gateway.endswith('/'):
            gateway += '/'
        
        # Validate URL format
        try:
            result = urlparse(gateway)
            if not all([result.scheme, result.netloc]):
                xbmcgui.Dialog().ok('Wylloh', 'Invalid gateway URL. Please include http:// or https://')
                return False
        except Exception:
            xbmcgui.Dialog().ok('Wylloh', 'Invalid gateway URL format')
            return False
        
        # Check if gateway already exists
        if gateway in self.gateways:
            xbmcgui.Dialog().ok('Wylloh', f'Gateway {gateway} already exists')
            return False
        
        # Add gateway
        self.gateways.append(gateway)
        self.save_config()
        return True
    
    def remove_gateway(self, gateway):
        """Remove a gateway from the list"""
        if gateway in self.gateways:
            self.gateways.remove(gateway)
            self.save_config()
            return True
        return False
    
    def test_gateway(self, gateway):
        """Test if a gateway is working by fetching a test CID"""
        url = f"{gateway}{TEST_CID}"
        
        # Show progress dialog
        progress = xbmcgui.DialogProgress()
        progress.create('Wylloh', f'Testing gateway: {gateway}')
        
        try:
            response = requests.get(url, timeout=TIMEOUT)
            progress.close()
            
            if response.status_code == 200:
                xbmcgui.Dialog().ok('Wylloh', f'Gateway {gateway} is working!')
                return True
            else:
                xbmcgui.Dialog().ok('Wylloh', f'Gateway {gateway} returned status code {response.status_code}')
                return False
        except requests.exceptions.Timeout:
            progress.close()
            xbmcgui.Dialog().ok('Wylloh', f'Gateway {gateway} timed out')
            return False
        except Exception as e:
            progress.close()
            xbmcgui.Dialog().ok('Wylloh', f'Error testing gateway {gateway}: {str(e)}')
            return False
    
    def test_all_gateways(self):
        """Test all gateways and report results"""
        results = []
        
        # Show progress dialog
        progress = xbmcgui.DialogProgress()
        progress.create('Wylloh', 'Testing all gateways...')
        
        for i, gateway in enumerate(self.gateways):
            if progress.iscanceled():
                break
            
            progress.update(int((i / len(self.gateways)) * 100), f'Testing gateway: {gateway}')
            
            url = f"{gateway}{TEST_CID}"
            try:
                response = requests.get(url, timeout=TIMEOUT)
                if response.status_code == 200:
                    results.append((gateway, True, f"OK ({response.status_code})"))
                else:
                    results.append((gateway, False, f"Failed ({response.status_code})"))
            except requests.exceptions.Timeout:
                results.append((gateway, False, "Timeout"))
            except Exception as e:
                results.append((gateway, False, f"Error: {str(e)}"))
        
        progress.close()
        
        # Show results
        if results:
            dialog = xbmcgui.Dialog()
            working = [f"{g} - {s}" for g, r, s in results if r]
            failing = [f"{g} - {s}" for g, r, s in results if not r]
            
            message = "Working gateways:\n"
            message += "\n".join(working) if working else "None"
            message += "\n\nFailing gateways:\n"
            message += "\n".join(failing) if failing else "None"
            
            dialog.textviewer('Gateway Test Results', message)
        
        return results

def main():
    manager = GatewayManager()
    
    # Create dialog
    dialog = xbmcgui.Dialog()
    
    while True:
        options = [
            'Add Gateway',
            'Remove Gateway',
            'Test Gateway',
            'Test All Gateways',
            'Exit'
        ]
        
        index = dialog.select('IPFS Gateway Management', options)
        
        if index == 0:  # Add Gateway
            gateway = dialog.input('Enter Gateway URL (e.g., https://ipfs.io/ipfs/)')
            if gateway:
                manager.add_gateway(gateway)
        
        elif index == 1:  # Remove Gateway
            if not manager.gateways:
                dialog.ok('Wylloh', 'No gateways to remove')
                continue
                
            gateway_index = dialog.select('Select Gateway to Remove', manager.gateways)
            if gateway_index >= 0:
                gateway = manager.gateways[gateway_index]
                if dialog.yesno('Wylloh', f'Remove gateway {gateway}?'):
                    manager.remove_gateway(gateway)
        
        elif index == 2:  # Test Gateway
            if not manager.gateways:
                dialog.ok('Wylloh', 'No gateways to test')
                continue
                
            gateway_index = dialog.select('Select Gateway to Test', manager.gateways)
            if gateway_index >= 0:
                gateway = manager.gateways[gateway_index]
                manager.test_gateway(gateway)
        
        elif index == 3:  # Test All Gateways
            if not manager.gateways:
                dialog.ok('Wylloh', 'No gateways to test')
                continue
                
            manager.test_all_gateways()
        
        elif index == 4 or index == -1:  # Exit or Back
            break

if __name__ == '__main__':
    main() 