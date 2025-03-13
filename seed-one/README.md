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

# Wylloh Seed One Setup

This directory contains scripts to set up the Wylloh Player on a Seed One device using Chromium in kiosk mode.

## Overview

The Seed One implementation uses the Wylloh web player running in a full-screen Chromium browser (kiosk mode). This approach offers several advantages:

- **Single Codebase**: The same web player code runs on both regular browsers and the Seed One.
- **Responsive Design**: The player automatically adapts to the display size and input methods.
- **Easy Updates**: New player features are immediately available on the Seed One without separate deployments.
- **Platform Detection**: The player detects when it's running on Seed One and optimizes the UI accordingly.

## Prerequisites

- Seed One device (Raspberry Pi 4 with Raspberry Pi OS)
- Network connection to the Wylloh server (your development machine running the demo)
- USB keyboard for initial setup

## Installation

1. **Clone the Repository**

```bash
git clone https://github.com/your-organization/wylloh.git
cd wylloh/seed-one
```

2. **Run the Setup Script**

```bash
sudo ./setup.sh
```

3. **Enter Your Server's IP Address**

When prompted, enter the IP address of your Wylloh server (the machine running the demo environment).

4. **Reboot the Seed One**

```bash
sudo reboot
```

After reboot, the Wylloh Player will automatically start in kiosk mode.

## Manual Configuration

If you prefer to set up the Seed One manually:

1. **Install Required Packages**

```bash
sudo apt update
sudo apt install -y chromium-browser xdotool unclutter
```

2. **Create Configuration Files**

```bash
sudo mkdir -p /etc/wylloh
sudo bash -c 'cat > /etc/wylloh/config.json << EOF
{
  "providerUrl": "http://YOUR_SERVER_IP:8545",
  "ipfsGateway": "http://YOUR_SERVER_IP:8080/ipfs/",
  "playerUrl": "http://YOUR_SERVER_IP:3000/player",
  "demoMode": true
}
EOF'
```

3. **Set Up Autostart for Chromium in Kiosk Mode**

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/wylloh-kiosk.desktop << EOF
[Desktop Entry]
Type=Application
Name=Wylloh Player
Comment=Wylloh Media Player
Exec=chromium-browser --kiosk --no-default-browser-check --no-first-run --disable-translate --disable-infobars --disable-suggestions-service --disable-save-password-bubble --disable-session-crashed-bubble --start-maximized --noerrdialogs --disable-pinch --overscroll-history-navigation=0 http://YOUR_SERVER_IP:3000/player
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

cat > ~/.config/autostart/unclutter.desktop << EOF
[Desktop Entry]
Type=Application
Name=Unclutter
Comment=Hide the mouse cursor
Exec=unclutter -idle 0.5
Terminal=false
X-GNOME-Autostart-enabled=true
EOF
```

4. **Disable Screen Blanking**

```bash
sudo bash -c 'cat > /etc/xdg/lxsession/LXDE-pi/autostart << EOF
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
EOF'
```

## Troubleshooting

### Player Doesn't Start

1. Check if Chromium is running:
   ```bash
   ps aux | grep chromium
   ```

2. If Chromium is running but not showing the player, check the logs:
   ```bash
   cat ~/.config/chromium/chrome_debug.log
   ```

3. Verify network connectivity to the server:
   ```bash
   ping YOUR_SERVER_IP
   ```

### Black Screen or Blank Browser

1. Open a terminal (Ctrl+Alt+T) and try launching Chromium manually:
   ```bash
   chromium-browser http://YOUR_SERVER_IP:3000/player
   ```

2. Check if the server is running:
   ```bash
   curl -I http://YOUR_SERVER_IP:3000
   ```

### Browser Closing Immediately

This usually indicates a configuration issue or a crash. Try:

1. Running without kiosk mode to see error messages:
   ```bash
   chromium-browser --no-default-browser-check http://YOUR_SERVER_IP:3000/player
   ```

2. Checking system logs:
   ```bash
   sudo journalctl -xe
   ```

## Customization

### Changing Player URL

To change the player URL, edit the configuration file:

```bash
sudo nano /etc/wylloh/config.json
```

### Modifying Chromium Flags

To add or remove Chromium flags, edit the kiosk desktop file:

```bash
nano ~/.config/autostart/wylloh-kiosk.desktop
```

### Updating the Player

The player automatically updates when the server code is updated, no additional steps required.