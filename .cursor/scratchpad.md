# Wylloh Platform Development Plan

## Background and Motivation
The Wylloh platform is developing as a blockchain-based content management system for Hollywood filmmakers. The primary objective is to provide a secure, user-friendly platform for content creators to manage, tokenize, and distribute their digital assets. The platform needs to inspire trust among professional filmmakers who are entrusting their valuable intellectual property to the system.

### Token Model Clarification

The Wylloh platform utilizes ERC-1155 tokens in a unique way that's important to understand:

- **NOT Copyright Ownership**: The tokens do NOT represent copyright ownership of the films themselves. Copyright and intellectual property rights remain fully with the studio or creator.

- **Perpetual Access Rights**: Each token represents perpetual access rights to the content, similar to owning a DVD or Blu-ray:
  - Indefinite right to download and watch the film
  - Permanent addition to the user's digital library
  - Non-revocable access (as long as token is held)
  
- **Distribution Rights Through Stacking**: Beyond basic access rights, tokens can be stacked to unlock commercial distribution rights:
  - Streaming rights for specific regions
  - Theatrical distribution rights
  - Other distribution channels
  - Rights level determined by token quantity held
  
- **Embedded Utility**: Each token includes utility features such as:
  - Permanent content access and download rights
  - Distribution permissions (when stacked)
  - Platform features specific to the rights level
  - Commercial licensing capabilities

This model combines the permanence of physical media ownership with the flexibility of digital rights management, while enabling commercial distribution through token stacking.

## Overall Progress: 70% Complete

## Core Platform Components Status

### 1. Blockchain Layer (75% Complete)
- ✅ Smart contract development for licensing and rights management (100%)
- ✅ Token creation and management system (100%)
- ✅ Basic blockchain event monitoring (100%)
- 🟡 Royalty distribution system (50%)
- 🔴 Advanced rights verification system (0%)

### 2. Content Storage Layer (60% Complete)
- ✅ Basic content upload and retrieval (100%)
- ✅ Content encryption system (100%)
- 🟡 IPFS integration (50%)
- 🔴 Filecoin storage infrastructure (0%)
- 🔴 Distributed content availability system (0%)

### 3. Access Layer (75% Complete)
- ✅ Web platform core functionality (100%)
- ✅ User authentication and wallet integration (100%)
- ✅ Content management interface (100%)
- 🟡 Seed One player integration (50%)
- 🔴 Commercial rights management interface (0%)

## Critical Security Vulnerabilities (PRIORITY UPDATE)
Based on the npm audit, we have identified several critical security vulnerabilities that need attention, but will be addressed strategically rather than rushing breaking changes during active development:

1. **High Severity Vulnerabilities (9)**
   - axios (<=0.29.0): Critical vulnerability with limited exploitation risk in our product context
   - cors (<=2.8.5): Reflected cross-site scripting
   - express (<=4.17.3): Parsing issues
   - socket.io (all): Regular expression DoS
   - web3 (all): Multiple vulnerabilities

2. **Implementation Plan**
   - Create a security-focused branch for testing upgrades
   - Prioritize fixes for components with direct user input exposure
   - Schedule security sprint after MVP stable release

The vulnerability information has been documented in detail in security-plan.md and will be addressed according to the timeline there.

## Key Challenges and Analysis
1. **Professional User Interface**:
   - Design language should communicate security and professionalism
   - Workflow should feel native to film industry professionals
   - Provide transparency and control over blockchain functionality without requiring detailed technical knowledge

2. **Data Security and Trust**:
   - IP protection is paramount for Hollywood content
   - Must offer both client-side and server-side protection
   - Interface should communicate security measures and give users control

3. **Content Discovery and Blockchain Integration**:
   - Need robust blockchain crawler for real-time content indexing
   - Efficient search across multiple chains
   - Real-time transaction monitoring and event processing
   - Secure metadata handling and verification

