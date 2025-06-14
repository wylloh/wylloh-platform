# Wylloh Platform Internal Testing Documentation

## 🎯 **INTERNAL USE ONLY - COMPREHENSIVE TESTING STRATEGY**

This document contains detailed technical testing procedures for the Wylloh platform's complete user experience validation. This follows a "Moon Landing" approach - careful planning for permanent actions on public blockchain and IPFS networks.

**Testing Environment**: Production (wylloh.com)  
**Network**: **Mumbai Testnet** → **Polygon Mainnet** (see Network Strategy below)  
**Platform Status**: SSL Certificate ✅ | All Services Operational ✅ | Real Network Metrics ✅

---

## 🌐 **NETWORK STRATEGY - MUMBAI FIRST, POLYGON SECOND**

### **Phase 1: Mumbai Testnet Validation**
- **Purpose**: Complete testing without real financial cost
- **Benefits**: Free transactions, safe experimentation, full feature testing
- **Content**: Use smaller test files and shorter clips
- **Duration**: Initial testing and debugging phase

### **Phase 2: Polygon Mainnet Deployment**
- **Purpose**: Production deployment with real economic value
- **Requirements**: Platform fees, gas costs, permanent content storage
- **Content**: Full historical films with complete metadata
- **Trigger**: After successful Mumbai testing validation

---

## 💰 **WYLLOH TREASURY & PLATFORM ECONOMICS**

### **Treasury Wallet Configuration Required**
- **Platform Fee**: 2.5% on all transactions
- **Treasury Address**: `0x2Ae0D658e356e2b687e604Af13aFAc3f4E265504` (Operational wallet)
- **Fee Collection**: Automatic during smart contract execution
- **Governance**: Treasury funds managed via multi-signature requirements

### **Filmmaker Revenue Structure** 
**Important**: Actual filmmaker revenue = 97.5% - Gas Fees - Network Costs

**Revenue Breakdown**:
- **97.5%**: To filmmaker (after platform fee)
- **2.5%**: To Wylloh treasury
- **Gas Fees**: Variable network costs (typically 0.1% - 1% depending on network congestion)
- **Network Storage**: IPFS pinning and replication costs

**Example Transaction** (0.1 ETH purchase):
- **Platform Fee**: 0.0025 ETH (2.5%) → Wylloh Treasury
- **Gas Fees**: ~0.001 ETH (1%) → Network
- **Filmmaker Revenue**: ~0.0965 ETH (96.5%)

### **Refund Policy Clarification**
**IMPORTANT**: Traditional refunds are **NOT POSSIBLE** due to blockchain immutability:
- **Blockchain Transactions**: Irreversible once confirmed
- **IPFS Content**: Permanently distributed across network
- **NFT Ownership**: Cannot be revoked once transferred
- **Future Roadmap**: Secondary marketplace for resale (not refunds)

---

## 🎭 **THREE-WALLET TESTING STRATEGY**

### **Wallet 1: Admin User** 👑
**Purpose**: Platform administration and Pro user approval
**Test Requirements**:
- Access to `/admin/users` page
- Access to `/admin/content-moderation` page
- Ability to approve Pro verification requests
- Manage platform settings and treasury configuration

**Testing Steps**:
1. Connect admin wallet to platform
2. Navigate to admin dashboard
3. Verify all admin pages load correctly
4. Test user management functionality
5. Prepare for Pro user approval workflow

### **Wallet 2: Pro User (Content Creator)** 🎬
**Purpose**: Content upload and tokenization testing
**Test Requirements**:
- Request Pro verification status
- Upload historical public domain film
- Configure metadata, tokenization contract, and royalty information
- Encrypt and upload to Helia IPFS network

**Testing Steps**:
1. Connect second distinct wallet
2. Navigate to `/pro-verification` page
3. Submit Pro access request
4. Wait for admin approval (Wallet 1)
5. Upload selected historical film with complete metadata
6. Configure tokenization parameters and royalty splits
7. Verify IPFS upload and encryption successful

### **Wallet 3: Standard User (Collector)** 💎
**Purpose**: Content discovery and purchase testing
**Test Requirements**:
- Browse content via Discover/Marketplace pages
- Purchase film tokens through platform
- Download content locally to support Helia network
- Verify playback functionality

