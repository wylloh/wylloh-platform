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

## Demo Flow

### On MacBook:
1. Connect wallet (MetaMask configured to local network)
2. Upload a movie file (sample is pre-loaded)
3. Set license and token structure
4. Mint ERC-1155 token set 
5. Browse movie store
6. Buy token

### *Switch to Seed One*

### On Seed One:
7. Connect Wallet on Seed One
8. *Token is automatically detected in wallet*
9. *Movie automatically appears in library*
10. Play movie

## Configure Seed One with Wylloh Player

After running the initialization script, you'll need to set up the Wylloh Player on your Seed One device.

### Option 1: Automated Setup (Recommended)

For a streamlined setup experience, use the automated installation script:

1. Clone the repository on your Seed One:
   ```bash
   git clone https://github.com/wy1bur/wylloh-platform.git
   cd wylloh-platform/wylloh-player
   ```

2. Run the setup script as root (the Seed One uses Raspberry Pi OS):
   ```bash
   sudo ./setup.sh
   ```

3. Follow the prompts in the script:
   - Enter your MacBook's IP address when requested
   - Optionally customize ports and contract addresses
   - The script will automatically install all dependencies, configure services, and build the Wylloh Player

4. Restart your Seed One:
   ```bash
   sudo reboot
   ```

### Option 2: Manual Setup

If you prefer to set up the Wylloh Player manually, follow these steps:

1. Install dependencies (on the Seed One's Raspberry Pi OS):
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y git cmake build-essential autoconf libtool pkg-config
   sudo apt install -y libssl-dev zlib1g-dev libyajl-dev libxml2-dev libxslt1-dev python3-dev
   sudo apt install -y libcurl4-openssl-dev libsqlite3-dev libmicrohttpd-dev
   sudo apt install -y rapidjson-dev libfmt-dev
   sudo apt install -y libegl1-mesa-dev libgles2-mesa-dev libgl1-mesa-dev
   sudo apt install -y libudev-dev libpulse-dev libavahi-client-dev
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/wy1bur/wylloh-player.git
   cd wylloh-player
   ```

3. Create required directories:
   ```bash
   sudo mkdir -p /etc/wylloh
   sudo mkdir -p /var/lib/wylloh/media
   sudo mkdir -p /var/lib/wylloh/metadata
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
     "logLevel": "info",
     "mediaPath": "/var/lib/wylloh/media",
     "metadataPath": "/var/lib/wylloh/metadata"
   }
   ```

5. Build the Wylloh Player:
   ```bash
   mkdir build
   cd build
   cmake -DCMAKE_BUILD_TYPE=Release -DENABLE_TESTING=OFF ..
   make -j$(nproc)
   ```

6. Create desktop shortcut:
   ```bash
   mkdir -p ~/.local/share/applications
   nano ~/.local/share/applications/wylloh-player.desktop
   ```
   
   Add:
   ```
   [Desktop Entry]
   Type=Application
   Name=Wylloh Player
   Comment=Wylloh Media Player
   Exec=/home/YOUR_USERNAME/wylloh-player/build/wylloh-player
   Icon=/home/YOUR_USERNAME/wylloh-player/media/icon256x256.png
   Terminal=false
   Categories=AudioVideo;Video;Player;TV;
   ```

7. Set up autostart:
   ```bash
   mkdir -p ~/.config/autostart
   cp ~/.local/share/applications/wylloh-player.desktop ~/.config/autostart/
   ```

8. Restart your Seed One:
   ```bash
   sudo reboot
   ```

## Troubleshooting Wylloh Player on Seed One

- **Connection Issues**: 
  - Ensure MacBook and Seed One are on the same network
  - Verify MacBook IP address is correct in `/etc/wylloh/config.json`
  - Check MacBook firewall settings to allow ports 8545 and 8080

- **Build Issues**:
  - If you encounter build errors, make sure all dependencies are installed
  - Check for specific error messages in the build output
  - Try building with debug flags: `cmake -DCMAKE_BUILD_TYPE=Debug ..`

- **Runtime Issues**:
  - Check logs in `~/.wylloh-player/temp/wylloh-player.log`
  - Verify the configuration in Settings > Wylloh > General
  - Ensure Demo Mode is enabled
  - Verify the IPFS gateway and provider URLs are correct

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

1. **Client**: React-based web interface (runs on port 3000)
2. **API**: Backend API service (runs on port 4000)
3. **Storage**: IPFS integration service (runs on port 4001)

All three components are started automatically by the demo script.

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