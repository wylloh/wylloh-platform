#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Disconnect Wallet Script for Wylloh Player

Copyright (C) 2023-2025 Wylloh Team
https://wylloh.com
"""

import sys
import xbmc

# Try to import xbmcaddon, but don't fail if it's not available
# This allows the script to work during development
try:
    import xbmcaddon
    __addon__ = xbmcaddon.Addon()
    __addonname__ = __addon__.getAddonInfo('name')
except ImportError:
    __addon__ = None
    __addonname__ = "Wylloh Player"


def disconnect_wallet():
    """Initialize wallet disconnection process."""
    xbmc.log('WYLLOH: Disconnecting wallet from Python script', xbmc.LOGINFO)
    
    # Call the C++ API to disconnect wallet
    result = xbmc.executeJSONRPC(
        '{"jsonrpc": "2.0", "method": "Wylloh.DisconnectWallet", "id": 1}'
    )
    
    xbmc.log('WYLLOH: Disconnect wallet result: ' + result, xbmc.LOGINFO)


if __name__ == '__main__':
    disconnect_wallet() 