4. **Architectural Decision Point: Crawler Scope** (NEW)
   Current Approach vs. Proposed Change:
   
   Current (Full-Chain Crawling):
   - Pros:
     * Complete visibility of all chain activity
     * Future-proof for expanding use cases
     * No risk of missing relevant transactions
   - Cons:
     * Resource intensive
     * Complex implementation
     * Longer development timeline
     * Potentially unnecessary scope given current needs
   
   Proposed (Wallet-Focused):
   - Pros:
     * Significantly reduced complexity
     * Faster implementation
     * Lower resource requirements
     * Matches current business need (Wylloh-only minting)
   - Cons:
     * May need refactoring if requirements expand
     * Could miss relevant transactions if not properly configured
     * Need careful wallet management system

   Key Considerations:
   1. Current State: Only Wylloh platform will be minting movie tokens
   2. Platform Growth: Need to assess if/when we expect third-party minting
   3. Resource Efficiency: Wallet-focused approach better aligns with immediate needs
   4. Development Velocity: Could accelerate MVP delivery
   5. Technical Debt: Ensure wallet-focused architecture can scale if needed

## Planner's Recommendation
Based on the current business requirements and technical analysis, I strongly recommend pivoting to the wallet-focused approach (Option B) for the following reasons:

1. **Business Alignment**: 
   - Current requirement only involves Wylloh platform minting
   - No immediate need for third-party token monitoring
   - Faster time-to-market for core functionality

2. **Technical Benefits**:
   - Significantly reduced complexity in implementation
   - Lower infrastructure costs and resource requirements
   - Faster development cycle and easier maintenance
   - More focused and reliable monitoring of relevant transactions

3. **Future Proofing**:
   - The wallet-focused architecture can be designed to scale
   - Core components (event processing, indexing) remain similar
   - Can expand to full-chain monitoring later if needed
   - Better to start focused and expand than to over-engineer

4. **Risk Mitigation**:
   - Reduced complexity means fewer potential points of failure
   - Easier to test and validate functionality
   - More straightforward deployment and monitoring
   - Clear scope boundaries for MVP

## Proposed Next Steps:
1. Pause current full-chain crawler development
2. Begin implementation of wallet management system
3. Adapt existing event monitoring to focus on Wylloh contracts
4. Update project timeline to reflect reduced scope
5. Document architecture to allow for future expansion if needed

## High-level Task Breakdown

### Phase 1: Blockchain Monitoring & Search Infrastructure (CURRENT PHASE - 30% Complete)
1. 🟡 Implement Blockchain Monitoring Service (30% complete)
   Option A: Current Full-Chain Approach (ON HOLD pending architectural decision)
   - ✅ Basic blockchain event monitoring setup (100% complete)
   - ✅ Smart contract integration for basic events (100% complete)
   - 🔴 Create distributed crawler architecture (0% complete)
   - 🔴 Implement multi-chain support (0% complete)
   - 🔴 Add resilient error handling and retry mechanisms (0% complete)

   Option B: Proposed Wallet-Focused Approach (NEW)
   Success Criteria:
   - Monitor all transactions for registered platform wallets
   - Capture all token minting events from Wylloh contracts
   - Real-time notification of relevant transactions
   - Proper error handling and recovery
   
   Implementation Steps:
   1. 🔴 Wallet Management System
      - Create wallet registry
      - Implement wallet validation
      - Add wallet activity monitoring
      - Setup notification system
   
   2. 🔴 Smart Contract Event Monitoring
      - Monitor Wylloh contract events
      - Track minting operations
      - Monitor token transfers
      - Implement event validation
   
   3. 🔴 Transaction Processing
      - Process relevant transactions
      - Update platform state
      - Maintain transaction history
      - Handle transaction failures

2. 🔴 Build Event Processing Pipeline (0% complete)
   - Design event processing architecture
   - Implement event queue system
   - Create event processors for different transaction types
   - Add real-time data synchronization

3. 🔴 Develop Search Indexer (0% complete)
   - Set up Elasticsearch cluster
   - Create indexing pipeline for relevant blockchain data
   - Implement real-time index updates
   - Add support for wallet and token queries