**Testing Steps**:
1. Connect third distinct wallet
2. Browse platform content (Discover vs Marketplace consolidation)
3. Purchase tokens for uploaded film
4. Download content to local device
5. Verify playback and network participation
6. Test Library page functionality

---

## 🎬 **HISTORICAL FILM SELECTION STRATEGY**

**Golden Era / Old Hollywood Aesthetic Films**:
1. **"The Cabinet of Dr. Caligari" (1920)** - German Expressionist masterpiece
2. **"Metropolis" (1927)** - Fritz Lang's visionary sci-fi epic  
3. **"Night of the Living Dead" (1968)** - Modern public domain classic
4. **"Plan 9 from Outer Space" (1957)** - Cult B-movie, smaller file size

**Content Testing Principles**:
- ✅ Films we're proud to have permanently on Wylloh blockchain
- ✅ Aligns with Hollywood filmmaker platform narrative
- ✅ Start with clips/trailers before full features
- ✅ Document all uploaded content for future reference
- ❌ No throwaway test files or placeholder content
- ❌ No repeated uploads of identical content
- ❌ No content that doesn't align with platform's professional image

---

## 📋 **DETAILED TESTING CHECKLIST**

### **Pre-Testing Setup**
- [ ] Confirm Mumbai testnet configuration
- [ ] Generate three distinct wallet addresses
- [ ] Prepare historical film files and metadata
- [ ] Configure admin user in backend system
- [ ] Verify all platform services operational

### **Phase 1: Admin User Testing**
- [ ] Admin login successful
- [ ] Users management page accessible
- [ ] Content moderation page functional
- [ ] Pro verification approval workflow working
- [ ] Treasury configuration visible

### **Phase 2: Pro User Testing**
- [ ] Pro verification request submission
- [ ] Admin approval process completed
- [ ] Film upload interface functional
- [ ] Metadata configuration complete
- [ ] Tokenization contract deployment
- [ ] Royalty distribution setup
- [ ] IPFS encryption and upload successful

### **Phase 3: Standard User Testing**
- [ ] Content discovery via Store/Marketplace
- [ ] Token purchase transaction successful
- [ ] Platform fee collection to treasury
- [ ] Content download to local device
- [ ] Helia network participation verified
- [ ] Playback functionality confirmed
- [ ] Library page shows owned content

### **Phase 4: Network Participation Validation**
- [ ] Download-first approach implemented
- [ ] Local content serves other users
- [ ] Helia node metrics show real data
- [ ] P2P connectivity established
- [ ] Distributed network participation confirmed

---

## 🔒 **SECURITY & PRODUCTION CONSIDERATIONS**

### **Permanent Action Protocols**
- **Real Blockchain Actions**: All transactions permanent and publicly recorded
- **Content Permanence**: IPFS uploads cannot be deleted from network
- **Economic Impact**: Real ETH costs on mainnet, real platform fees collected
- **Compliance**: Ensure all uploaded content meets legal requirements

### **Testing Safety Measures**
- **Mumbai First**: Complete testing on testnet before mainnet
- **Quality Content**: Only upload content appropriate for permanent blockchain history
- **Documentation**: Record all test transactions and content uploads
- **Rollback Planning**: Understand what can and cannot be undone

---

## 🎯 **SUCCESS CRITERIA**

### **Technical Validation**
- [ ] Complete three-wallet user flow without errors
- [ ] Film upload → tokenization → purchase → download works end-to-end  
- [ ] Network participation (download-to-device) functions properly
- [ ] Platform fee collection to treasury wallet successful
- [ ] All navigation flows intuitive and functional

### **User Experience Validation**
- [ ] Admin interface provides necessary platform control
- [ ] Pro user workflow streamlined and professional
- [ ] Standard user experience engaging and straightforward
- [ ] Store vs Library distinction clear and useful
- [ ] Dead links resolved and navigation improved

### **Network & Performance**
- [ ] Mumbai testnet testing successful before mainnet
- [ ] Real Helia metrics replace mock data
- [ ] Platform stable under multi-user concurrent testing
- [ ] Download-first network participation working

---

**This document is for internal testing only and contains sensitive technical procedures for permanent blockchain actions.** 