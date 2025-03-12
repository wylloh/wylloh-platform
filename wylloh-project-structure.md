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

## Wylloh Player Architecture (`/wylloh-player`)

As a Kodi fork, the Wylloh Player inherits Kodi's complex architecture while adding custom components for blockchain and IPFS integration. Below is the high-level directory structure:

```
wylloh-player/
├── addons/                 # Core and optional addons
│   ├── skin.wylloh/        # Custom Wylloh skin/UI
│   └── ...
├── cmake/                  # CMake modules and configuration
│   ├── modules/            # CMake finder scripts
│   ├── scripts/            # Build helper scripts
│   └── platform/           # Platform-specific configurations
├── docs/                   # Documentation
├── lib/                    # Core libraries
│   ├── ffmpeg/             # Media playback (key dependency)
│   ├── cpluff/             # Plugin system
│   └── ...
├── system/                 # System-specific components
│   ├── players/            # Media player components
│   └── settings/           # Default configurations
├── tools/                  # Build and development tools
│   ├── buildsteps/         # Build scripts and helpers
│   ├── depends/            # Dependency management system
│   └── Linux/              # Linux-specific tools
├── xbmc/                   # Core application source
│   ├── application/        # Main application
│   ├── cores/              # Core functionality
│   ├── filesystem/         # File system abstraction
│   ├── guilib/             # UI framework
│   ├── platform/           # Platform-specific code
│   ├── wylloh/             # Custom Wylloh components
│   │   ├── wallet/         # Blockchain wallet integration
│   │   ├── ipfs/           # IPFS integration
│   │   └── tokens/         # Token verification
│   └── windowing/          # Display handling
└── CMakeLists.txt          # Main build configuration
```

### Key Components

#### 1. Core Architecture (inherited from Kodi)
- **Application (`xbmc/application/`)**: Main application loop and initialization
- **GUI Library (`xbmc/guilib/`)**: UI rendering and controls
- **File System (`xbmc/filesystem/`)**: Virtual file system for multiple sources
- **Cores (`xbmc/cores/`)**: Media playback engines and decoders

#### 2. Custom Wylloh Components (`xbmc/wylloh/`)
- **Wallet Integration**: Connects to blockchain wallets for token verification
- **IPFS Integration**: Native support for IPFS protocol and content addressing
- **Token Verification**: Validates ownership of content through blockchain tokens

#### 3. Build System
- **CMake**: Primary build system
- **Depends System (`tools/depends/`)**: Handles complex dependencies
- **Build Steps (`tools/buildsteps/`)**: Platform-specific build scripts

### Build Dependencies

The Wylloh Player has several critical dependencies:

1. **FFmpeg**: Media decoding (audio/video playback)
2. **OpenGL/GLES**: Rendering
3. **CMake**: Build system
4. **Web3 Libraries**: Blockchain interaction
5. **IPFS Libraries**: Content addressing and retrieval

### Build Approaches

Two main approaches to building Wylloh Player:

1. **Direct Build**: Using system libraries and manually satisfying dependencies
   - Faster for development when dependencies are already available
   - More prone to versioning issues

2. **Depends System Build**: Using Kodi's dedicated dependency system
   - More reliable across different environments
   - Slower initial build but better consistency
   - Recommended for Seed One deployment

### Customization Points

Key areas where Wylloh Player extends Kodi:

1. **Content Sources**: Extended to support IPFS URIs and gateways
2. **Authentication**: Added wallet-based authentication
3. **UI/UX**: Custom skin with token and ownership indicators
4. **Settings**: Additional configuration for blockchain and IPFS

### Common Build Issues

1. **FFmpeg Integration**: Version compatibility issues
2. **Wallet Dependencies**: Missing crypto libraries
3. **Permission Issues**: File access during build process
4. **Target Naming**: Inconsistencies in target references

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