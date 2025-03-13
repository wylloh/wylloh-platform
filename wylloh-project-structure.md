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

### 6. Wylloh Player (`/player`)
- **Purpose**: Web-based media player with native extensions
- **Technology**: Progressive Web App, React, WebAssembly, native extensions
- **Status**: Active development, replacing previous Kodi-based player
- **Key Features**:
  - Cross-platform media playback
  - Blockchain license verification
  - IPFS content retrieval
  - Offline playback support
  - Hardware acceleration via native extensions
  - Synchronized experience across devices

## Web-Based Player Architecture (`/player`)

The Wylloh Player now uses a web-first approach with strategic native extensions for platform-specific capabilities:

```
player/
├── src/                 # Core player functionality
│   ├── components/      # UI components
│   ├── hooks/           # React hooks
│   ├── services/        # Core services (playback, metadata, etc.)
│   └── state/           # State management
├── extensions/          # Native extensions
│   ├── hardware/        # Hardware acceleration 
│   ├── storage/         # Secure storage
│   └── ipfs/            # IPFS node integration
├── web/                 # Pure web implementation
│   ├── app/             # Web app shell
│   ├── pwa/             # Progressive Web App capabilities
│   └── build/           # Build output
└── platforms/           # Platform-specific code
    ├── desktop/         # Desktop wrapper (Electron/Tauri)
    └── seed-one/        # Seed One specific implementation
```

### Integration with Shared Components

The player leverages shared code from:

```
shared/
├── blockchain/          # Blockchain integration
│   ├── contracts/       # Smart contract interfaces
│   ├── wallet/          # Wallet connection
│   └── verification/    # License verification
├── ipfs/                # IPFS utilities
│   ├── content/         # Content addressing
│   ├── gateways/        # Gateway management
│   └── cache/           # Caching strategies
└── media/               # Media utilities
    ├── formats/         # Format handling
    ├── metadata/        # Metadata extraction
    └── playback/        # Playback helpers
```

## Evolution of the Media Player

The Wylloh media player has evolved through different approaches:

1. **Initial Phase**: Kodi with Add-on
   - Implementation in `seed-one/kodi-addon/`
   - Used Kodi as the base player with a custom add-on
   - Limited integration capabilities with blockchain

2. **Intermediate Phase**: Custom Kodi Fork (Wylloh Player)
   - Implementation in `/archive/kodi-player/`
   - Customized Kodi codebase for deeper integration
   - Challenging build process and maintenance

3. **Current Phase**: Web-Based Player with Native Extensions
   - Implementation in `/player/`
   - Progressive Web App with platform-specific extensions
   - Better cross-platform consistency
   - Improved development velocity
   - Enhanced integration with blockchain and IPFS

## Integration Points

The various components of the Wylloh platform integrate through well-defined interfaces:

### 1. Blockchain Integration

- **Web Client**: Browser wallet connection via Web3.js
- **Web Player**: Same Web3 integration as web client
- **Seed One**: Native wallet implementation via ethers.js 

### 2. IPFS Content Delivery

- **Web Client**: Uses HTTP gateways with browser caching
- **Web Player**: Uses HTTP gateways with enhanced browser caching
- **Seed One**: Native IPFS node with local pinning and caching

### 3. License Verification

- **Shared Implementation**: Core verification logic in shared/blockchain library 
- **Web Client**: Client-side verification with server validation
- **Web Player**: Client-side verification with optional server validation
- **Seed One**: Local verification with cached validation results for offline use

### 4. Content Browsing

Both web interface (`client/`) and Wylloh Player (`player/`) share:
- Content metadata structures
- Display components
- Filtering logic
- Search implementation

### 5. Content Playback

- **Primary**: Through Wylloh Player (`player/`)
- **Preview**: Direct in web interface for samples
- **Offline**: Supported on Seed One with downloaded content

### 6. Wallet Integration

All platforms use a common protocol for:
- Wallet connection
- Token verification
- License retrieval
- Transaction signing

## Feature Matrix

| Feature | Web Client | Web Player | Seed One |
|---------|------------|------------|----------|
| Content Discovery | Full | Basic | Basic |
| Content Purchase | Full | No | No |
| Content Playback | Preview Only | Full | Full |
| Offline Access | No | Limited | Full |
| IPFS Integration | Gateway | Gateway | Native Node |
| Wallet Integration | Browser | Browser | Native |
| License Management | Full | View Only | View Only |

## Development Focus

Current development priorities:

1. Enhancing the Web Player with robust playback and verification
2. Integrating shared libraries across all components
3. Optimizing the Seed One browser-based experience
4. Creating a seamless cross-device experience 
5. Building offline capabilities on all platforms

## Deployment Architecture

- **Web Client & Web Player**: Deployed to CDN/hosting as static assets
- **Server**: Deployed to cloud provider (AWS/GCP)
- **Seed One**: Local installation on Raspberry Pi hardware

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