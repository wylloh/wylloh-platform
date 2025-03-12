# Wylloh

Wylloh is a blockchain-based media licensing system that revolutionizes how digital content is distributed, accessed, and monetized. Our platform creates a transparent, efficient, and equitable ecosystem where creators maintain control of their intellectual property while audiences gain flexible access to content through tokenized ownership.

## Project Structure

The project is organized as a monorepo with the following main components:

- `client`: React frontend application
- `api`: Backend REST API services
- `storage`: IPFS/Filecoin storage service
- `contracts`: Smart contracts for the Polygon blockchain
- `seed-one`: Seed One media player application
- `wylloh-player`: Custom media player application based on Kodi (replaces previous Kodi add-on approach)

## Features

### IPFS Integration

Wylloh Player includes comprehensive IPFS support with the following features:

- Content retrieval from IPFS via multiple configurable gateways
- Intelligent gateway fallback for reliable content access
- Configurable content caching to improve performance
- Content pinning to ensure important content remains available
- Automatic pinning of owned content
- Foundation for network participation and distributed storage incentives

These features enhance content availability and reliability for users while establishing a framework for future distributed storage rewards.

### Blockchain Integration

- Wallet connection for token verification
- Smart contract integration for content ownership verification
- Token-based access control
- Support for NFT-based licenses

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn package manager
- IPFS Desktop (for local development)
- MongoDB (for the API service)
- MetaMask or another Ethereum wallet

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/wylloh.git
   cd wylloh
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Copy the `.env.example` file to `.env` and update the values:
   ```
   cp .env.example .env
   ```

4. Compile the smart contracts:
   ```
   yarn compile-contracts
   ```

### Development

Start all services in development mode:

```
yarn dev
```

Or start individual services:

```
yarn client  # Start the React frontend
yarn api     # Start the API server
yarn storage # Start the storage service
```

### Testing

Run tests for all workspaces:

```
yarn test
```

Or test individual components:

```
yarn test-contracts  # Test smart contracts
```

### Deployment

Build all packages for production:

```
yarn build
```

Deploy smart contracts to the Mumbai testnet:

```
yarn deploy-contracts:testnet
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the proprietary license - see the [LICENSE](LICENSE) file for details.

### Wylloh Player

The Wylloh Player is a custom media player application based on Kodi. Building it requires several dependencies and specific configurations.

#### Building the Wylloh Player

For detailed instructions on building the Wylloh Player, see the [BUILDING_DEPENDENCIES.md](wylloh-player/BUILDING_DEPENDENCIES.md) file.

Quick start for Linux/Debian-based systems:

```bash
# Clone the repository if you haven't already
git clone https://github.com/your-organization/wylloh.git
cd wylloh-platform

# Run the setup script to install dependencies and make necessary modifications
cd wylloh-player
sudo ./setup-build-environment.sh

# Build the player
mkdir -p build && cd build
cmake \
  -DAPP_RENDER_SYSTEM=gles \
  -DENABLE_INTERNAL_FLATBUFFERS=ON \
  -DENABLE_INTERNAL_FFMPEG=ON \
  -DCORE_PLATFORM_NAME=x11 \
  -DENABLE_TESTING=OFF \
  ..
make -j4  # Adjust the number based on your CPU cores
```