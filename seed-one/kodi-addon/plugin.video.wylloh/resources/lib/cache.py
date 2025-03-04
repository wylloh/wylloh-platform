#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Cache utility for Wylloh Kodi Addon
Provides caching functionality for API responses and content metadata
"""

import os
import json
import time
import hashlib
import xbmcaddon
import xbmcvfs
from .utils import log

# Initialize addon
ADDON = xbmcaddon.Addon()
ADDON_PROFILE = xbmcvfs.translatePath(ADDON.getAddonInfo('profile'))
CACHE_DIR = os.path.join(ADDON_PROFILE, 'cache')

# Ensure cache directory exists
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)


class Cache:
    """
    Simple file-based caching system for the Wylloh addon.
    Stores cached data in JSON files with expiry timestamps.
    """
    
    def __init__(self, base_dir=None):
        """Initialize the cache"""
        self.cache_dir = base_dir or CACHE_DIR
        
        # Create cache directory if it doesn't exist
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)

    def _get_cache_file_path(self, key):
        """Get the file path for a cache key"""
        # Create a hash of the key to use as filename
        hashed_key = hashlib.md5(key.encode('utf-8')).hexdigest()
        return os.path.join(self.cache_dir, f"{hashed_key}.json")

    def set(self, key, data, expiry=86400):
        """
        Store data in the cache
        
        Args:
            key (str): Cache key
            data (any): Data to cache (must be JSON serializable)
            expiry (int): Cache expiry time in seconds (default: 24 hours)
        """
        try:
            cache_file = self._get_cache_file_path(key)
            
            # Create cache entry with expiry timestamp
            cache_entry = {
                'expires_at': int(time.time()) + expiry,
                'data': data
            }
            
            # Write to cache file
            with open(cache_file, 'w') as f:
                json.dump(cache_entry, f)
                
            return True
        except Exception as e:
            log(f"Cache set error for key '{key}': {str(e)}", level='error')
            return False

    def get(self, key):
        """
        Retrieve data from the cache
        
        Args:
            key (str): Cache key
            
        Returns:
            The cached data if found and not expired, None otherwise
        """
        try:
            cache_file = self._get_cache_file_path(key)
            
            # Check if cache file exists
            if not os.path.exists(cache_file):
                return None
                
            # Read cache file
            with open(cache_file, 'r') as f:
                cache_entry = json.load(f)
                
            # Check if cache entry is expired
            if cache_entry['expires_at'] < int(time.time()):
                # Cache is expired, remove it
                self.delete(key)
                return None
                
            # Return cached data
            return cache_entry['data']
        except Exception as e:
            log(f"Cache get error for key '{key}': {str(e)}", level='error')
            return None

    def delete(self, key):
        """
        Delete a cache entry
        
        Args:
            key (str): Cache key
        """
        try:
            cache_file = self._get_cache_file_path(key)
            
            # Remove file if it exists
            if os.path.exists(cache_file):
                os.remove(cache_file)
                
            return True
        except Exception as e:
            log(f"Cache delete error for key '{key}': {str(e)}", level='error')
            return False

    def clear(self):
        """Clear all cache entries"""
        try:
            # List all files in cache directory
            for filename in os.listdir(self.cache_dir):
                if filename.endswith('.json'):
                    cache_file = os.path.join(self.cache_dir, filename)
                    os.remove(cache_file)
                    
            return True
        except Exception as e:
            log(f"Cache clear error: {str(e)}", level='error')
            return False

    def prune(self):
        """Remove all expired cache entries"""
        try:
            # List all files in cache directory
            for filename in os.listdir(self.cache_dir):
                if filename.endswith('.json'):
                    cache_file = os.path.join(self.cache_dir, filename)
                    
                    try:
                        # Read cache file
                        with open(cache_file, 'r') as f:
                            cache_entry = json.load(f)
                            
                        # Check if cache entry is expired
                        if cache_entry['expires_at'] < int(time.time()):
                            # Remove expired entry
                            os.remove(cache_file)
                    except:
                        # If we can't read the file, delete it
                        os.remove(cache_file)
                        
            return True
        except Exception as e:
            log(f"Cache prune error: {str(e)}", level='error')
            return False