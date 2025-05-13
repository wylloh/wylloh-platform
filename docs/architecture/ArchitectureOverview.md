# Wylloh Platform Architecture Overview

## System Architecture

The Wylloh platform is a distributed system with multiple components working together to provide a blockchain-based media licensing and distribution platform. The architecture follows a microservices approach, with clear separation of concerns.

```
                   ┌─────────────┐
                   │    Users    │
                   └──────┬──────┘
                          │
                          ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Web UI    │◄──►│ API Service │◄──►│  Database   │
└──────┬──────┘    └──────┬──────┘    └─────────────┘
       │                  │
       │                  │
┌──────▼──────┐    ┌──────▼──────┐    ┌─────────────┐
│Wallet Connect│    │   Storage   │◄──►│IPFS/Filecoin│
└─────────────┘    │   Service   │    └─────────────┘
                   └──────┬──────┘
                          │
                          ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Seed One   │◄──►│  Blockchain │◄──►│Smart Contract│
│   Player    │    │   Network   │    │    Layer    │
└──────┬──────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│ Kodi Addon  │
└─────────────┘
```

## Components Overview

### 1. Web UI (Frontend)
- **Technology**: React, TypeScript, Material UI
- **Purpose**: User interface for browsing, purchasing, and managing content
- **Key Features**: Content marketplace, creator dashboard, player interface, token-gated content access

### 2. API Service
- **Technology**: Express, TypeScript, JWT
- **Purpose**: Central API for authentication, content management
- **Key Features**: User management, content metadata, marketplace

### 3. Storage Service
- **Technology**: Express, IPFS integration
- **Purpose**: Content storage and retrieval
- **Key Features**: Encrypted storage, metadata management, IPFS/Filecoin integration

### 4. Blockchain Integration
- **Technology**: Ethers.js, Polygon blockchain
- **Purpose**: Token management and verification
- **Key Features**: License tokenization, ownership verification, rights management

### 5. Seed One Player Application
- **Technology**: Electron, Node.js
- **Purpose**: Dedicated media player with license verification
- **Key Features**: Content playback, license verification, wallet integration

### 6. Kodi Addon
- **Technology**: Python, Kodi API
- **Purpose**: Integration with Kodi media center
- **Key Features**: Content browsing, license verification, playback

## Data Flow

### Content Upload Flow
1. Creator uploads content through the Web UI
2. Content is processed by the API Service
3. Content is encrypted and stored via the Storage Service
4. Content is pinned to IPFS
5. Metadata is stored in the database

### Tokenization Flow
1. Creator initiates tokenization through the Creator Dashboard
2. API Service validates content
3. Smart contracts are called to create token
4. Token metadata and rights are configured
5. Blockchain transaction is processed
6. Database is updated with token information

### Content Consumption Flow
1. User browses content in the Marketplace
2. User purchases license tokens
3. Token ownership is verified on the blockchain
4. User accesses content via Web Player, Seed One, or Kodi
5. Player verifies license through blockchain integration
6. Content is streamed from IPFS through Storage Service

## Security Architecture

The Wylloh platform implements a comprehensive security architecture to protect content while maintaining the benefits of decentralized storage.

### Content Encryption Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│   User    │────►│ Encryption │────►│   IPFS    │────►│Content CID│
│  Upload   │     │  Service   │     │  Storage  │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                        │                                   │
                        ▼                                   │
                  ┌───────────┐                             │
                  │ Encryption │                             │
                  │    Key    │                             │
                  └───────────┘                             │
                        │                                   │
                        ▼                                   ▼
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Wallet   │◄────│    Key    │◄────│ Blockchain │◄────│  Content  │
│ Signature │     │ Management│     │  Contract  │     │ Metadata  │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

1. **Upload Process**:
   - Content is encrypted client-side before uploading to IPFS
   - Encryption keys are generated uniquely for each content
   - Content metadata and CID are stored separately from encryption keys

2. **Key Management**:
   - Encryption keys are associated with blockchain token ownership
   - Keys are stored securely and only accessible to authorized token holders
   - Key retrieval requires blockchain verification of token ownership