4. 🟡 Enhance Search API (50% complete)
   - ✅ Basic blockchain search implementation (100% complete)
   - ✅ Token metadata integration (100% complete)
   - 🔴 Add wallet-specific filtering (0% complete)
   - 🔴 Implement cross-chain wallet monitoring (0% complete)

### Phase 2: Decentralized Storage Integration (CRITICAL PATH)
1. 🟡 IPFS Infrastructure (50% complete)
   - ✅ Basic IPFS node setup
   - ✅ Content pinning service integration
   - 🔴 Distributed node network setup
   - 🔴 Content availability monitoring
   - 🔴 Automated replication management

2. 🔴 Filecoin Integration (0% complete)
   - 🔴 Storage deal management system
   - 🔴 Content retrieval optimization
   - 🔴 Storage provider selection
   - 🔴 Cost optimization system

3. 🟡 Content Delivery Network (40% complete)
   - ✅ Basic CDN setup
   - 🟡 Edge caching implementation
   - 🔴 Geographic distribution
   - 🔴 Load balancing system

### Phase 3: Rights Management & Access Control (60% Complete)
1. ✅ Basic rights management system
2. 🟡 Commercial exhibition system
3. 🟡 Access control system
4. 🔴 Rights verification system

### Phase 4: Platform Integration & Launch (50% Complete)
1. 🟡 Seed One player integration
2. 🟡 Analytics dashboard
3. 🔴 Platform-wide security audit
4. 🔴 Performance optimization

## Project Status Board
- [x] Set up project structure and core dependencies
- [x] Implement basic authentication
- [x] Create content upload mechanism
- [x] Build metadata editor
- [x] Implement basic search functionality
- [x] Create content filter panel
- [x] Build tag management UI components
- [x] Set up basic blockchain event monitoring
- [x] Create chain adapter interface
- [x] Implement chain-specific adapters
- [x] Create health monitoring system

New Wallet-Focused Implementation:
- [ ] Design and implement wallet registry system
  - [ ] Create database schema
  - [ ] Implement CRUD operations
  - [ ] Add validation system
  - [ ] Integrate with authentication
- [ ] Implement smart contract monitoring
  - [ ] Set up event subscription system
  - [ ] Create contract event filters
  - [ ] Add transaction validation
  - [ ] Implement notification system
- [ ] Build transaction processing pipeline
  - [ ] Set up event queue
  - [ ] Create transaction processors
  - [ ] Implement state management
  - [ ] Add error handling
- [ ] Develop integration components
  - [ ] Create API endpoints
  - [ ] Add WebSocket support
  - [ ] Implement analytics
  - [ ] Set up monitoring

Remaining Platform Tasks:
- [ ] Complete IPFS/Filecoin integration
- [ ] Implement distributed content delivery
- [ ] Finalize Seed One player integration
- [ ] Complete commercial rights system
- [ ] Conduct platform-wide security audit
- [ ] Perform performance optimization

## Current Status / Progress Tracking
**CURRENT PRIORITY**: Implementing Wallet-Focused Blockchain Monitoring System

Immediate Focus Areas:
1. Wallet Management System Architecture
   * Success Criteria:
     - ✅ Architecture diagram completed
     - ✅ Component interfaces defined
     - ✅ Scalability requirements documented
     - ✅ Worker distribution strategy outlined
   * Implementation Steps:
     1. 🔴 Design Wallet Registry System
        - Schema for wallet storage
        - CRUD operations for wallet management
        - Validation and verification system
        - Integration with user authentication
     
     2. 🔴 Smart Contract Event Monitoring
        - Contract event subscription system
        - Event filtering for Wylloh contracts
        - Transaction validation logic
        - Real-time notification system
     
     3. 🔴 Transaction Processing Pipeline
        - Event queue system
        - Transaction processors
        - State management
        - Error handling and recovery
     
     4. 🔴 Integration Components
        - API endpoints for wallet management
        - WebSocket notifications
        - Analytics and reporting
        - Monitoring and alerting

