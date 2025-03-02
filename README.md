# Wylloh

Wylloh is a blockchain-based media licensing system that revolutionizes how digital content is distributed, accessed, and monetized. Our platform creates a transparent, efficient, and equitable ecosystem where creators maintain control of their intellectual property while audiences gain flexible access to content through tokenized ownership.

## Project Structure

The project is organized as a monorepo with the following main components:

- `client`: React frontend application
- `api`: Backend REST API services
- `storage`: IPFS/Filecoin storage service
- `contracts`: Smart contracts for the Polygon blockchain
- `seed-one`: Seed One media player application

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