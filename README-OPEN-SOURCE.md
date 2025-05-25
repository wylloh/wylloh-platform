# Contributing to Wylloh Platform

Thank you for your interest in contributing to the Wylloh Platform! This document provides guidelines for setting up the project for development and contributing to the codebase.

## Project Status

The Wylloh Platform is currently in active development. We're working on building a decentralized ecosystem for film distribution with blockchain-based licensing and rights management.

### Current Development Focus

1. **Search/Blockchain Crawler Integration**
   - Advanced filtering for movie Store
   - Blockchain explorer for token ownership visibility
   - Intuitive discovery experience

2. **Pro User Experience**
   - Content management interface improvements
   - Robust tagging system
   - Streamlined movie tokenization process

3. **Storage and Content Delivery System**
   - User-powered IPFS node network with incentives
   - Progressive decentralization strategy
   - Browser-based content sharing with DRM protection

## Getting Started

### Prerequisites

- Node.js v16 or later
- npm or yarn
- MetaMask or compatible Web3 wallet
- IPFS node (optional for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/wylloh/wylloh-platform.git
   cd wylloh-platform
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   # Create .env files in the root, api, and client directories
   # Use the .env.example files as templates
   ```

4. Deploy contracts to Polygon Mumbai testnet (for blockchain development):
   ```bash
   yarn deploy:mumbai
   ```

5. Start the development server:
   ```bash
   yarn dev
   ```

## Project Structure

- `/api` - Backend API server (Express.js + TypeScript)
- `/client` - Frontend application (React + TypeScript)
- `/contracts` - Smart contracts (Solidity)
- `/shared` - Shared types and utilities
- `/docs` - Documentation including PRD (Product Requirements Document)

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`yarn test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure your code passes linting (`yarn lint`)

## Security Considerations

- Never commit sensitive information (API keys, private keys, etc.)
- Use environment variables for configuration
- Follow security best practices for smart contract development

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [@wylloh](https://github.com/wylloh)
- Email: [contact@wylloh.com](mailto:contact@wylloh.com)

## Additional Resources

- [Product Requirements Document](docs/prd/PRD.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md) 