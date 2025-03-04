#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Wallet Connection for Wylloh Kodi Addon
Interfaces with the Seed One app wallet service and blockchain
"""

import os
import json
import hashlib
import time
import xbmcaddon
import xbmcvfs
import requests
from urllib.parse import urljoin
from .utils import log, get_setting, set_setting

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))
ADDON_PROFILE = xbmcvfs.translatePath(ADDON.getAddonInfo('profile'))
WALLET_FILE = os.path.join(ADDON_PROFILE, 'wallet.json')

# Ensure the addon profile directory exists
if not os.path.exists(ADDON_PROFILE):
    os.makedirs(ADDON_PROFILE)

# Default API settings
DEFAULT_API_URL = "http://localhost:3333/api/"
DEFAULT_API_KEY = "local-seed-one-key"


class WalletConnection:
    """
    Manages wallet connections and token ownership verification.
    Uses the Seed One application's local API to interact with the blockchain.
    """
    
    def __init__(self):
        """Initialize the wallet connection"""
        self.api_url = get_setting('wallet_api_url') or DEFAULT_API_URL
        self.api_key = get_setting('wallet_api_key') or DEFAULT_API_KEY
        self.connected = False
        self.address = None
        self.tokens = []
        
        # Load wallet from persistent storage
        self._load_wallet()

    def _load_wallet(self):
        """Load wallet data from storage"""
        try:
            if os.path.exists(WALLET_FILE):
                with open(WALLET_FILE, 'r') as f:
                    data = json.load(f)
                    self.connected = data.get('connected', False)
                    self.address = data.get('address')
                    self.tokens = data.get('tokens', [])
        except Exception as e:
            log('Error loading wallet data: {0}'.format(str(e)), level='error')
            # Reset wallet data in case of error
            self.connected = False
            self.address = None
            self.tokens = []

    def _save_wallet(self):
        """Save wallet data to storage"""
        try:
            data = {
                'connected': self.connected,
                'address': self.address,
                'tokens': self.tokens
            }
            with open(WALLET_FILE, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            log('Error saving wallet data: {0}'.format(str(e)), level='error')

    def _api_request(self, endpoint, method='get', data=None):
        """Make an API request to the Seed One wallet service"""
        try:
            headers = {
                'X-API-Key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            url = urljoin(self.api_url, endpoint)
            
            if method.lower() == 'get':
                response = requests.get(url, headers=headers)
            elif method.lower() == 'post':
                response = requests.post(url, json=data, headers=headers)
            elif method.lower() == 'put':
                response = requests.put(url, json=data, headers=headers)
            elif method.lower() == 'delete':
                response = requests.delete(url, headers=headers)
                
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            log('API request error: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def is_connected(self):
        """Check if wallet is connected"""
        return self.connected

    def get_address(self):
        """Get wallet address"""
        return self.address

    def connect(self):
        """Connect to wallet through Seed One API"""
        try:
            response = self._api_request('wallet/connect', method='post')
            
            if response.get('success'):
                self.connected = True
                self.address = response.get('address')
                self._save_wallet()
                
                # Fetch tokens after connecting
                self.refresh()
                
                return {'success': True, 'address': self.address}
            else:
                return {'success': False, 'message': response.get('message', 'Failed to connect wallet')}
        except Exception as e:
            log('Error connecting wallet: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def disconnect(self):
        """Disconnect wallet"""
        try:
            response = self._api_request('wallet/disconnect', method='post')
            
            if response.get('success'):
                self.connected = False
                self.address = None
                self.tokens = []
                self._save_wallet()
                
                return {'success': True}
            else:
                return {'success': False, 'message': response.get('message', 'Failed to disconnect wallet')}
        except Exception as e:
            log('Error disconnecting wallet: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def import_wallet(self, private_key):
        """Import wallet using private key"""
        try:
            response = self._api_request('wallet/import', method='post', data={
                'privateKey': private_key
            })
            
            if response.get('success'):
                self.connected = True
                self.address = response.get('address')
                self._save_wallet()
                
                # Fetch tokens after importing
                self.refresh()
                
                return {'success': True, 'address': self.address}
            else:
                return {'success': False, 'message': response.get('message', 'Failed to import wallet')}
        except Exception as e:
            log('Error importing wallet: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def refresh(self):
        """Refresh wallet data"""
        try:
            if not self.connected:
                return {'success': False, 'message': 'Wallet not connected'}
            
            # Get balance
            balance_response = self._api_request('wallet/balance')
            
            # Get tokens
            tokens_response = self._api_request('wallet/tokens')
            
            if tokens_response.get('success'):
                self.tokens = tokens_response.get('tokens', [])
                self._save_wallet()
                
                return {'success': True}
            else:
                return {'success': False, 'message': tokens_response.get('message', 'Failed to refresh wallet')}
        except Exception as e:
            log('Error refreshing wallet: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}

    def get_balance(self):
        """Get wallet balance"""
        try:
            if not self.connected:
                return '0.0'
            
            response = self._api_request('wallet/balance')
            
            if response.get('success'):
                return response.get('balance', '0.0')
            else:
                return '0.0'
        except Exception as e:
            log('Error getting balance: {0}'.format(str(e)), level='error')
            return '0.0'

    def get_owned_tokens(self):
        """Get all owned tokens"""
        if not self.connected:
            return []
        
        # Use cached tokens
        return self.tokens

    def has_token(self, token_id):
        """Check if user owns a specific token"""
        if not self.connected:
            return False
        
        for token in self.tokens:
            if token['id'] == token_id:
                return True
        
        return False

    def has_token_for_content(self, content_id):
        """Check if user owns any token for specific content"""
        if not self.connected:
            return False
        
        for token in self.tokens:
            if token.get('contentId') == content_id:
                return True
        
        return False

    def get_token_id_for_content(self, content_id):
        """Get a token ID for specific content"""
        if not self.connected:
            return None
        
        for token in self.tokens:
            if token.get('contentId') == content_id:
                return token['id']
        
        return None

    def get_tokens_for_content(self, content_id):
        """Get all tokens for specific content"""
        if not self.connected:
            return []
        
        return [token for token in self.tokens if token.get('contentId') == content_id]

    def purchase_token(self, content_id):
        """Purchase a token for content"""
        try:
            if not self.connected:
                return {'success': False, 'message': 'Wallet not connected'}
            
            response = self._api_request('marketplace/purchase', method='post', data={
                'contentId': content_id
            })
            
            if response.get('success'):
                # Refresh tokens after purchase
                self.refresh()
                
                return {'success': True, 'tokenId': response.get('tokenId')}
            else:
                return {'success': False, 'message': response.get('message', 'Failed to purchase token')}
        except Exception as e:
            log('Error purchasing token: {0}'.format(str(e)), level='error')
            return {'success': False, 'message': str(e)}