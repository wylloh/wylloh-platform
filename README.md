# Wylloh Protocol

An open protocol for movie tokenization and distribution, enabling cross-platform interoperability and direct relationships between creators and audiences.

## 🚀 Project Status

**Current Status:** Active Development

The Wylloh Platform is currently in active development. We're working on building a decentralized ecosystem for film distribution with blockchain-based licensing and rights management. This repository is now open to community contributors who want to help shape the future of digital media distribution.

**[Read our complete Product Requirements Document (PRD)](PRD.md)**

## Vision

Wylloh aims to create a decentralized ecosystem for film distribution, where:
- Movies can be tokenized and traded across platforms
- Creators maintain direct relationships with their audience
- Quality and authenticity are guaranteed through reputation systems
- Users can lend or rent their movie tokens
- Royalties are automatically distributed to rights holders
- The network grows stronger as more users participate

## Core Features

### Smart Contracts
- **Token Management**: ERC-1155 based movie tokens with stacking capabilities
- **Marketplace**: Cross-platform trading protocol
- **Rights Management**: Flexible rights tiers and thresholds
- **Royalty Distribution**: EIP-2981 compliant royalty system
- **Content Lending**: Secure token-based lending with blockchain verification

### Privacy-First Analytics
- **"Movies That Don't Watch You Back"**: Unlike traditional streaming platforms, Wylloh doesn't collect personal user data
- **Blockchain-Native Insights**: Analytics based on public blockchain data rather than invasive tracking
- **Wallet Behavior Patterns**: Analyze token holder distribution and transaction patterns without compromising privacy
- **Token Economics**: Track token velocity, distribution, and market activity through on-chain data
- **Holder Categories**: Identify patterns between personal viewers and commercial exhibitors while preserving anonymity
- **Creator-Focused Metrics**: Provide valuable insights to creators without sacrificing user privacy
- **Transparent Methodology**: Open approach to data collection with no hidden tracking

### Content Lending System
- **Smart Contract Verification**: Secure lending through blockchain-verified transactions
- **Lending Agreements**: Customizable lending terms including duration and price
- **Automatic Returns**: Smart contract-enforced content return at term completion
- **Royalty Distribution**: Ensures creators receive royalties from lending transactions
- **Lending History**: Track lending history for all content with complete transparency
- **Cross-Platform**: Lend and borrow content across any Wylloh-compatible platform

### Modular Licensing
- **Token Stacking**: Combine multiple tokens to unlock higher-tier rights
- **Commercial Rights**: Access to DCP and IMF files for commercial use
- **Bundle Management**: Create and unbundle token packages
- **Rights Thresholds**: Configurable quantity-based rights unlocking
  - 1 token: Personal viewing rights
  - 100 tokens: Small venue screening (up to 50 seats)
  - 5,000 tokens: Streaming platform rights with IMF file access
  - 10,000 tokens: Theatrical exhibition rights with DCP access
  - 50,000 tokens: National distribution rights

### Security
- **Content Encryption**: AES-256-GCM encryption for all media
- **Key Management**: Token-based access control
- **License Verification**: On-chain verification system
- **Wallet Authentication**: Secure wallet-based access
- **Anti-Piracy**: Forensic watermarking and content fingerprinting
- **Lending Protection**: Blockchain-enforced content return with automatic license revocation
- **Regular Security Scanning**: Regular security scanning through automated CI/CD processes
- **Pre-Launch Security Verification**: A detailed pre-launch security verification plan
- **Ongoing Security Maintenance**: Ongoing security maintenance and monitoring

For developers:
- See `.github/security-plan.md` for our detailed security approach
- Run `./scripts/security-check.sh` to run a comprehensive security scan locally
- Run `npm audit` to check for dependency vulnerabilities
- Follow secure coding practices detailed in our development guidelines

### Integration
- **Cross-Platform**: Interoperable marketplace protocol
- **API-First**: RESTful API for easy integration
- **IPFS Storage**: Decentralized content storage
- **Polygon Network**: Scalable blockchain infrastructure

### Seed Network
- **Distributed Storage**: Each Seed acts as an IPFS node
- **Network Growth**: Network strengthens as more Seeds join
- **Content Delivery**: Optimized content delivery through distributed nodes
- **Resource Contribution**: Seeds contribute storage and bandwidth
- **Reward System**: Incentives for network participation (coming soon)

