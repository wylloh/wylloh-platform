# Seed One Browser-Based Launcher

This document outlines the approach for implementing a browser-based launcher for the Seed One device, replacing the previous Kodi-based implementation.

## Overview

The Seed One will now use a Chromium-based browser in kiosk mode to run the web-based Wylloh Player, with native extensions providing hardware-specific capabilities.

## Architecture

```
Seed One Device (Raspberry Pi 4)
├── OS Layer (Debian/Raspberry Pi OS)
├── Browser Layer (Chromium in Kiosk Mode)
│   └── Web Player (PWA from Wylloh Platform)
└── Native Extensions
    ├── Hardware Access
    │   ├── HDMI-CEC Control
    │   ├── Hardware Video Decoding
    │   └── Storage Management
    ├── Wallet Integration
    │   ├── Secure Key Storage
    │   └── Transaction Signing
    └── IPFS Integration
        ├── Local IPFS Node
        ├── Content Pinning
        └── Gateway Management
```

## Implementation Plan

### 1. Base System Configuration

1. **OS Configuration**
   - Install Raspberry Pi OS (64-bit)
   - Configure auto-login
   - Disable screen blanking and screensaver
   - Optimize OS for media playback

2. **Network Configuration**
   - Setup WiFi/Ethernet configuration
   - Configure static IP (optional)
   - Enable SSH for remote administration

3. **Storage Configuration**
   - Format and mount external storage
   - Configure auto-mounting
   - Set up appropriate permissions

### 2. Browser Environment

1. **Chromium Installation**
   - Install latest Chromium browser
   - Configure GPU acceleration
   - Optimize memory usage

2. **Kiosk Mode Setup**
   - Create autostart configuration
   - Configure Chromium flags for kiosk mode
   - Implement touch/remote-friendly interface
   - Disable browser UI elements

3. **PWA Configuration**
   - Configure service worker support
   - Enable persistent storage
   - Set up offline capabilities

### 3. Native Extensions

1. **Extension Framework**
   - Install Node.js for extension support
   - Create native messaging bridge
   - Setup secure communication protocol

2. **Hardware Extensions**
   - Implement HDMI-CEC using libcec
   - Configure hardware video acceleration
   - Add remote control support

3. **Blockchain Extensions**
   - Port existing wallet code from seed-one
   - Implement secure key storage
   - Create wallet backup mechanism

4. **IPFS Extensions**
   - Install and configure IPFS daemon
   - Implement content pinning logic
   - Create gateway management service

### 4. Integration

1. **Browser-Extension Communication**
   - Implement messaging protocol
   - Create JavaScript bridge API
   - Handle permissions and security

2. **System Services**
   - Create systemd services for auto-start
   - Implement health monitoring
   - Add crash recovery

3. **Updates**
   - Implement OTA update mechanism
   - Create version management
   - Add rollback capability

## Setup Script

The following capabilities will be implemented in a setup script:

```bash
#!/bin/bash

# Install dependencies
apt-get update
apt-get install -y chromium-browser nodejs npm libcec-dev

# Configure autostart
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/wylloh-player.desktop << EOF
[Desktop Entry]
Type=Application
Name=Wylloh Player
Exec=chromium-browser --kiosk --app=https://player.wylloh.com --disable-restore-session-state --noerrdialogs --disable-infobars --no-first-run
EOF

# Install extensions
npm install -g wylloh-seed-extensions

# Configure system services
systemctl enable wylloh-ipfs.service
systemctl enable wylloh-extensions.service

# Setup hardware acceleration
...
```

## Next Steps

1. Create a basic Chromium kiosk mode setup for testing
2. Port the existing wallet integration to a native extension
3. Implement the IPFS node functionality
4. Configure the browser for optimal performance on the Raspberry Pi
5. Test the full system with the web-based player 