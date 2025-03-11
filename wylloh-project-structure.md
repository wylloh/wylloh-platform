# Wylloh Project Structure Guide

This document provides a comprehensive overview of the Wylloh project structure to help maintain context during development and testing. It clarifies the relationships between different components and their current status.

## Overview

The Wylloh platform consists of several key components organized in a monorepo structure:

```
wylloh-platform/
├── client/               # Web frontend (React)
├── api/                  # Backend services 
├── storage/              # IPFS/FileCoin integration
├── contracts/            # Smart contracts
├── seed-one/             # Reference Kodi add-on implementation (deprecated)
├── wylloh-player/        # Custom Kodi fork (current player implementation)
└── demo-assets/          # Sample content for demo
```

## Component Relationships

```
+------------------+     +---------------------+
|  Web Interface   |     |  Wylloh Player      |
|  (client/)       |<--->|  (wylloh-player/)   |
+------------------+     +---------------------+
        ^                          ^
        |                          |
        v                          |
+------------------+     +---------+---------+
|  Backend API     |     |  Seed One         |
|  (api/)          |     |  (seed-one/)      |
+------------------+     +-------------------+
        ^                    |
        |                    | Reference implementation
        v                    v
+------------------+     +-------------------+
|  Storage Service |     |  Kodi Add-on      |
|  (storage/)      |     |  (deprecated)     |
+------------------+     +-------------------+
        ^
        |
        v
+------------------+
|  Smart Contracts |
|  (contracts/)    |
+------------------+
```

## Component Details

### 1. Client (`/client`)
- **Purpose**: Web interface for content management, minting tokens, and marketplace interactions
- **Technology**: React, TypeScript, Ethers.js
- **Status**: Active development
- **Key Features**:
  - User authentication
  - Content uploading
  - Token minting
  - Marketplace browsing
  - Wallet integration

### 2. API (`/api`)
- **Purpose**: Backend services for metadata management and user operations
- **Technology**: Node.js, Express, MongoDB
- **Status**: Active development
- **Key Features**:
  - User management
  - Content metadata
  - API keys and authentication
  - Analytics

### 3. Storage (`/storage`)
- **Purpose**: IPFS and FileCoin integration for decentralized content storage
- **Technology**: Node.js, IPFS HTTP client
- **Status**: Active development
- **Key Features**:
  - Content uploading to IPFS
  - Pinning management
  - Gateway management
  - Encryption

### 4. Contracts (`/contracts`)
- **Purpose**: Smart contracts for token management and ownership verification
- **Technology**: Solidity, Hardhat
- **Status**: Active development
- **Key Features**:
  - ERC-1155 token implementation
  - Ownership verification
  - Content licensing

### 5. Seed One (`/seed-one`)
- **Purpose**: Original implementation as a Kodi add-on
- **Technology**: Python, Kodi add-on framework
- **Status**: Deprecated, reference implementation
- **Key Features**:
  - Wallet connection
  - Content playback
  - Token verification
  - IPFS content retrieval

### 6. Wylloh Player (`/wylloh-player`)
- **Purpose**: Custom media player based on Kodi fork
- **Technology**: C++, CMake
- **Status**: Active development, current player implementation
- **Key Features**:
  - Native IPFS integration
  - Blockchain wallet integration
  - Token-based content access
  - Enhanced UI for media playback

## Evolution of the Media Player

The Wylloh media player has evolved through different approaches:

1. **Initial Phase**: Kodi Add-on
   - Implementation in `/seed-one/kodi-addon/`
   - Python-based plugin for unmodified Kodi
   - Limited UI customization
   - Integration through Kodi API

2. **Current Phase**: Custom Kodi Fork (Wylloh Player)
   - Implementation in `/wylloh-player/`
   - Deep integration with C++ codebase
   - Custom branding and UI
   - Native IPFS and blockchain integration
   - Enhanced security and performance

## Integration Points

### IPFS Integration
- **Web Interface**: Uses `storage` service for IPFS uploads
- **Wylloh Player**: Native integration via `IPFSManager` class
- **Reference**: Original implementation in `seed-one/kodi-addon/resources/lib/ipfs_manager.py`

### Blockchain Integration
- **Web Interface**: Direct wallet connection via web3 provider
- **Wylloh Player**: Native integration via `WalletManager` and `WalletConnection` classes
- **Reference**: Original implementation in `seed-one/kodi-addon/resources/lib/wallet.py`

## Demo Environment

The demo environment allows testing with local services:

- Local Ganache blockchain instead of public networks
- Local IPFS node instead of public gateways
- Sample content pre-loaded for testing

### Demo Components
- **`init-demo.sh`**: Initializes the demo environment
- **`stop-demo.sh`**: Stops all demo services
- **`DEMO-README.MD`**: Documentation for demo setup
- **`/demo-assets/`**: Sample content for testing

## Context During Testing

When testing, it's important to understand which component handles which functionality:

1. **Content Upload**: Web interface (`client/`) through storage service (`storage/`)
2. **Token Minting**: Web interface (`client/`) through smart contracts (`contracts/`)  
3. **Content Browsing**: Both web interface (`client/`) and Wylloh Player (`wylloh-player/`)
4. **Content Playback**: Primary through Wylloh Player (`wylloh-player/`)
5. **Wallet Integration**: Both web interface and Wylloh Player have their own implementations

## Ongoing Development Focus

Current development focuses on the following areas:

1. Enhancing the Wylloh Player with robust IPFS and blockchain integration
2. Improving offline demo capabilities
3. Creating a seamless experience between web platform and player
4. Implementing network participation features for distributed storage 