### User-Powered Storage Network

The Wylloh platform now includes a browser-based IPFS node implementation allowing users to directly contribute to the network:

- **Browser-Based Nodes**: Users can run IPFS nodes directly in their browsers without additional software
- **Resource Contribution**: Users can contribute storage and bandwidth to strengthen the network
- **Configurable Contribution**: Users control how much storage and bandwidth they contribute
- **Metrics Tracking**: Detailed metrics on contribution and resource usage
- **Reward System**: Users earn Wylloh tokens based on their contribution level
- **Network Scaling**: As userbase grows, storage costs decrease rather than increase
- **P2P Content Delivery**: Content is delivered directly between users via WebRTC when possible
- **Fallback Mechanism**: Automatic fallback to traditional CDN when P2P delivery isn't available

### Enhanced Encryption and Access Control

The platform includes a robust encryption and access control system:

- **Multi-level Access Control**: Granular access levels including view-only, download, metadata editing, and full control
- **Key Rotation**: Support for rotating encryption keys without re-encrypting content
- **Performance Optimizations**: Adaptive encryption algorithms based on content size and type
- **Expiring Access**: Ability to grant temporary access with automatic expiration
- **Access Delegation**: Content owners can delegate access rights to other users
- **Revocation**: Quick revocation of access without content re-encryption

### Content Delivery System

The Wylloh platform includes an advanced content delivery system with the following features:

- **CDN Integration**: Content is delivered through an optimized CDN that selects the fastest available IPFS gateway based on real-time performance metrics
- **Adaptive Gateway Selection**: The system continuously monitors gateway performance and automatically switches to faster gateways as needed
- **Content Prefetching**: Popular content is prefetched to ensure fast loading times for users
- **Caching**: Content delivery includes proper cache control headers for better performance
- **Streaming Optimization**: Video streaming is optimized for minimal buffering and fast start times
- **Fallback Mechanism**: Multiple fallback options ensure content is always available, even if some gateways fail

### Long-term Storage with Filecoin

For reliable long-term storage, the platform integrates with Filecoin:

- **Automated Archiving**: Content is automatically archived to Filecoin after a configurable period
- **Cost-effective Storage**: Cold content moves to Filecoin for cost-efficient long-term preservation
- **Seamless Retrieval**: Content is automatically retrieved from Filecoin when needed if not in IPFS cache
- **Storage Deals Management**: The system handles creation and management of Filecoin storage deals
- **Deal Monitoring**: Active monitoring of storage deals ensures content remains available

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
   cp .env.example .env
   ```

4. Deploy contracts to Polygon Mumbai testnet:
   ```bash
   yarn deploy:mumbai
   ```

### Running a Seed

A Seed is a combination of a media player and IPFS node that can run on:
- Raspberry Pi 4 (8GB RAM recommended)
- Other small form factor PCs
- Any device with HDMI output and network connectivity

Requirements:
- 4GB+ RAM
- 16GB+ storage for OS
- External storage for content (USB 3.0 HDD/SSD)
- Gigabit Ethernet or Wi-Fi 5
- HDMI output

## Protocol Documentation

### Smart Contracts

- [Token Contract](contracts/token/WyllohToken.sol)
- [Marketplace Contract](contracts/marketplace/WyllohMarketplace.sol)
- [Rights Manager](contracts/rights/RightsManager.sol)
- [Royalty Distributor](contracts/royalty/RoyaltyDistributor.sol)
- [Content Lending Contract](contracts/token/ContentLending.sol)

### Integration Guide

See [INTEGRATION.md](docs/INTEGRATION.md) for detailed integration instructions.

## Contributing

We welcome contributions from the community! Please see [README-OPEN-SOURCE.md](README-OPEN-SOURCE.md) for detailed guidelines on how to contribute to the project.

### Development Focus Areas

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

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [@wylloh](https://github.com/wylloh)
- Email: [contact@wylloh.com](mailto:contact@wylloh.com)

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [IPFS](https://ipfs.io/) for decentralized content storage
- [Polygon](https://polygon.technology/) for scalable blockchain infrastructure