2. Reusable Components from Current Implementation:
   * Can Reuse:
     - ✅ Basic blockchain event monitoring
     - ✅ Chain adapter interface
     - ✅ Health monitoring system
     - ✅ Job distribution system
   * Need Modification:
     - 🔄 Worker coordination (simplify for wallet focus)
     - 🔄 Transaction processing (focus on Wylloh contracts)
     - 🔄 Event filtering (optimize for known contracts)

3. New Components Needed:
   * High Priority:
     - 🔴 Wallet registry database
     - 🔴 Contract event filters
     - 🔴 Real-time notification system
   * Medium Priority:
     - 🔴 Analytics dashboard
     - 🔴 Wallet activity monitoring
     - 🔴 Transaction history tracking

## Key Challenges and Analysis
1. Worker Coordination
   - Successfully implemented:
     * Backpressure handling with pendingBlocks tracking
     * Worker health monitoring with success rates
     * Chain reorg detection and recovery
     * Graceful worker failure recovery
     * Dynamic batch size optimization
   - Current challenges:
     * TypeScript type issues with block transactions
     * Need to implement full transaction processing logic
     * Need to add proper error recovery for failed transactions

2. Chain Adapters
   - Successfully implemented:
     * Base adapter with common functionality
     * Chain-specific adapters for Ethereum, Polygon, and BSC
     * Event processing for transfers, listings, and purchases
   - Current challenges:
     * Need to implement proper error handling for RPC failures
     * Need to add rate limiting for RPC calls
     * Need to add proper metrics collection

## Next Steps
1. Fix TypeScript type issues in BlockWorker:
   - Consider using a custom type for block transactions
   - Add proper type guards for transaction handling
   - Add comprehensive error handling

2. Implement transaction processing logic:
   - Add event filtering for relevant contract events
   - Add proper transaction receipt handling
   - Add retry mechanism for failed event processing
   - Add proper logging and metrics collection

3. Add IPFS integration:
   - Set up IPFS client
   - Add metadata storage and retrieval
   - Add proper caching layer
   - Add retry mechanism for failed IPFS operations

4. Add storage service integration:
   - Design database schema
   - Add proper indexing for queries
   - Add caching layer
   - Add proper error handling and recovery

## Lessons
1. Include info useful for debugging in the program output
2. Read the file before trying to edit it
3. If there are vulnerabilities that appear in the terminal, run npm audit before proceeding
4. Always ask before using the -force git command
5. When implementing worker coordination, consider:
   - Backpressure handling
   - Health monitoring
   - Chain reorg handling
   - Graceful recovery
   - Batch optimization
6. TypeScript type issues with blockchain data structures can be tricky:
   - Need proper type definitions for blocks and transactions
   - Consider using type guards for better type safety
   - Balance type safety with code readability

## Executor's Feedback or Assistance Requests
1. Need help with TypeScript type issues in BlockWorker:
   - Current approach using type assertion is not ideal
   - Looking for a better way to handle mixed transaction types
   - Need guidance on proper type definitions for blockchain data

2. Need guidance on transaction processing implementation:
   - What's the best way to handle different event types?
   - How to properly validate and process events?
   - How to handle failed event processing?

## Project Status Board
- [x] Set up worker node architecture
- [x] Create chain adapter interface
- [x] Implement chain-specific adapters
- [x] Implement job distribution system
- [x] Create health monitoring system
- [x] Add worker coordination features
  - [x] Backpressure handling
  - [x] Worker health monitoring
  - [x] Chain reorg handling
  - [x] Graceful recovery
  - [x] Batch optimization
  - [ ] Fix TypeScript type issues
- [ ] Implement transaction processing
- [ ] Add IPFS integration
- [ ] Add storage service integration

## Pre-Launch Checklist (To be addressed before testing)
1. Security Audit
   - Run comprehensive npm audit
   - Address critical vulnerabilities
   - Review and update dependencies
   - Implement security best practices
   - Penetration testing

2. Performance Optimization
   - Load testing
   - Resource usage optimization
   - Caching strategy implementation
   - Network optimization

