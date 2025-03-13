# Wylloh

Wylloh is a blockchain-based media licensing system that revolutionizes how digital content is distributed, accessed, and monetized. Our platform creates a transparent, efficient, and equitable ecosystem where creators maintain control of their intellectual property while audiences gain flexible access to content through tokenized ownership.

## Project Structure

The project is organized as a monorepo with the following main components:

- `client`: React frontend application including player components
- `api`: Backend REST API services
- `storage`: IPFS/Filecoin storage service
- `contracts`: Smart contracts for the Polygon blockchain
- `seed-one`: Configuration for Seed One media player hardware
- `archive`: Archived code (including deprecated implementations)

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
yarn player  # Start the player in development mode
```

### Testing

Run tests for all workspaces:

```
yarn test
```

Or test individual components:

```
yarn test-contracts  # Test smart contracts
yarn test-player     # Test player components
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

The Wylloh Player is now fully integrated into the client application as a set of modular components. It's designed to work both in web browsers and on the Seed One hardware via Chromium in kiosk mode. The player architecture uses responsive design and platform detection to adapt to different environments.

#### Player Architecture

The player is built with these key components:

- `VideoPlayer`: Core video playback component
- `PlayerContainer`: Manages the overall player UI and controls
- `PlaybackControls`: Play/pause and related controls
- `VolumeControls`: Volume and mute functionality
- `DisplayControls`: Fullscreen, subtitles, and playback speed
- `TimeDisplay`: Progress bar and time display
- `PlatformContext`: Detects and provides platform information (web browser vs Seed One)

#### Running the Player

The player is now part of the client application:

```bash
cd client
yarn install
yarn start
```

For production build:
```bash
cd client
yarn install
yarn build
```

#### Installing on Seed One

The Seed One deployment uses Chromium in kiosk mode to provide a seamless media center experience.

1. Set up the Seed One hardware:
```bash
# Install dependencies
sudo apt update
sudo apt install -y chromium-browser

# Clone the repository
git clone https://github.com/your-organization/wylloh.git
cd wylloh

# Install the setup script
cd seed-one
sudo ./setup.sh
```

2. The setup script will:
   - Configure Chromium in kiosk mode
   - Set up auto-start on boot
   - Configure wallet connection
   - Set up network connectivity

3. For manual configuration, see the [Seed One Setup Guide](seed-one/README.md)