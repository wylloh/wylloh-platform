# Wylloh Demo Environment

This guide explains how to set up and run a fully local demo environment for Wylloh without writing any data to public networks.

## Prerequisites

- MacBook Pro with:
  - Node.js (v16+) and yarn
  - Ganache (`npm install -g ganache`)
  - IPFS (`brew install ipfs`)
  - jq (`brew install jq`)

- Raspberry Pi 4 (Seed One) on the same local network

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

### *Switch to Raspberry Pi (Seed One)*

### On Seed One:
7. Connect Wallet on Seed One
8. *Token is automatically detected in wallet*
9. *Movie automatically appears in library*
10. Play movie

## Configure Seed One

After running the initialization script, you'll receive instructions for configuring your Raspberry Pi. 

### Option 1: Automated Setup (Recommended)

For a streamlined setup experience, use the automated installation script:

1. Clone the repository on your Raspberry Pi:
   ```bash
   git clone https://github.com/wy1bur/wylloh-platform.git
   cd wylloh-platform/seed-one
   ```

2. Run the setup script as root:
   ```bash
   sudo ./setup.sh
   ```

3. Follow the prompts in the script:
   - Enter your MacBook's IP address when requested
   - The script will automatically install all dependencies, configure services, and set up the Kodi addon

4. Restart your Raspberry Pi:
   ```bash
   sudo reboot
   ```

### Option 2: Manual Setup

If you prefer to set up the Seed One manually, follow these steps:

1. Install dependencies:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y nodejs npm git python3 ffmpeg kodi
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/wy1bur/wylloh-platform.git
   cd wylloh-platform/seed-one
   ```

3. Create required directories:
   ```bash
   sudo mkdir -p /opt/wylloh
   sudo mkdir -p /etc/wylloh
   sudo mkdir -p /var/lib/wylloh/media
   sudo mkdir -p /var/lib/wylloh/metadata
   ```

4. Copy files:
   ```bash
   sudo cp -r * /opt/wylloh/
   cd /opt/wylloh
   sudo npm install
   ```

5. Create config file:
   ```bash
   sudo nano /etc/wylloh/config.json
   ```
   
   Enter your MacBook's IP address in this configuration:
   ```json
   {
     "providerUrl": "http://YOUR_MACBOOK_IP:8545",
     "ipfsGateway": "http://YOUR_MACBOOK_IP:8080",
     "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
     "tokenFactoryAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
     "demoMode": true,
     "logLevel": "info",
     "mediaPath": "/var/lib/wylloh/media",
     "metadataPath": "/var/lib/wylloh/metadata",
     "kodiEnabled": true
   }
   ```

6. Create system service:
   ```bash
   sudo nano /etc/systemd/system/wylloh.service
   ```
   
   Add this configuration (replace YOUR_USERNAME with your Pi username):
   ```
   [Unit]
   Description=Wylloh Media Platform
   After=network.target

   [Service]
   Type=simple
   User=YOUR_USERNAME
   WorkingDirectory=/opt/wylloh
   ExecStart=/usr/bin/node /opt/wylloh/index.js
   Restart=on-failure
   RestartSec=10
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=wylloh

   [Install]
   WantedBy=multi-user.target
   ```

7. Install Kodi addon:
   ```bash
   mkdir -p ~/.kodi/addons
   cp -r /opt/wylloh/kodi-addon/plugin.video.wylloh ~/.kodi/addons/
   ```

8. Start services:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable wylloh
   sudo systemctl start wylloh
   ```

9. Set up Kodi autostart:
   ```bash
   mkdir -p ~/.config/autostart
   nano ~/.config/autostart/kodi.desktop
   ```
   
   Add:
   ```
   [Desktop Entry]
   Type=Application
   Name=Kodi
   Exec=kodi
   ```

10. Restart the Raspberry Pi:
    ```bash
    sudo reboot
    ```

## Troubleshooting Seed One

- **Connection Issues**: 
  - Ensure MacBook and Raspberry Pi are on the same network
  - Verify MacBook IP address is correct in `/etc/wylloh/config.json`
  - Check MacBook firewall settings to allow ports 8545 and 8080

- **Service Issues**:
  - Check service status: `sudo systemctl status wylloh`
  - View logs: `sudo journalctl -u wylloh -n 50`
  - Restart service: `sudo systemctl restart wylloh`

- **Kodi Add-on Issues**:
  - Check Kodi is running: `ps aux | grep kodi`
  - Verify add-on installation: `ls -la ~/.kodi/addons/plugin.video.wylloh`
  - Check Kodi logs: `tail -f ~/.kodi/temp/kodi.log`

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