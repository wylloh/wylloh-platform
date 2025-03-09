# Wylloh Seed One

The Seed One is a Raspberry Pi-based media player for the Wylloh platform that allows playback of tokenized content.

## Overview

The Seed One component provides a dedicated hardware device for viewing content purchased through the Wylloh platform. It integrates with:

- Blockchain wallet for token verification
- IPFS for content retrieval
- Kodi media player for content playback

## Requirements

- Raspberry Pi 4 (2GB+ RAM recommended)
- Raspberry Pi OS (64-bit recommended)
- Internet connection
- HDMI connection to a display

## Quick Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/wy1bur/wylloh-platform.git
   cd wylloh-platform/seed-one
   ```

2. Run the setup script as root:
   ```bash
   sudo ./setup.sh
   ```

3. Follow the prompts and enter your MacBook's local IP address when requested.

4. Restart your Raspberry Pi:
   ```bash
   sudo reboot
   ```

## Manual Setup

See the detailed instructions in the [DEMO-README.MD](../DEMO-README.MD) file in the parent directory.

## Files Included

- `setup.sh` - Automated installation script
- `config.json.template` - Template for Wylloh configuration
- `wylloh.service` - Systemd service definition
- `kodi.desktop` - Autostart file for Kodi
- `kodi-addon/` - Directory containing the Wylloh Kodi addon

## Architecture

The Seed One operates as follows:

1. The Wylloh service runs in the background, connecting to:
   - Local blockchain node (on your MacBook)
   - IPFS gateway (on your MacBook)
   - API service (on your MacBook)

2. Kodi media player loads the Wylloh addon

3. The addon communicates with the Wylloh service to:
   - Verify token ownership
   - Retrieve content metadata
   - Stream content from IPFS

## Configuration

The Seed One uses a configuration file located at `/etc/wylloh/config.json`. Key settings include:

- `providerUrl`: The blockchain provider URL (points to MacBook in demo mode)
- `ipfsGateway`: The IPFS gateway URL (points to MacBook in demo mode)
- `apiUrl`: The API service URL (points to MacBook in demo mode)
- `autoConnectWallet`: When set to true, automatically connects to wallet on startup
- `demoMode`: Enables special behavior for demo environment
- `kodiEnabled`: Enables the Kodi integration

In demo mode, all services are expected to run on the same machine (your MacBook) and the Seed One connects to them via the local network.

## Troubleshooting

For troubleshooting tips, see the [DEMO-README.MD](../DEMO-README.MD) file.

## License

This project is licensed under the proprietary license - see the LICENSE file in the parent directory for details.