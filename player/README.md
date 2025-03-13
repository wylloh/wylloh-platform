# Wylloh Player

A web-based media player for tokenized content with native extensions for enhanced performance and security.

## Architecture Overview

The Wylloh Player is built using a "web-first" approach with strategic native extensions for platform-specific capabilities:

### Core Components

1. **Web-based Player** (`/web`)
   - PWA (Progressive Web App) architecture
   - React-based UI components
   - Media Source Extensions (MSE) for adaptive streaming
   - Web3 integration for wallet connectivity

2. **Native Extensions** (`/extensions`)
   - Hardware acceleration bridges
   - Secure storage modules
   - IPFS node integration
   - Offline license verification

3. **Shared Core** (`/src`)
   - Player state management
   - License verification logic
   - Content metadata handling
   - Playback control

## Integration with Existing Code

This player leverages existing code from:

- **Client Web App**: Reuses UI components and wallet integration
- **Seed One Application**: Adapts blockchain verification and IPFS connectivity
- **Previous Player**: Incorporates media format handling knowledge

## Development

### Local Development Setup

```bash
# Install dependencies
cd player
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build web version
npm run build:web

# Build with native extensions
npm run build:desktop
```

### Platform-specific Builds

Instructions for building platform-specific versions (including Seed One) will be added as they are developed.

## Implementation Status

- [ ] Core web player functionality
- [ ] Wallet integration
- [ ] License verification
- [ ] IPFS content retrieval
- [ ] Offline playback
- [ ] Native extensions for Seed One

## Relationship to Other Components

- Uses blockchain interfaces from `shared/blockchain`
- Leverages IPFS utilities from `shared/ipfs`
- Integrates with the Wylloh web platform for content discovery and purchasing
- Provides playback capabilities for the Seed One hardware 