# Wylloh Demo Environment

This guide explains how to set up and run a fully local demo environment for Wylloh without writing any data to public networks.

## Prerequisites

- MacBook Pro with:
  - Node.js (v16+) and yarn
  - Ganache (`npm install -g ganache`)
  - IPFS (`brew install ipfs`)
  - jq (`brew install jq`)

- Seed One device (currently using Raspberry Pi 4 hardware) on the same local network

## Setup Instructions

### 1. Install Dependencies

```bash
# Install required tools
brew install node ipfs jq
npm install -g ganache
```

### 2. Make Demo Script Executable

Make the initialization script executable:

```bash
chmod +x init-demo.sh
```

## Running the Demo

### Start Demo Mode

```bash
yarn demo
```

This will:
1. Start local Ganache blockchain
2. Start local IPFS node in offline mode
3. Deploy contracts to local blockchain
4. Load sample content to IPFS
5. Update configuration with all addresses
6. Start your application in demo mode (client, API, and storage services)

### IPFS Features in Demo Mode

When running the demo, you can experience these IPFS-related features:

1. **Gateway Management**: Configure multiple IPFS gateways through the Wylloh Player settings
2. **Content Caching**: Test content caching with configurable size and expiration settings
3. **Content Pinning**: Pin important content to ensure it remains available locally
4. **Automatic Pinning**: Experience automatic pinning of content you own through your demo wallet
5. **Network Participation**: View the foundation UI for future network participation features

#### Testing IPFS Features

