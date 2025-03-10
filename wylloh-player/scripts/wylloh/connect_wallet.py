#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Connect Wallet Script for Wylloh Player

Copyright (C) 2023-2025 Wylloh Team
https://wylloh.com
"""

import sys
import xbmc
import xbmcaddon

__addon__ = xbmcaddon.Addon()
__addonname__ = __addon__.getAddonInfo('name')


def connect_wallet():
    """Initialize wallet connection process."""
    xbmc.log('WYLLOH: Connecting wallet from Python script', xbmc.LOGINFO)
    
    # Call the C++ API to connect wallet
    result = xbmc.executeJSONRPC(
        '{"jsonrpc": "2.0", "method": "Wylloh.ConnectWallet", "id": 1}'
    )
    
    xbmc.log('WYLLOH: Connect wallet result: ' + result, xbmc.LOGINFO)


if __name__ == '__main__':
    connect_wallet() 