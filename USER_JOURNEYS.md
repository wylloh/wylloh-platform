# Wylloh Platform User Journeys & User Stories

## Overview

This document outlines the comprehensive user journeys and user stories for the Wylloh platform, a blockchain-based content management system for Hollywood filmmakers and film enthusiasts. The platform serves dual audiences with distinct but interconnected workflows.

## User Personas

### 1. Film Enthusiast/Collector
**Profile**: Passionate movie fans who want to own and collect digital films with true ownership rights
- **Demographics**: Ages 25-55, tech-savvy, disposable income for entertainment
- **Goals**: Build permanent digital collection, access exclusive content, support filmmakers
- **Pain Points**: Streaming services removing content, lack of true ownership, limited exclusive access

### 2. Independent Filmmaker/Creator
**Profile**: Independent filmmakers, content creators, and small production companies
- **Demographics**: Ages 28-50, creative professionals, seeking distribution alternatives
- **Goals**: Monetize content directly, maintain control over IP, access analytics
- **Pain Points**: Traditional distribution barriers, revenue sharing, lack of audience insights

### 3. Professional Studio/Enterprise
**Profile**: Established studios, production companies, and entertainment enterprises
- **Demographics**: Organizations with significant IP portfolios and distribution needs
- **Goals**: Secure IP management, advanced analytics, commercial rights distribution
- **Pain Points**: IP protection, complex rights management, revenue tracking

### 4. Pro-Verified Creator
**Profile**: Verified industry professionals with enhanced platform privileges
- **Demographics**: Established filmmakers with proven track records
- **Goals**: Advanced content management, professional analytics, industry networking
- **Pain Points**: Platform credibility, professional tools, audience reach

## Core User Journeys

### Journey 1: Film Enthusiast Discovery & Purchase

#### 1.1 Initial Platform Discovery
**Entry Points:**
- Direct website visit (wylloh.com)
- Social media referral
- Word-of-mouth recommendation
- Search engine discovery

**User Flow:**
1. **Landing Page Experience**
   - Views hero banner with platform value proposition
   - Reads "Hollywood distribution, reimagined" messaging
   - Sees featured content carousel
   - Learns about permanent digital ownership benefits

2. **Content Exploration**
   - Browses store page (`/store`)
   - Uses search functionality (`/search`)
   - Explores discover page (`/discover`) for recommendations
   - Views content details pages (`/store/content/:id`)

3. **Account Creation Decision Point**
   - Prompted to connect wallet for purchases
   - Option to browse without account (limited functionality)
   - Clear value proposition for account creation

#### 1.2 Wallet Connection & Account Setup
**Technical Requirements:**
- MetaMask or compatible Web3 wallet
- Polygon network support
- Basic understanding of cryptocurrency

**User Flow:**
1. **Wallet Connection**
   - Clicks "Connect Wallet" button
   - MetaMask extension prompts for connection
   - Approves connection and account access
   - Platform detects wallet address

2. **Network Verification**
   - Platform checks for correct network (Polygon/Ganache)
   - Prompts network switch if needed
   - Guides through network addition process

3. **Account Creation**
   - Platform creates account linked to wallet address
   - Option to add email for notifications (optional)
   - Profile setup with username selection
   - Terms of service acceptance

#### 1.3 Content Purchase Flow
**Prerequisites:**
- Connected wallet with sufficient funds
- Correct network connection
- Content selection made

**User Flow:**
1. **Content Selection**
   - Views content details page
   - Reviews content information (description, creator, price)
   - Checks rights thresholds and licensing options
   - Selects quantity for purchase

2. **Purchase Process**
   - Clicks "Purchase" button
   - Reviews purchase dialog with total cost
   - Confirms transaction in MetaMask
   - Waits for blockchain confirmation

3. **Post-Purchase Experience**
   - Receives confirmation notification
   - Content added to personal library
   - Access to download/streaming options
   - Receipt and transaction history updated

#### 1.4 Content Consumption
**Access Methods:**
- Direct streaming through platform player
- Download for offline viewing
- Cross-device synchronization

**User Flow:**
1. **Library Access**
   - Navigates to profile page (`/profile`)
   - Views "My Collection" tab
   - Sees all purchased content

2. **Content Playback**
   - Clicks on owned content
   - Redirected to player page (`/player/:id`)
   - Enjoys content with full ownership rights
   - Option to download for offline viewing

### Journey 2: Creator Content Upload & Monetization

#### 2.1 Creator Onboarding
**Entry Requirements:**
- Wallet connection established
- Content ready for upload
- Understanding of tokenization concept

**User Flow:**
1. **Pro Status Request** (Optional but Recommended)
   - Navigates to Pro Verification page (`/pro-verification`)
   - Submits professional credentials
   - Provides filmography and industry links
   - Awaits verification approval

2. **Dashboard Access**
   - Accesses Pro Dashboard (`/pro/dashboard`)
   - Reviews platform capabilities
   - Understands content management workflow

