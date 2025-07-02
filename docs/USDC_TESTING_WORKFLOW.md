# 🧪 USDC Integration Testing Workflow

## **📋 Overview**
This document outlines the testing strategy for the complete USDC + Stripe integration before uploading "The Cocoanuts" to production. We'll test both user types without mocking any functionality.

---

## **🎯 Testing Objectives**

### **✅ Validate Pro Publishing Workflow**
- Film tokenization with USDC pricing  
- Smart contract deployment via UI
- Metadata and IPFS integration

### **✅ Validate User Purchasing Workflow**  
- USDC balance detection
- Stripe credit card fallback
- Complete purchase flow

### **✅ Integration Testing**
- End-to-end payment processing
- Smart contract interactions
- Error handling and user feedback

---

## **🔧 Pre-Testing Setup**

### **1. Deploy USDC-Compatible Factory**
```bash
# From contracts directory
yarn run hardhat run scripts/deploy-usdc-factory.ts --network polygon
```

### **2. Environment Configuration**
Ensure these environment variables are set:
```env
REACT_APP_PLATFORM_WALLET_ADDRESS=YOUR_PLATFORM_WALLET_ADDRESS
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
REACT_APP_STRIPE_ONRAMP_ENABLED=true
```

### **3. Test Wallet Setup**
- **Pro Wallet**: Has MATIC for gas fees, will be deploying contracts
- **User Wallet**: Has minimal/no USDC to test Stripe fallback
- **Platform Wallet**: Will receive USDC payments

---

## **🎬 Phase 1: Pro Publishing Workflow Testing**

### **Step 1.1: Connect Pro Wallet**
- [ ] Navigate to wylloh.com
- [ ] Connect Pro wallet (with MATIC for gas fees)
- [ ] Verify Pro dashboard access
- [ ] Check network is Polygon mainnet

### **Step 1.2: Initiate Film Tokenization** 
- [ ] Navigate to `/pro/tokenize` or publish page
- [ ] **STOP**: Do NOT upload "The Cocoanuts" yet
- [ ] Use test metadata or placeholder film for testing
- [ ] Set token price to $19.99 USDC
- [ ] Configure rights thresholds (1, 2, 4, 10 tokens)

### **Step 1.3: Smart Contract Deployment**
- [ ] Review gas estimates for contract deployment
- [ ] Execute contract deployment transaction
- [ ] Verify contract creation on Polygonscan
- [ ] Confirm factory registration

### **Step 1.4: Token Configuration**  
- [ ] Verify USDC pricing is set correctly
- [ ] Test token minting (small amount)
- [ ] Confirm metadata URI generation
- [ ] Validate rights threshold configuration

**✅ Pro Workflow Success Criteria:**
- Contract deployed successfully
- USDC pricing configured  
- Token minting functional
- Ready for user purchases

---

## **🛒 Phase 2: User Purchasing Workflow Testing**

### **Step 2.1: Connect User Wallet**
- [ ] Use different wallet from Pro account
- [ ] Connect to wylloh.com
- [ ] Browse to test film created in Phase 1
- [ ] Verify $19.99 USDC pricing displayed

### **Step 2.2: USDC Balance Detection**
- [ ] Attempt purchase with insufficient USDC balance
- [ ] Verify Stripe modal triggers automatically  
- [ ] Confirm "💳 Credit Card • 🪙 Wallet USDC" message displays
- [ ] Test "Insufficient USDC" warning appears

### **Step 2.3: Stripe Credit Card Flow**
- [ ] Click purchase button with insufficient USDC
- [ ] Stripe onramp modal should appear
- [ ] **OPTIONAL**: Complete small test purchase ($5-10)
- [ ] Verify USDC arrives in wallet
- [ ] Test automatic purchase continuation

### **Step 2.4: Direct USDC Purchase**
- [ ] Add USDC to user wallet manually (if needed)
- [ ] Attempt direct purchase with sufficient balance
- [ ] Verify USDC transfer to platform wallet
- [ ] Confirm token receipt in user wallet
- [ ] Test content access/unlocking

**✅ User Workflow Success Criteria:**
- Smart fallback detection working
- Stripe integration functional
- USDC transfers executing
- Token delivery confirmed

---

## **🔍 Phase 3: Integration & Error Testing**

### **Step 3.1: Error Scenarios**
- [ ] Test rejected MetaMask transactions
- [ ] Test insufficient gas fees
- [ ] Test network switching prompts
- [ ] Test Stripe payment failures
- [ ] Verify user-friendly error messages

### **Step 3.2: Edge Cases**
- [ ] Test multiple purchase attempts
- [ ] Test partial USDC balances
- [ ] Test concurrent user purchases
- [ ] Verify transaction queuing

### **Step 3.3: Performance Validation**
- [ ] Measure purchase completion time
- [ ] Test during network congestion
- [ ] Verify gas estimation accuracy
- [ ] Monitor transaction success rates

---

## **🚨 Critical Checkpoints**

### **Before "The Cocoanuts" Upload**
- [ ] ✅ All test transactions successful
- [ ] ✅ USDC payments processing correctly  
- [ ] ✅ Stripe fallback working reliably
- [ ] ✅ User experience smooth and intuitive
- [ ] ✅ Error handling comprehensive
- [ ] ✅ Smart contracts validated on mainnet

### **Production Readiness Criteria**
- [ ] ✅ Pro can tokenize films with USDC pricing
- [ ] ✅ Users can purchase with credit cards seamlessly
- [ ] ✅ Platform wallet receiving payments correctly
- [ ] ✅ Token delivery mechanism functional
- [ ] ✅ Content access control working

---

## **🎭 Next Steps: "The Cocoanuts" Launch**

Once all testing phases pass:

### **1. Production Film Upload**
- Upload "The Cocoanuts" (1929) via Pro workflow
- Set production pricing ($19.99 USDC)  
- Configure Marx Brothers metadata
- Deploy live smart contract

### **2. Marketing & Launch**
- Social media announcement
- Film community outreach
- Trailer promotion
- Beta user notification

### **3. Monitoring & Support**
- Real-time transaction monitoring
- User support for purchases
- Performance optimization
- Success metrics tracking

---

## **📞 Support & Issues**

### **If Issues Arise:**
1. Check Polygonscan for transaction status
2. Verify USDC contract interactions
3. Test Stripe webhook functionality  
4. Review error logs in browser console
5. Validate wallet connectivity

### **Success Metrics:**
- **Purchase Success Rate**: >95%
- **Stripe Fallback Rate**: ~30% (expected for new crypto users)
- **Average Purchase Time**: <2 minutes
- **User Error Rate**: <5%

---

**🎯 Remember: This is the final testing phase before "The Cocoanuts" goes live. Take time to validate every step thoroughly!** 