## Next Actions (Prioritized)
1. HIGH PRIORITY:
   - [ ] Design wallet registry database schema
   - [ ] Implement wallet CRUD operations
   - [ ] Set up contract event monitoring
   - [ ] Create transaction processing pipeline
   - [ ] Implement real-time notifications

2. MEDIUM PRIORITY:
   - [ ] Develop analytics dashboard
   - [ ] Set up wallet activity monitoring
   - [ ] Create transaction history tracking
   - [ ] Implement advanced filtering

3. LOW PRIORITY:
   - [ ] Add geographic distribution for CDN
   - [ ] Create cost optimization system
   - [ ] Implement advanced analytics

## Risk Assessment
1. Technical Risks:
   - Wallet Registry Management:
     * Data consistency across services
     * Secure storage of wallet information
     * Race conditions in wallet updates
     * Integration with authentication system
   
   - Event Monitoring:
     * Missing relevant contract events
     * Network connectivity issues
     * Contract redeployments
     * Chain reorg handling
   
   - Transaction Processing:
     * Event ordering and consistency
     * State management complexity
     * Failed transaction handling
     * Data synchronization issues

2. Mitigation Strategies:
   - Wallet Management:
     * Implement proper database transactions
     * Use secure encryption for sensitive data
     * Add comprehensive validation
     * Maintain detailed audit logs
   
   - Event Monitoring:
     * Implement robust retry mechanisms
     * Use multiple RPC providers
     * Maintain contract version registry
     * Add comprehensive logging
   
   - Transaction Processing:
     * Implement idempotent processing
     * Use proper queueing mechanisms
     * Add comprehensive error handling
     * Maintain transaction history

3. Operational Risks:
   - System Monitoring:
     * Service health tracking
     * Performance monitoring
     * Error rate tracking
     * Resource usage monitoring
   
   - Data Management:
     * Backup procedures
     * Data recovery plans
     * Storage optimization
     * Data retention policies

4. Business Risks:
   - Platform Adoption:
     * User onboarding friction
     * Wallet management complexity
     * Transaction monitoring accuracy
     * Platform reliability perception

## Dependencies and Technical Requirements
1. Core Infrastructure:
   - Database System:
     * PostgreSQL for wallet registry
     * Redis for caching and queues
     * Proper backup and replication
   
   - Message Queue:
     * Bull for job processing
     * Redis for pub/sub
     * Dead letter queues
   
   - Monitoring:
     * Prometheus for metrics
     * Grafana for dashboards
     * ELK stack for logs

2. Blockchain Infrastructure:
   - RPC Providers:
     * Multiple providers per chain
     * Fallback mechanisms
     * Rate limit monitoring
   
   - Contract Monitoring:
     * Event subscription system
     * Transaction validation
     * State management
   
   - Transaction Processing:
     * Event processors
     * State synchronization
     * Error handling

3. API and Integration:
   - REST API:
     * Wallet management endpoints
     * Transaction history
     * Analytics endpoints
   
   - WebSocket:
     * Real-time notifications
     * Status updates
     * Health monitoring
   
   - Security:
     * JWT authentication
     * Rate limiting
     * Input validation

4. Development Requirements:
   - TypeScript 4.x
   - Node.js 18.x
   - Docker for containerization
   - Kubernetes for orchestration

5. Testing Requirements:
   - Unit tests (Jest)
   - Integration tests
   - Load testing
   - Contract event mocking

## Executor's Feedback or Assistance Requests
1. Need clarification on:
   - Preferred message queue system (RabbitMQ vs. Kafka)
   - Elasticsearch cluster configuration
   - Multi-chain RPC provider selection
   - Event processing retry strategies

2. Technical Requirements:
   - High availability requirements for crawler service
   - Data retention policies for blockchain events
   - Search performance SLAs
   - Cross-chain search requirements

## Lessons
1. Chain Adapter Implementation:
   - Use singleton pattern for adapter factory to manage resources efficiently
   - Implement proper error handling and logging for each chain operation
   - Handle different token metadata formats (IPFS, HTTP, base64)
   - Use dynamic imports for chain-specific adapters to reduce initial load time