3. **Access Control**:
   - Content access is gated by token ownership verification
   - The system verifies on-chain that the user possesses the required tokens
   - Decryption occurs client-side only after verification succeeds

### Key Management Service

The Key Management Service is responsible for securely handling content encryption keys:

- **Key Storage**: Securely stores encryption keys, associating them with content IDs
- **Token Verification**: Verifies token ownership before granting access to keys
- **Key Retrieval**: Provides encryption keys only to authorized users
- **Wallet Association**: Links encryption keys to wallet addresses for verification
- **Cache Management**: Maintains a temporary cache of decryption keys for performance

This security architecture ensures that even though content is stored on decentralized IPFS networks, only authorized token holders can access and decrypt the content, maintaining the integrity of the licensing model.

## Security Model

The platform implements a multi-layered security approach:

1. **Authentication**: JWT-based authentication for traditional web access
2. **Wallet Authentication**: Blockchain wallet-based authentication
3. **Content Encryption**: AES-256 encryption for content
4. **License Verification**: On-chain verification of token ownership
5. **HTTPS**: All API communication over secure channels
6. **Periodic Verification**: Regular re-verification of license during playback

## Analytics Architecture

Wylloh implements a privacy-first analytics architecture that provides valuable insights to content creators without compromising user privacy. Unlike traditional streaming platforms that collect extensive personal data, Wylloh's analytics are built entirely on blockchain data.

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│ Blockchain │────►│ Analytics │────►│  Creator  │
│ Indexer   │     │  Service  │     │ Dashboard │
└───────────┘     └───────────┘     └───────────┘
       │                │                 ▲
       │                ▼                 │
       │          ┌───────────┐          │
       └─────────►│  Pattern  │──────────┘
                  │ Analysis  │
                  └───────────┘
```

### Privacy-First Principles

1. **No Personal Data Collection**: The platform does not collect personal viewing habits, demographics, or behavioral data
2. **Blockchain-Native Insights**: All analytics are derived from public blockchain data
3. **Pattern Analysis**: Focuses on token distribution, velocity, and holder categories
4. **Anonymized Data**: All wallet addresses are treated as anonymous entities
5. **Transparent Methodology**: Open approach to data collection with no hidden tracking

### Analytics Components

1. **Blockchain Indexer**:
   - Monitors on-chain events related to content tokens
   - Tracks token transfers, sales, and ownership changes
   - Indexes holder information without personal identification

2. **Analytics Service**:
   - Processes blockchain data into meaningful insights
   - Identifies patterns in token distribution and market activity
   - Categorizes wallet behavior (e.g., personal viewers vs. commercial exhibitors)
   - Calculates token economics metrics like velocity and liquidity

3. **Pattern Analysis**:
   - Applies algorithms to detect meaningful patterns in token data
   - Identifies potential market opportunities based on holder behavior
   - Analyzes token concentration and distribution health
   - Provides insights without compromising individual privacy

4. **Creator Dashboard**:
   - Visualizes analytics data for content creators
   - Shows token performance metrics and distribution patterns
   - Provides revenue breakdowns and holder analytics
   - Offers insights while maintaining the privacy-first approach

This "Movies That Don't Watch You Back" approach represents a fundamental shift from traditional streaming analytics, focusing on blockchain-native metrics that respect user privacy while still providing valuable insights to creators.

## Network Architecture

- **Frontend**: Deployed on CDN for global distribution
- **API & Storage**: Deployed on cloud providers with auto-scaling
- **Database**: Managed database service with replication
- **IPFS Integration**: Connection to IPFS network with pinning services
- **Blockchain**: Integration with Polygon network (Mumbai testnet for development, Mainnet for production)

## Integration Points

The system has several key integration points:

1. **Frontend ↔ API**: REST API with JWT authentication
2. **API ↔ Storage**: Internal REST API
3. **Storage ↔ IPFS**: IPFS HTTP client
4. **Blockchain Integration**: Ethers.js library
5. **Seed One ↔ Kodi**: Local REST API

This architecture ensures scalability, security, and maintainability while providing a seamless user experience across multiple platforms.