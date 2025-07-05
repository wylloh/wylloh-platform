# 🎬 WYLLOH PLATFORM - COMPREHENSIVE TESTING STRATEGY

## **Overview**
This document outlines the complete testing strategy for validating the Wylloh platform's upload, tokenization, and marketplace flow using our live Polygon mainnet contracts.

**Deployed Infrastructure**: ✅ Live on Polygon Mainnet  
**Test Film**: "The Cocoanuts" (1929) - Historic first tokenization  
**Test Scenario**: Complete Pro user → Standard user workflow  

---

## **📋 PHASE 1: PRO USER FILM TOKENIZATION**

### **🎯 Objective**
Validate that a Pro user can successfully upload and tokenize "The Cocoanuts" as Token ID 1 on the WyllohFilmRegistry contract.

### **👤 Pro User Workflow**

#### **Pre-Test Setup**
- [ ] **Pro User Wallet**: Different from admin wallet
- [ ] **Film Files**: "The Cocoanuts" (1929) in multiple formats
  - [ ] SD version (720p)
  - [ ] HD version (1080p) 
  - [ ] 4K version (if available)
  - [ ] Movie poster (2:3 aspect ratio)
- [ ] **Metadata**: Title, director, year, description, rights structure

#### **Step 1: Authentication & Pro Status**
- [ ] Pro user logs into platform
- [ ] System validates Pro user status
- [ ] Access to tokenization interface confirmed

#### **Step 2: Film Upload Process**
- [ ] Navigate to "Create New Film" interface
- [ ] Upload film files (SD, HD, 4K)
- [ ] Upload movie poster image
- [ ] **Expected**: Files uploaded to IPFS via StoragePool contract

#### **Step 3: Metadata Configuration**
- [ ] Enter film details:
  - Title: "The Cocoanuts"
  - Director: "Robert Florey"
  - Year: 1929
  - Genre: Comedy/Musical
  - Description: Historic Marx Brothers film
- [ ] Configure rights thresholds:
  - 1 token: Basic streaming rights
  - 10 tokens: HD + download rights
  - 100 tokens: 4K + extras rights
  - 1,000 tokens: Commercial licensing rights

#### **Step 4: Pricing & Economics**
- [ ] Set base price: $4.99 USDC
- [ ] Configure royalty distribution:
  - Pro user: 90%
  - Platform: 10%
- [ ] Set maximum supply: 1,000,000 tokens

#### **Step 5: Blockchain Tokenization**
- [ ] Review tokenization parameters
- [ ] Sign transaction with Pro user wallet
- [ ] **Expected**: `createFilm()` called on WyllohFilmRegistry
- [ ] **Expected**: Token ID 1 created for "The Cocoanuts"
- [ ] **Expected**: IPFS hashes stored on-chain
- [ ] Transaction confirmed on Polygon mainnet

#### **Step 6: Validation Checks**
- [ ] **PolygonScan Verification**: 
  - Transaction appears in WyllohFilmRegistry
  - Token ID 1 exists
  - Metadata correctly stored
- [ ] **Platform Interface**: 
  - Film appears in Pro user's portfolio
  - Film visible in marketplace
  - Poster displays with correct aspect ratio
- [ ] **IPFS Storage**: 
  - All files accessible via IPFS gateways
  - Metadata JSON properly formatted

---

## **📋 PHASE 2: STANDARD USER FILM PURCHASE**

### **🎯 Objective**
Validate that a standard user can discover, purchase, and access "The Cocoanuts" tokens through the marketplace.

### **👤 Standard User Workflow**

#### **Pre-Test Setup**
- [ ] **Standard User Wallet**: Different from Pro user and admin
- [ ] **USDC Balance**: Sufficient for purchasing ($10+ recommended)
- [ ] **Polygon Network**: Wallet connected to Polygon mainnet

#### **Step 1: Film Discovery**
- [ ] Browse marketplace interface
- [ ] **Expected**: "The Cocoanuts" appears in film grid
- [ ] **Expected**: Movie poster displays with 2:3 aspect ratio
- [ ] **Expected**: Film details show correct metadata
- [ ] **Expected**: Price displays as $4.99 USDC

