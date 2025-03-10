# Wylloh Seed One

The Seed One is a Raspberry Pi-based media player for the Wylloh platform that allows playback of tokenized content.

## Overview

The Seed One component provides a dedicated hardware device for viewing content purchased through the Wylloh platform. It integrates with:

- Blockchain wallet for token verification
- IPFS for content retrieval
- Media player for content playback

## Architectural Update: Wylloh Player

> **Note:** We're transitioning from a Kodi add-on approach to a dedicated Wylloh Player application.

Previously, the Seed One used Kodi media player with a custom add-on for Wylloh integration. Our new approach involves developing a dedicated Wylloh Player (based on Kodi's codebase) that provides:

- Deeper integration with the Wylloh ecosystem
- Streamlined user experience focused on tokenized content
- Native wallet connection functionality
- Custom branding and UI tailored to Wylloh's needs

During this transition period, both implementations are maintained in the repository:
- `kodi-addon/`: The original Kodi add-on implementation
- `wylloh-player/`: The new custom player implementation (under active development)

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

### Current Implementation (Kodi Add-on)

The Seed One currently operates as follows:

1. The Wylloh service runs in the background, connecting to:
   - Local blockchain node (on your MacBook)
   - IPFS gateway (on your MacBook)
   - API service (on your MacBook)

2. Kodi media player loads the Wylloh addon

3. The addon communicates with the Wylloh service to:
   - Verify token ownership
   - Retrieve content metadata
   - Stream content from IPFS

### Future Implementation (Wylloh Player)

The new Wylloh Player architecture will:

1. Eliminate the need for a separate Kodi installation
2. Provide native integration with the Wylloh wallet
3. Streamline the content browsing and playback experience
4. Offer customized UI specifically designed for tokenized content

This architectural shift will result in a more cohesive user experience and simplified setup process for Seed One devices.

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