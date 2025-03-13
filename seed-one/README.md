# Wylloh Seed One

The Seed One is a Raspberry Pi-based media player for the Wylloh platform that allows playback of tokenized content.

## Overview

The Seed One component provides a dedicated hardware device for viewing content purchased through the Wylloh platform. It integrates with:

- Blockchain wallet for token verification
- IPFS for content retrieval
- Web-based player for content playback

## Architectural Update: Web-Based Player

> **Note:** We've transitioned from a Kodi-based approach to a modern web-based player running in Chromium kiosk mode.

Previously, the Seed One used a Kodi-based media player. Our new approach involves a web-based player that provides:

- Better cross-platform consistency between Seed One and web browsers
- Streamlined development using modern web technologies
- Simplified deployment and updates
- Improved integration with the Wylloh ecosystem
- Enhanced IPFS and blockchain connectivity
- Consistent UI across all platforms

The player now runs in Chromium kiosk mode on the Seed One hardware, delivering a seamless, full-screen experience while using the same codebase as our web player.

## Enhanced IPFS Integration

The Wylloh Player includes significant improvements for IPFS content handling:

- **Multi-Gateway Support**: Configure multiple IPFS gateways with automatic fallback for reliable content retrieval
- **Content Caching**: Intelligent browser-based caching of content with configurable size limits and expiry times
- **Content Pinning**: Ability to pin important content to prevent it from being removed from cache
- **Auto-Pinning**: Automatic pinning of content owned by the connected wallet
- **Network Participation Foundation**: Infrastructure for future participation in the Wylloh distributed storage network

These features ensure reliable content access even with intermittent internet connectivity and optimize bandwidth usage for Seed One devices.

## Requirements

- Raspberry Pi 4 (2GB+ RAM recommended)
- Raspberry Pi OS (64-bit recommended)
- Internet connection
- HDMI connection to a display
- At least 16GB SD card (32GB+ recommended for content caching)

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
- `kiosk.sh` - Script to launch Chromium in kiosk mode
- `autostart/` - Autostart configurations for kiosk mode
- `scripts/` - Utility scripts for the Seed One

## Architecture

The Seed One now operates as follows:

1. Chromium browser launches in kiosk mode on startup
2. The browser loads the Wylloh web player application
3. The player connects to:
   - Local blockchain node (on your MacBook in demo mode)
   - IPFS gateway (on your MacBook in demo mode)
   - API service (on your MacBook in demo mode)
4. User connects their wallet directly in the browser
5. Content is streamed from IPFS via HTTP gateways
6. The player handles all license verification and playback

This architecture provides:
- Unified codebase between web and Seed One
- Simplified development and maintenance
- Faster feature deployment
- Consistent user experience across platforms

## Configuration

The Seed One uses a configuration file located at `/etc/wylloh/config.json`. Key settings include:

- `providerUrl`: The blockchain provider URL (points to MacBook in demo mode)
- `ipfsGateway`: The IPFS gateway URL (points to MacBook in demo mode)
- `playerUrl`: The URL to load for the player (points to MacBook in demo mode)
- `demoMode`: Enables special behavior for demo environment
- `kioskEnabled`: Enables the Chromium kiosk mode

In demo mode, all services are expected to run on the same machine (your MacBook) and the Seed One connects to them via the local network.

## Troubleshooting

For troubleshooting tips, see the [DEMO-README.MD](../DEMO-README.MD) file.

Common issues:
- If Chromium doesn't start in kiosk mode, check the autostart configuration
- If the player doesn't load, verify network connectivity to the MacBook
- For playback issues, check the browser console (connect a keyboard and press F12)

## License

This project is licensed under the proprietary license - see the LICENSE file in the parent directory for details.