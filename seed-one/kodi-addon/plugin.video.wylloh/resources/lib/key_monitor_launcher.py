#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Launcher script for Wylloh key monitor
This is designed to be called by Kodi's executebuiltin
"""

import os
import sys
import xbmc
import xbmcaddon
import xbmcvfs

# Always specify the addon ID explicitly
ADDON_ID = 'plugin.video.wylloh'
ADDON = xbmcaddon.Addon(ADDON_ID)
ADDON_PATH = xbmcvfs.translatePath(ADDON.getAddonInfo('path'))

# Add resources/lib to the Python path if not already there
lib_path = os.path.join(ADDON_PATH, 'resources', 'lib')
if lib_path not in sys.path:
    sys.path.append(lib_path)

# Import from the actual addon context directly
try:
    from resources.lib.key_monitor import main
except ImportError:
    xbmc.log(f"[{ADDON_ID}] Direct import failed, trying relative import", level=xbmc.LOGINFO)
    try:
        # Try with relative import
        from key_monitor import main
    except ImportError as e:
        xbmc.log(f"[{ADDON_ID}] Failed to import key_monitor: {str(e)}", level=xbmc.LOGERROR)
        sys.exit(1)

# Run the main function
if __name__ == "__main__":
    xbmc.log(f"[{ADDON_ID}] Starting key_monitor_launcher", level=xbmc.LOGINFO)
    main(ADDON_ID) 