# Wylloh Configuration Synchronization Tools

These tools ensure that the Wylloh configuration stays synchronized between the main configuration file (`/etc/wylloh/config.json`) and the Kodi addon settings.

## Overview

When running in demo mode or development environments, it's essential that all components use consistent configuration settings, particularly for API URLs, IPFS gateways, and wallet connection settings. These tools automate that process.

## Components

1. **sync-config.js**: A Node.js script that reads the main Wylloh configuration and updates the Kodi addon settings accordingly.

2. **wylloh-service-wrapper.sh**: A wrapper script that runs the sync script before starting the Wylloh service, ensuring that Kodi always has the latest configuration.

3. **install-sync-tools.sh**: An installation script that sets up the synchronization tools on a new system.

## Installation

The tools are automatically installed as part of the `setup.sh` script. If you need to install them manually:

```bash
sudo tools/setup/install-sync-tools.sh
```

## Development Notes

- The configuration synchronization runs automatically when the Wylloh service starts
- It makes Kodi display the correct API URLs and IPFS Gateway URLs from `/etc/wylloh/config.json`
- When running `yarn demo`, the Kodi addon will automatically use the correct local IP addresses

## Troubleshooting

If Kodi still displays incorrect URLs:

1. Check the Wylloh service status: `systemctl status wylloh`
2. Check the main config file: `cat /etc/wylloh/config.json`
3. Check the Kodi addon settings: `cat ~/.kodi/userdata/addon_data/plugin.video.wylloh/settings.xml`
4. Run the sync script manually: `node ~/scripts/sync-config.js` 