#### 2.2 Content Upload Process
**Technical Requirements:**
- Content files (video, images, metadata)
- IPFS storage integration
- Encryption key management

**User Flow:**
1. **Content Preparation**
   - Prepares main content file
   - Creates thumbnail and preview materials
   - Writes content description and metadata

2. **Upload Workflow**
   - Initiates upload from Pro Dashboard
   - Files uploaded to IPFS with encryption
   - Metadata stored on blockchain
   - Content assigned unique identifier

3. **Content Configuration**
   - Sets visibility (public/private/unlisted)
   - Configures pricing and supply
   - Defines rights thresholds for commercial use
   - Sets up royalty distribution parameters

#### 2.3 Tokenization & Publishing
**Blockchain Integration:**
- ERC-1155 token creation
- Smart contract interaction
- Rights management encoding

**User Flow:**
1. **Tokenization Setup**
   - Reviews content for tokenization readiness
   - Configures token parameters (supply, price)
   - Sets up rights thresholds for different access levels
   - Defines royalty distribution percentages

2. **Smart Contract Deployment**
   - Confirms tokenization transaction
   - MetaMask prompts for gas fees
   - Blockchain processes token creation
   - Content becomes available for purchase

3. **Publishing & Promotion**
   - Content appears in marketplace
   - Creator can share direct links
   - Analytics tracking begins
   - Revenue monitoring activated

#### 2.4 Analytics & Revenue Management
**Dashboard Features:**
- Real-time sales tracking
- Audience analytics
- Revenue distribution
- Performance metrics

**User Flow:**
1. **Performance Monitoring**
   - Accesses analytics dashboard (`/pro/analytics`)
   - Reviews sales performance
   - Monitors audience engagement
   - Tracks geographic distribution

2. **Revenue Management**
   - Views real-time earnings
   - Monitors royalty distributions
   - Accesses financial reporting
   - Plans content strategy based on data

### Journey 3: Professional Studio Enterprise Workflow

#### 3.1 Enterprise Account Setup
**Requirements:**
- Verified professional status
- Multiple content portfolio
- Advanced rights management needs

**User Flow:**
1. **Professional Verification**
   - Submits comprehensive verification package
   - Provides industry credentials and references
   - Undergoes enhanced verification process
   - Receives enterprise-level access

2. **Team Management Setup**
   - Configures multi-user access
   - Sets up role-based permissions
   - Establishes approval workflows
   - Integrates with existing systems

#### 3.2 Bulk Content Management
**Enterprise Features:**
- Batch upload capabilities
- Advanced metadata management
- Automated workflow processing

**User Flow:**
1. **Content Portfolio Upload**
   - Prepares content library for migration
   - Uses bulk upload tools
   - Configures metadata templates
   - Processes content in batches

2. **Rights Management Configuration**
   - Sets up complex licensing structures
   - Configures territory-based rights
   - Establishes revenue sharing models
   - Implements compliance frameworks

#### 3.3 Advanced Analytics & Reporting
**Enterprise Analytics:**
- Comprehensive performance dashboards
- Custom reporting capabilities
- Integration with business intelligence tools

**User Flow:**
1. **Strategic Analytics**
   - Accesses enterprise dashboard
   - Reviews portfolio performance
   - Analyzes market trends
   - Generates executive reports

2. **Financial Management**
   - Monitors revenue streams
   - Tracks royalty distributions
   - Manages tax reporting
   - Integrates with accounting systems

## Cross-Journey Touchpoints

### Community Interaction
**Shared Experiences:**
- Community page engagement (`/community`)
- Creator-collector interactions
- Content discovery and recommendations
- Social sharing and promotion

### Support & Documentation
**Help Resources:**
- Help page (`/help`)
- Documentation (`/docs`)
- Contact support (`/contact`)
- Community forums

### Legal & Compliance
**Transparency Pages:**
- Terms of service (`/terms`)
- Privacy policy (`/privacy`)
- Copyright information (`/copyright`)
- Compliance documentation (`/compliance`)

## Technical User Stories

### Authentication & Wallet Integration

**US-001: Wallet Connection**
```
As a user
I want to connect my Web3 wallet to the platform
So that I can purchase and own digital content
```

**Acceptance Criteria:**
- ✅ MetaMask integration functional
- ✅ Network detection and switching
- ✅ Account change handling
- ✅ Connection state persistence

**US-002: Account Management**
```
As a user
I want to manage my account profile and preferences
So that I can customize my platform experience
```

**Acceptance Criteria:**
- ✅ Profile page with user information
- ✅ Wallet address display and management
- ✅ Username and email configuration
- ✅ Pro status request functionality

### Content Discovery & Purchase

**US-003: Content Browsing**
```
As a film enthusiast
I want to browse and discover content on the platform
So that I can find movies and shows I want to own
```

