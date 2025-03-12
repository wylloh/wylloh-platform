#!/bin/bash

# Wylloh Player Demo Configuration Script for Seed One
# This script configures Wylloh Player for the demo environment on Seed One
# It can be run automatically with parameters from init-demo.sh

# Default values
LOCAL_IP="localhost"
GANACHE_PORT=8545
IPFS_PORT=8080
CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
TOKEN_FACTORY_ADDRESS="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local-ip=*)
      LOCAL_IP="${1#*=}"
      shift
      ;;
    --ganache-port=*)
      GANACHE_PORT="${1#*=}"
      shift
      ;;
    --ipfs-port=*)
      IPFS_PORT="${1#*=}"
      shift
      ;;
    --contract=*)
      CONTRACT_ADDRESS="${1#*=}"
      shift
      ;;
    --token-factory=*)
      TOKEN_FACTORY_ADDRESS="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown parameter: $1"
      shift
      ;;
  esac
done

# Create config directory if it doesn't exist
sudo mkdir -p /etc/wylloh

# Create Wylloh configuration file
sudo tee /etc/wylloh/config.json > /dev/null << EOF
{
  "providerUrl": "http://$LOCAL_IP:$GANACHE_PORT",
  "ipfsGateway": "http://$LOCAL_IP:$IPFS_PORT/ipfs/",
  "contractAddress": "$CONTRACT_ADDRESS",
  "tokenFactoryAddress": "$TOKEN_FACTORY_ADDRESS",
  "demoMode": true,
  "logLevel": "info",
  "mediaPath": "/var/lib/wylloh/media",
  "metadataPath": "/var/lib/wylloh/metadata"
}
EOF

echo "Wylloh Player configuration updated for Seed One demo environment."
echo "Local IP: $LOCAL_IP"
echo "Ganache Port: $GANACHE_PORT"
echo "IPFS Gateway Port: $IPFS_PORT"
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Token Factory Address: $TOKEN_FACTORY_ADDRESS"

# Set permissions
sudo chown $(whoami):$(whoami) /etc/wylloh/config.json

# Create required directories if they don't exist
sudo mkdir -p /var/lib/wylloh/media
sudo mkdir -p /var/lib/wylloh/metadata
sudo chown -R $(whoami):$(whoami) /var/lib/wylloh

echo "Setup complete. Please restart Wylloh Player on your Seed One if it's running." 