#### **Step 2: Film Details Review**
- [ ] Click on "The Cocoanuts" for detailed view
- [ ] Review film information:
  - Title, director, year correct
  - Rights thresholds clearly displayed
  - Pricing information accurate
  - Trailer/preview functionality (if available)

#### **Step 3: Token Purchase Process**
- [ ] Select number of tokens to purchase (test with 1 token)
- [ ] **Expected**: Rights level explanation shows "Basic streaming rights"
- [ ] **Expected**: Total cost calculation correct (1 × $4.99 = $4.99)
- [ ] Click "Purchase Tokens"

#### **Step 4: Payment & Transaction**
- [ ] Approve USDC spending allowance (if needed)
- [ ] Sign purchase transaction
- [ ] **Expected**: WyllohMarketplace contract processes payment
- [ ] **Expected**: Tokens transferred to user wallet
- [ ] **Expected**: USDC transferred to Pro user (90%) and platform (10%)
- [ ] Transaction confirmed on Polygon mainnet

#### **Step 5: Access Validation**
- [ ] Navigate to user's library
- [ ] **Expected**: "The Cocoanuts" appears in owned content
- [ ] **Expected**: Token count shows "1 token" owned
- [ ] **Expected**: Access level shows "Basic streaming rights"

#### **Step 6: Content Playback**
- [ ] Click "Watch Now" or "Play"
- [ ] **Expected**: IPFS file resolution works
- [ ] **Expected**: SD version loads (based on 1-token rights)
- [ ] **Expected**: Playback controls function correctly
- [ ] **Expected**: No access to HD/4K versions (requires more tokens)

---

## **📋 PHASE 3: ADVANCED FUNCTIONALITY TESTING**

### **🎯 Rights Escalation Testing**
- [ ] **Standard User**: Purchase 10 more tokens (total: 11)
- [ ] **Expected**: Access upgraded to "HD + download rights"
- [ ] **Expected**: HD version becomes available
- [ ] **Expected**: Download functionality unlocked

### **🎯 Marketplace Secondary Sales**
- [ ] **Standard User**: List tokens for resale
- [ ] **Different User**: Purchase from secondary market
- [ ] **Expected**: RoyaltyDistributor handles payments correctly
- [ ] **Expected**: Original Pro user receives ongoing royalties

### **🎯 Platform Analytics**
- [ ] **Admin Dashboard**: Review platform metrics
- [ ] **Expected**: Token sales tracked correctly
- [ ] **Expected**: Revenue distribution accurate
- [ ] **Expected**: User engagement data captured

---

## **📋 PHASE 4: TECHNICAL VALIDATION**

### **🔍 Smart Contract Verification**

#### **WyllohFilmRegistry Contract**
- [ ] **Token ID 1**: Exists and configured correctly
- [ ] **Metadata URI**: Points to valid IPFS hash
- [ ] **Rights Thresholds**: Stored correctly on-chain
- [ ] **Max Supply**: Set to 1,000,000 tokens
- [ ] **Creator Address**: Points to Pro user wallet

#### **WyllohMarketplace Contract**
- [ ] **Purchase Functions**: Process payments correctly
- [ ] **USDC Integration**: Handles stablecoin transfers
- [ ] **Royalty Routing**: Sends payments to RoyaltyDistributor

#### **RoyaltyDistributor Contract**
- [ ] **Payment Splits**: 90% Pro user, 10% platform
- [ ] **Automatic Distribution**: Triggers on each sale
- [ ] **Historical Tracking**: Records all transactions

#### **StoragePool Contract**
- [ ] **IPFS Integration**: Files uploaded and accessible
- [ ] **Hash Storage**: All file hashes stored on-chain
- [ ] **Gateway Redundancy**: Multiple access points working

### **🔍 Frontend Integration Verification**