2. Worker Infrastructure:
   - Configure proper retry mechanisms with exponential backoff
   - Implement dead letter queue for failed jobs
   - Add detailed logging for debugging purposes
   - Use proper TypeScript types for better code maintainability
   - Use Promise.all for parallel operations to improve performance
   - Handle async operations properly in worker coordination

3. Job Distribution:
   - Use a coordinator pattern to manage job distribution
   - Track chain progress and handle failed blocks
   - Implement proper batch processing for efficiency
   - Use metrics to balance load across workers

4. Health Monitoring:
   - Track both worker and chain health metrics
   - Maintain historical metrics for trend analysis
   - Monitor system resources (CPU, memory, etc.)
   - Set appropriate thresholds for warnings and errors
   - Implement proper error handling and recovery procedures
   - Use structured logging for better observability

5. Include info useful for debugging in the program output.
6. Read the file before trying to edit it.
7. If there are vulnerabilities that appear in the terminal, run npm audit before proceeding.
8. Always ask before using the -force git command.
9. When importing React components, ensure imports match export style (default vs. named).

## Technical Design: Wallet-Focused Blockchain Monitoring

### System Components

1. **Wallet Registry Service**
   ```typescript
   interface WalletRegistry {
     // Core wallet management
     registerWallet(address: string, userId: string): Promise<void>;
     deregisterWallet(address: string): Promise<void>;
     getWalletsForUser(userId: string): Promise<string[]>;
     
     // Activity tracking
     getLastSyncTimestamp(address: string): Promise<number>;
     updateLastSyncTimestamp(address: string, timestamp: number): Promise<void>;
     
     // Batch operations for system-wide updates
     getAllActiveWallets(): Promise<string[]>;
     getWalletsNeedingSync(threshold: number): Promise<string[]>;
   }
   ```

2. **Contract Event Monitor**
   ```typescript
   interface ContractEventMonitor {
     // Event subscription
     subscribeToWyllohEvents(contractAddress: string): Promise<void>;
     subscribeToWalletEvents(walletAddress: string): Promise<void>;
     
     // Event processing
     processWyllohEvent(event: WyllohEvent): Promise<void>;
     processWalletEvent(event: WalletEvent): Promise<void>;
     
     // Health checking
     getSubscriptionStatus(): Promise<SubscriptionStatus>;
     reconnectFailedSubscriptions(): Promise<void>;
   }
   ```

3. **Library Service**
   ```typescript
   interface LibraryService {
     // User library management
     updateUserLibrary(userId: string): Promise<void>;
     getLibraryContents(userId: string): Promise<LibraryItem[]>;
     
     // Sync operations
     syncWalletToLibrary(walletAddress: string): Promise<void>;
     batchSyncLibraries(): Promise<void>;
     
     // Real-time updates
     subscribeToLibraryUpdates(userId: string): Promise<void>;
     notifyLibraryChange(userId: string, change: LibraryChange): Promise<void>;
   }
   ```

4. **Store Service**
   ```typescript
   interface StoreService {
     // Store management
     updateGlobalStore(): Promise<void>;
     getStoreContents(): Promise<StoreItem[]>;
     
     // Content operations
     addContentToStore(content: WyllohContent): Promise<void>;
     removeContentFromStore(contentId: string): Promise<void>;
     
     // Market operations
     updatePricing(contentId: string, price: BigNumber): Promise<void>;
     processTransaction(buyerId: string, contentId: string): Promise<void>;
   }
   ```

### Data Flow Architecture

1. **Continuous Monitoring Flow**
   ```
   [Contract Events] → [Event Monitor] → [Event Queue] → [Event Processors]
                                                      ↓
                                            [Library Updates] → [Store Updates]
                                                      ↓
                                            [WebSocket Notifications]
   ```

2. **Periodic Sync Flow**
   ```
   [Cron Job] → [Wallet Registry] → [Get Outdated Wallets] → [Sync Worker]
                                                           ↓
                                                   [Library Updates]
                                                           ↓
                                                   [Store Updates]
   ```