**Acceptance Criteria:**
- ✅ Store page with content grid
- ✅ Search functionality with filters
- ✅ Discover page with recommendations
- ✅ Content detail pages with full information

**US-004: Content Purchase**
```
As a collector
I want to purchase digital content with cryptocurrency
So that I can own it permanently
```

**Acceptance Criteria:**
- ✅ Purchase flow with quantity selection
- ✅ MetaMask transaction integration
- ✅ Blockchain confirmation handling
- ✅ Purchase history tracking

**US-005: Content Access**
```
As a content owner
I want to access my purchased content
So that I can watch or download it anytime
```

**Acceptance Criteria:**
- ✅ Library page showing owned content
- ✅ Player page for content viewing
- ✅ Download functionality for offline access
- ✅ Cross-device access synchronization

### Creator Content Management

**US-006: Content Upload**
```
As a creator
I want to upload my content to the platform
So that I can distribute it to audiences
```

**Acceptance Criteria:**
- ✅ Pro dashboard with upload functionality
- ✅ IPFS integration for decentralized storage
- ✅ Metadata management and configuration
- ✅ Content encryption and security

**US-007: Content Tokenization**
```
As a creator
I want to tokenize my content as NFTs
So that I can sell ownership rights to collectors
```

**Acceptance Criteria:**
- ✅ ERC-1155 token creation
- ✅ Rights threshold configuration
- ✅ Pricing and supply management
- ✅ Smart contract integration

**US-008: Analytics & Revenue**
```
As a creator
I want to track my content performance and earnings
So that I can optimize my content strategy
```

**Acceptance Criteria:**
- ✅ Analytics dashboard with performance metrics
- ✅ Real-time revenue tracking
- ✅ Audience engagement analytics
- ✅ Financial reporting capabilities

### Professional Features

**US-009: Pro Verification**
```
As a professional filmmaker
I want to verify my industry credentials
So that I can access advanced platform features
```

**Acceptance Criteria:**
- ✅ Pro verification request form
- ✅ Credential submission and review process
- ✅ Verification status tracking
- ✅ Enhanced feature access upon approval

**US-010: Advanced Rights Management**
```
As a professional creator
I want to configure complex licensing and rights structures
So that I can monetize my content effectively
```

**Acceptance Criteria:**
- ✅ Rights threshold configuration
- ✅ Commercial licensing options
- ✅ Territory-based rights management
- ✅ Royalty distribution automation

## Platform Navigation Map

### Public Pages (No Authentication Required)
- `/` - Homepage with platform introduction
- `/store` - Content marketplace browsing
- `/search` - Content search and filtering
- `/discover` - Content discovery and recommendations
- `/about` - Platform information and mission
- `/community` - Community engagement hub
- `/help` - User support and documentation
- `/docs` - Technical documentation
- `/terms` - Terms of service
- `/privacy` - Privacy policy
- `/contact` - Contact information

### Authenticated User Pages
- `/profile` - User profile and account management
- `/library/:libraryId` - Personal content library
- `/player/:id` - Content player for owned items
- `/transactions` - Purchase and transaction history

### Creator/Pro Pages
- `/pro/dashboard` - Creator dashboard and content management
- `/pro/analytics` - Advanced analytics and reporting
- `/pro/tags` - Content tagging and metadata management
- `/pro-verification` - Professional status verification

### Content-Specific Pages
- `/store/content/:id` - Individual content detail and purchase
- `/player/:id` - Content player with ownership verification

### Administrative Pages
- `/login` - Authentication and account access
- Various legal and compliance pages

## Success Metrics & Validation

### User Engagement Metrics
- **Content Discovery**: Time spent browsing, search usage, content views
- **Purchase Conversion**: Browse-to-purchase rate, average transaction value
- **Content Consumption**: Play rates, download frequency, repeat viewing
- **Creator Engagement**: Upload frequency, content performance, revenue growth

### Technical Performance Metrics
- **Wallet Integration**: Connection success rate, transaction completion rate
- **Content Delivery**: Load times, streaming quality, download success
- **Platform Reliability**: Uptime, error rates, user satisfaction scores

### Business Success Indicators
- **User Growth**: New user registrations, retention rates, active users
- **Content Growth**: New content uploads, creator onboarding, content diversity
- **Revenue Growth**: Transaction volume, creator earnings, platform sustainability

## Conclusion

The Wylloh platform provides comprehensive user journeys for both content creators and collectors, with sophisticated blockchain integration and professional-grade features. All major user flows have been implemented and validated against the codebase, confirming the platform's readiness for beta launch.

The platform successfully addresses the needs of:
- Film enthusiasts seeking permanent digital ownership
- Independent creators needing distribution alternatives
- Professional studios requiring advanced rights management
- The broader entertainment industry moving toward blockchain adoption

This documentation serves as a foundation for user testing, feature development, and platform optimization as Wylloh prepares for public launch. 