#### **Contract Address Usage**
- [ ] **WyllohFilmRegistry**: `0x624c5C6395EB28b9952FE9ae0d87B12520b55Bfc`
- [ ] **WyllohMarketplace**: `0xE171E9db4f2f64d3Fc80AA6E2bdF2770Bb006EC8`
- [ ] **RoyaltyDistributor**: `0x23735B20dED41014a03a3ad1EBCb4623B8aDd52d`
- [ ] **WyllohToken**: `0xaD36BE606F3c97a61E46b272979A92c33ffB04ED`
- [ ] **StoragePool**: `0x849760495E12529b43e1BA53da6B156ffcE8120A`

#### **UI/UX Validation**
- [ ] **Movie Posters**: 2:3 aspect ratio consistent
- [ ] **Responsive Design**: Works on mobile, tablet, desktop
- [ ] **Loading States**: Clear feedback during transactions
- [ ] **Error Handling**: Graceful failure messages

---

## **📋 PHASE 5: STRESS & EDGE CASE TESTING**

### **🧪 Performance Testing**
- [ ] **Multiple Users**: Simultaneous purchases
- [ ] **Large File Uploads**: 4K video handling
- [ ] **Network Congestion**: High gas price scenarios
- [ ] **IPFS Redundancy**: Gateway failover testing

### **🧪 Edge Case Scenarios**
- [ ] **Zero Token Balance**: User with no USDC
- [ ] **Insufficient Rights**: Trying to access premium content
- [ ] **Contract Upgrades**: Testing upgradeability features
- [ ] **Network Switching**: Polygon to other chains

### **🧪 Security Validation**
- [ ] **Access Controls**: Unauthorized tokenization attempts
- [ ] **Payment Security**: USDC approval/transfer safety
- [ ] **Rights Verification**: Proper access level enforcement
- [ ] **Admin Functions**: Only admin can perform admin actions

---

## **📋 SUCCESS CRITERIA**

### **✅ Phase 1 Success**
- "The Cocoanuts" successfully tokenized as Token ID 1
- All files uploaded to IPFS and accessible
- Transaction confirmed on PolygonScan
- Film visible in marketplace with correct metadata

### **✅ Phase 2 Success**
- Standard user can purchase tokens with USDC
- Payment correctly split between Pro user and platform
- Purchased tokens appear in user's library
- Content playback works for appropriate access level

### **✅ Phase 3 Success**
- Rights escalation functions correctly
- Secondary marketplace facilitates resales
- Royalty distribution works for ongoing sales
- Platform analytics capture all activities

### **✅ Phase 4 Success**
- All smart contracts function as designed
- Frontend integrates seamlessly with contracts
- UI/UX provides smooth user experience
- No placeholder addresses remain in codebase

### **✅ Phase 5 Success**
- Platform handles stress and edge cases gracefully
- Security measures prevent unauthorized access
- Performance remains acceptable under load
- Error handling provides clear user feedback

---

## **🚨 ROLLBACK PROCEDURES**

### **Minor Issues**
- Frontend bugs: Deploy hotfix to client
- IPFS issues: Switch to backup gateways
- UI problems: Update styles and components

### **Major Issues**
- Smart contract bugs: Utilize upgrade mechanisms
- Critical security issues: Emergency pause functions
- Data corruption: Restore from blockchain state

### **Emergency Contacts**
- **Admin Wallet**: `0x7FA50da5a8f998c9184E344279b205DE699Aa672`
- **Contract Deployer**: Same as admin wallet
- **Emergency Procedures**: See `contracts/docs/EMERGENCY_PROCEDURES.md`

---

## **📊 TESTING TIMELINE**

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| Phase 1 | 2-4 hours | Critical | Pro user access |
| Phase 2 | 1-2 hours | Critical | Phase 1 complete |
| Phase 3 | 2-3 hours | High | Phase 2 complete |
| Phase 4 | 1-2 hours | High | Technical access |
| Phase 5 | 3-4 hours | Medium | All phases |

**Total Estimated Time**: 9-15 hours of comprehensive testing

---

**🎪 Ready to make history with "The Cocoanuts" tokenization!** 🍿✨ 