### Key Processes

1. **Library Synchronization**
   - Real-time updates for connected users
   - Background sync for disconnected users
   - Conflict resolution for multi-wallet scenarios
   - Historical transaction backfilling

2. **Store Management**
   - Continuous content aggregation
   - Price tracking and updates
   - Availability status management
   - Market activity monitoring

3. **Event Processing**
   - Transaction validation
   - State updates
   - Notification dispatch
   - Error handling and recovery

### Database Schema

1. **Wallet Registry**
   ```sql
   CREATE TABLE wallets (
     address VARCHAR(42) PRIMARY KEY,
     user_id VARCHAR(36) NOT NULL,
     last_sync TIMESTAMP NOT NULL,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );

   CREATE TABLE wallet_sync_status (
     address VARCHAR(42) PRIMARY KEY,
     last_block_processed BIGINT NOT NULL,
     last_sync_status VARCHAR(20) NOT NULL,
     error_count INT DEFAULT 0,
     last_error TEXT,
     FOREIGN KEY (address) REFERENCES wallets(address)
   );
   ```

2. **Library Records**
   ```sql
   CREATE TABLE library_items (
     id UUID PRIMARY KEY,
     user_id VARCHAR(36) NOT NULL,
     content_id VARCHAR(66) NOT NULL,
     wallet_address VARCHAR(42) NOT NULL,
     token_id VARCHAR(66) NOT NULL,
     acquisition_block BIGINT NOT NULL,
     acquisition_tx VARCHAR(66) NOT NULL,
     status VARCHAR(20) NOT NULL,
     metadata JSONB,
     FOREIGN KEY (user_id) REFERENCES users(id),
     FOREIGN KEY (wallet_address) REFERENCES wallets(address)
   );
   ```

