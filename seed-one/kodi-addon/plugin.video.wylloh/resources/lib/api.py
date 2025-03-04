#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
API Client for Wylloh Kodi Addon
Handles communication with the Wylloh platform API
"""

import os
import json
import time
import requests
from urllib.parse import urljoin
import xbmcaddon
import xbmcvfs
from .utils import log, get_setting, set_setting
from .cache import Cache

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
ADDON_PROFILE = xbmcvfs.translatePath(ADDON.getAddonInfo('profile'))

# Initialize cache
CACHE = Cache()

# Default API settings
DEFAULT_API_URL = "https://api.wylloh.com/api/v1/"
DEFAULT_GATEWAY_URL = "https://gateway.wylloh.com/ipfs/"


class WyllohAPI:
    """
    Client for interacting with the Wylloh platform API.
    Handles content retrieval, searching, and streaming.
    """
    
    def __init__(self):
        """Initialize the API client"""
        self.api_url = get_setting('api_url') or DEFAULT_API_URL
        self.gateway_url = get_setting('gateway_url') or DEFAULT_GATEWAY_URL
        self.token = get_setting('api_token') or ""
        
        # Refresh token if available
        if self.token:
            self._refresh_token()

    def _refresh_token(self):
        """Refresh the API auth token if needed"""
        # TODO: Implement token refresh mechanism
        pass

    def _request(self, endpoint, method='GET', params=None, data=None, auth_required=True):
        """Make an API request"""
        url = urljoin(self.api_url, endpoint)
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Add auth token if available and required
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, params=params, headers=headers)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers)
                
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            log(f"API request error: {str(e)}", level='error')
            return None

    def get_content_categories(self):
        """Get content categories for marketplace"""
        # Use cache if available
        cached_data = CACHE.get('content_categories')
        if cached_data:
            return cached_data
            
        # Fallback to API request
        response = self._request('content/categories', auth_required=False)
        
        if response and 'categories' in response:
            # Cache the response
            CACHE.set('content_categories', response['categories'], expiry=3600)  # Cache for 1 hour
            return response['categories']
            
        # Return default categories if API fails
        default_categories = [
            {'id': 'movie', 'name': 'Movies'},
            {'id': 'documentary', 'name': 'Documentaries'},
            {'id': 'series', 'name': 'Series'},
            {'id': 'short', 'name': 'Short Films'},
            {'id': 'music', 'name': 'Music Films'}
        ]
        return default_categories

    def get_content_list(self, category):
        """Get content list by category"""
        # Use cache if available
        cache_key = f'content_list_{category}'
        cached_data = CACHE.get(cache_key)
        if cached_data:
            return cached_data
            
        # Prepare parameters
        params = {}
        if category and category != 'all':
            params['contentType'] = category
            
        # Make API request
        response = self._request('content', method='GET', params=params, auth_required=False)
        
        if response and 'content' in response:
            # Cache the response
            CACHE.set(cache_key, response['content'], expiry=1800)  # Cache for 30 minutes
            return response['content']
            
        return []

    def get_content_details(self, content_id):
        """Get detailed content information"""
        # Use cache if available
        cache_key = f'content_details_{content_id}'
        cached_data = CACHE.get(cache_key)
        if cached_data:
            return cached_data
            
        # Make API request
        response = self._request(f'content/{content_id}', auth_required=False)
        
        if response and 'content' in response:
            # Cache the response
            CACHE.set(cache_key, response['content'], expiry=1800)  # Cache for 30 minutes
            return response['content']
            
        return None

    def get_content_by_token(self, token_id):
        """Get content information from token ID"""
        # Use cache if available
        cache_key = f'content_by_token_{token_id}'
        cached_data = CACHE.get(cache_key)
        if cached_data:
            return cached_data
            
        # Make API request
        response = self._request(f'tokens/{token_id}/content', auth_required=True)
        
        if response and 'content' in response:
            # Cache the response
            CACHE.set(cache_key, response['content'], expiry=1800)  # Cache for 30 minutes
            return response['content']
            
        return None

    def search_content(self, query):
        """Search for content"""
        params = {'query': query}
        response = self._request('content/search', params=params, auth_required=False)
        
        if response and 'content' in response:
            return response['content']
            
        return []

    def get_stream_url(self, content_id, token_id):
        """Get streaming URL for content with token verification"""
        # First, request access credentials
        response = self._request('encryption/access', method='POST', data={
            'contentId': content_id,
            'tokenId': token_id
        }, auth_required=True)
        
        if not response or not response.get('accessToken'):
            log(f"Failed to get access token for content {content_id}", level='error')
            return None
            
        access_token = response.get('accessToken')
        
        # Get the IPFS CID for the content
        content = self.get_content_details(content_id)
        if not content or not content.get('ipfsCid'):
            log(f"Failed to get content CID for {content_id}", level='error')
            return None
            
        ipfs_cid = content.get('ipfsCid')
        
        # Construct streaming URL with access token
        stream_url = f"{self.gateway_url}{ipfs_cid}?token={access_token}"
        
        return stream_url

    def verify_token_ownership(self, token_id, wallet_address):
        """Verify token ownership on the blockchain"""
        response = self._request('tokens/verify', method='POST', data={
            'tokenId': token_id,
            'walletAddress': wallet_address
        }, auth_required=True)
        
        if response and response.get('valid'):
            return True
            
        return False