1. **Add a Gateway**:
   - Navigate to Settings > Wylloh > IPFS > Manage Gateways
   - Add a new gateway (e.g., https://dweb.link/ipfs/)
   - Test gateways to verify which ones perform best in your environment

2. **Content Cache**:
   - View and adjust cache settings in Settings > Wylloh > IPFS
   - Play content to see it automatically cached
   - Adjust cache size and expiry time to your preferences

3. **Content Pinning**:
   - Enable pinning in Settings > Wylloh > IPFS
   - Enable automatic pinning of owned content
   - All content owned by your demo wallet will be automatically pinned

### Stop Demo Mode

When finished with the demo:

```bash
yarn stop-demo
```

## Detailed Demo Flow Instructions

This demonstration showcases the complete decentralized content flow:
1. Creator uploads and tokenizes content
2. Content is stored securely on IPFS
3. Tokens represent ownership/access rights
4. Consumer purchases token for access rights
5. System authenticates ownership before enabling playback
6. Content streams securely from IPFS

### A. Content Creation & Tokenization (Creator Experience)

1. **Start in Creator Dashboard**
   - Navigate to the Creator Dashboard in the application
   - This is where creators manage their content

2. **Upload Content** 
   - Click "Upload New Content"
   - Select the Big Buck Bunny demo video file
   - Fill out metadata (title, description, etc.)
   - Upload thumbnail if available
   - Click "Next" to proceed to tokenization

3. **Tokenize Content**
   - Set token parameters:
     - Price: 0.01 ETH
     - Supply: 1000 tokens
   - Review and submit
   - Confirm the transaction in your wallet
   - Wait for transaction to complete

4. **Verify Content Published**
   - Confirm the content appears in your Creator Dashboard
   - Content is now available on the marketplace

### B. Content Purchase & Playback (Consumer Experience)

5. **Browse Marketplace**
   - Navigate to the "Marketplace" section
   - Verify that Big Buck Bunny appears in the listing
   - Click on the content to view details

6. **Purchase Content**
   - On the content details page, click "Purchase"
   - Confirm the purchase transaction in your wallet
   - Wait for transaction to complete
   - You should see a success confirmation

7. **Check "My Collection"**
   - Navigate to "My Collection" section
   - Big Buck Bunny should now appear in your owned content
   - This confirms the token purchase was successful

8. **Play Content**
   - Click the "Play" button on the Big Buck Bunny card
   - This navigates to the player page
   - The player should load and stream the content from your local IPFS node
   - Content should play without errors

### C. Seed One Experience (optional)

9. **Access Wylloh Player** via Chromium in kiosk mode on Seed One
10. **Connect Wallet** on Seed One
11. **Verify Token** is automatically detected in wallet
12. **Verify Content** automatically appears in library
13. **Play Movie** on the Seed One device

### D. Troubleshooting Common Issues

- **IPFS Content Not Found**: Ensure the IPFS daemon is running and content was properly uploaded
- **Wallet Connection**: Make sure your wallet is connected to the local Ganache chain
- **Failed Transactions**: Check that your wallet has sufficient ETH on the local chain
- **Playback Issues**: Verify network connectivity to the local IPFS node

## Configure Seed One with Wylloh Player

After running the initialization script, you'll need to set up the Wylloh Player on your Seed One device.

### Option 1: Automated Setup (Recommended)

For a streamlined setup experience, use the automated installation script:

1. Clone the repository on your Seed One:
   ```bash
   git clone https://github.com/wy1bur/wylloh-platform.git
   cd wylloh-platform/seed-one
   ```

2. Run the setup script as root (the Seed One uses Raspberry Pi OS):
   ```bash
   sudo ./setup.sh
   ```

3. Follow the prompts in the script:
   - Enter your MacBook's IP address when requested
   - Optionally customize ports and contract addresses
   - The script will automatically install all dependencies and configure Chromium in kiosk mode

4. Restart your Seed One:
   ```bash
   sudo reboot
   ```

### Option 2: Manual Setup

If you prefer to set up the Wylloh Player manually, follow these steps:

1. Install dependencies (on the Seed One's Raspberry Pi OS):
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y chromium-browser xdotool unclutter
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/wy1bur/wylloh-platform.git
   cd wylloh-platform
   ```

3. Create required directories:
   ```bash
   sudo mkdir -p /etc/wylloh
   ```

4. Create config file:
   ```bash
   sudo nano /etc/wylloh/config.json
   ```
   
   Enter your MacBook's IP address in this configuration:
   ```json
   {
     "providerUrl": "http://YOUR_MACBOOK_IP:8545",
     "ipfsGateway": "http://YOUR_MACBOOK_IP:8080/ipfs/",
     "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
     "tokenFactoryAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
     "demoMode": true,
     "playerUrl": "http://YOUR_MACBOOK_IP:3000/player"
   }
   ```

5. Set up autostart with Chromium in kiosk mode:
   ```bash
   mkdir -p ~/.config/autostart
   nano ~/.config/autostart/wylloh-kiosk.desktop
   ```
   
   Add:
   ```
   [Desktop Entry]
   Type=Application
   Name=Wylloh Player
   Comment=Wylloh Media Player
   Exec=/bin/bash -c "chromium-browser --kiosk --no-default-browser-check --no-first-run --disable-translate --disable-infobars --disable-suggestions-service --disable-save-password-bubble --disable-session-crashed-bubble --start-maximized --noerrdialogs --disable-pinch --overscroll-history-navigation=0 http://YOUR_MACBOOK_IP:3000/player"
   Icon=/home/pi/wylloh-platform/player/public/wylloh-icon.png
   Terminal=false
   X-GNOME-Autostart-enabled=true
   ```

6. Hide cursor and disable screen blanking:
   ```bash
   nano ~/.config/autostart/unclutter.desktop
   ```
   
   Add:
   ```
   [Desktop Entry]
   Type=Application
   Name=Unclutter
   Comment=Hide the mouse cursor
   Exec=unclutter -idle 0.5
   Terminal=false
   X-GNOME-Autostart-enabled=true
   ```

7. Restart your Seed One:
   ```bash
   sudo reboot
   ```

## Troubleshooting Wylloh Player on Seed One

- **Connection Issues**: 
  - Ensure MacBook and Seed One are on the same network
  - Verify MacBook IP address is correct in `/etc/wylloh/config.json`
  - Check MacBook firewall settings to allow ports 8545 and 8080

- **Browser Issues**:
  - If Chromium doesn't start in kiosk mode, check the autostart configuration
  - Try manually launching Chromium with the kiosk parameters
  - Check Chromium logs: `~/.config/chromium/chrome_debug.log`

- **Runtime Issues**:
  - Check browser console logs for errors (connect keyboard and press F12)
  - Verify the wallet connection is working
  - Ensure the player URL is accessible from the Seed One

## Working with MetaMask

To connect MetaMask to your local Ganache instance:

1. Add a new network in MetaMask:
   - Network Name: Wylloh Demo
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

2. Import the test account using the private key:
   - The private key is displayed during demo initialization
   - This account will have test ETH pre-loaded

## Project Structure

The Wylloh platform consists of three main components:

1. **Web Interface**: The client application for content management
2. **Web Player**: The browser-based player that also runs on Seed One
3. **Backend Services**: API and storage services that support the web applications

All components interact with the local blockchain and IPFS during the demo.

## Notes

- All transactions occur on your local blockchain
- All content is stored on your local IPFS node
- No data is written to public networks
- The "DEMO MODE" banner confirms you're in the isolated environment

## Troubleshooting

- If services fail to start, ensure ports 8545 (Ganache), 5001/8080 (IPFS), 3000 (client), 4000 (API), and 4001 (storage) are available
- If the Seed One can't connect, verify both devices are on the same network and can reach each other
- Check logs in `/tmp/ganache.log` and `/tmp/ipfs.log` for errors
- For React client issues, check the browser console
- For API or storage issues, check the terminal output for those services