3. **Store Records**
   ```sql
   CREATE TABLE store_items (
     content_id VARCHAR(66) PRIMARY KEY,
     current_owner VARCHAR(42) NOT NULL,
     list_price NUMERIC(78,0),
     is_available BOOLEAN DEFAULT true,
     metadata JSONB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Optimization Strategies

1. **Batch Processing**
   - Group wallet syncs by chain
   - Batch database operations
   - Optimize RPC calls
   - Cache frequently accessed data

2. **Performance Considerations**
   - Index key lookup fields
   - Partition large tables
   - Implement query optimization
   - Use connection pooling

3. **Scalability Features**
   - Horizontal scaling of workers
   - Load balancing of RPC requests
   - Distributed caching
   - Queue-based job distribution

### Error Handling

1. **Recovery Mechanisms**
   - Automatic retry with backoff
   - Dead letter queues
   - Transaction rollback
   - State reconciliation

2. **Monitoring Points**
   - RPC connection status
   - Event subscription health
   - Processing queue length
   - Error rates and types

### Data Freshness Strategies

1. **Real-time Updates**
   ```typescript
   interface UpdateStrategy {
     // Connected user updates
     subscribeToUserWallets(userId: string): Promise<void>;
     handleWalletEvent(event: WalletEvent): Promise<void>;
     
     // Global store updates
     subscribeToWyllohContracts(): Promise<void>;
     handleContractEvent(event: ContractEvent): Promise<void>;
   }
   ```

2. **Background Sync System**
   ```typescript
   interface BackgroundSync {
     // Periodic full sync
     scheduleFullSync(cronPattern: string): void;
     executeFullSync(): Promise<void>;
     
     // Progressive sync for inactive wallets
     syncInactiveWallets(threshold: number): Promise<void>;
     prioritizeSyncQueue(): Promise<void>;
   }
   ```

3. **Sync Scheduling**
   - Active Users (connected within 24h):
     * Real-time WebSocket updates
     * Immediate event processing
     * Transaction confirmation tracking
   
   - Semi-Active Users (1-7 days):
     * Daily full sync
     * Batch event processing
     * Priority in sync queue
   
   - Inactive Users (>7 days):
     * Weekly full sync
     * Background processing
     * Lower priority in queue

4. **Store Consistency**
   - Real-time monitoring of Wylloh contracts
   - Periodic validation of listed items
   - Automatic price and availability updates
   - Market activity tracking

5. **Data Validation**
   ```typescript
   interface DataValidator {
     // Library validation
     validateUserLibrary(userId: string): Promise<ValidationResult>;
     reconcileLibraryState(userId: string): Promise<void>;
     
     // Store validation
     validateStoreContents(): Promise<ValidationResult>;
     reconcileStoreState(): Promise<void>;
     
     // Consistency checks
     checkDataConsistency(): Promise<ConsistencyReport>;
     fixInconsistencies(report: ConsistencyReport): Promise<void>;
   }
   ```

6. **Recovery Procedures**
   - Missed event recovery
   - State reconciliation
   - Data repair procedures
   - Conflict resolution

### Implementation Priorities

1. **Phase 1: Core Infrastructure**
   - [x] Basic wallet monitoring
   - [x] Event subscription system
   - [ ] Database schema implementation
   - [ ] Basic sync workers

2. **Phase 2: Library Management**
   - [ ] Real-time updates for active users
   - [ ] Background sync system
   - [ ] Library state management
   - [ ] Conflict resolution

3. **Phase 3: Store Integration**
   - [ ] Global store updates
   - [ ] Price tracking system
   - [ ] Availability management
   - [ ] Market activity monitoring

4. **Phase 4: Optimization**
   - [ ] Performance tuning
   - [ ] Caching implementation
   - [ ] Load balancing
   - [ ] Monitoring and alerts

# Platform Philosophy & Token Architecture

## Core Vision
Wylloh aims to accelerate quality storytelling through decentralized technology and aligned incentives. Unlike traditional streaming platforms where success can increase costs and misalign incentives, Wylloh's decentralized architecture becomes more efficient and cost-effective with scale.

### Key Principles
1. **Positive-Sum Technology**:
   - Embrace e/acc movement's optimistic view of technological progress
   - Focus on how technology can enhance creative expression
   - Build systems that become more efficient with scale

2. **Aligned Incentives**:
   - Traditional Streaming: Success → Higher CDN Costs → Incentive for Shallow Engagement
   - Wylloh Model: Success → Stronger Network → Lower Costs → Better Content

3. **Quality Through Decentralization**:
   - Decentralized storage reduces costs while improving reliability
   - Community-driven content validation without gatekeeping
   - Transparent, verifiable quality standards

## Token Architecture

### WyllohCoin (Platform Token)
- **Purpose**: Platform utility and network incentivization
- **Use Cases**:
  * Incentivize IPFS storage network (similar to Filecoin)
  * Purchase movie tokens
  * Platform operations and governance
- **Network Effect**: Strengthens platform infrastructure

### Movie Tokens (Content-Specific)
- **Structure**: Individual ERC-1155 tokens per movie
- **Chain**: Primarily on Polygon for low gas fees
- **Verification**: Implements IWyllohVerified interface
- **Example Structure**:
  * Movie Budget: $10M USD
  * Token Structure: 500K tokens at $20 USD each
  * Quality Assurance: Wylloh verification tag
- **Benefits**:
  * Fractional ownership
  * Standardized quality verification
  * Efficient trading on Polygon
  * Clear provenance through Wylloh verification

## Technical Implementation Focus

1. **Chain Strategy**:
   - Primary: Polygon for movie tokens (low fees, high throughput)
   - Secondary: Ethereum for WyllohCoin (security, stability)
   - Support: BSC for additional liquidity options

2. **Quality Assurance**:
   - Implement IWyllohVerified interface checks
   - Standardized metadata validation
   - Automated quality verification
   - Single moderator system for initial phase

3. **Network Efficiency**:
   - Decentralized CDN grows stronger with usage
   - Cost efficiency improves with scale
   - Network effects benefit all participants

4. **Monitoring Strategy**:
   - Focus on Polygon for movie token events
   - Monitor WyllohCoin across chains
   - Track network health metrics
   - Validate token authenticity