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

After running the initialization script, you'll receive instructions for configuring your Raspberry Pi. These will include:

1. Configuration file path on the Raspberry Pi: `/etc/wylloh/config.json`
2. Required settings pointing to your MacBook's local services
3. Instructions for restarting the Wylloh service

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