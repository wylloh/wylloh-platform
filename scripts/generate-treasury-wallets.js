#!/usr/bin/env node

/**
 * Wylloh Treasury Wallet Generation Script
 * 
 * This script generates the multi-signature wallets for the Wylloh treasury system:
 * 1. Primary Treasury Wallet (3-of-5 multi-sig)
 * 2. Operational Wallet (single signature with limits)
 * 3. Emergency Reserve Wallet (4-of-5 multi-sig)
 * 
 * Security Note: This script generates wallets for initial setup.
 * In production, use hardware wallets and secure key ceremonies.
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const NETWORK = process.env.NETWORK || 'mainnet'; // mainnet, goerli, sepolia
const OUTPUT_DIR = path.join(__dirname, '..', 'treasury');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate a new Ethereum wallet
 */
function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase
  };
}

/**
 * Generate multiple wallets for multi-sig setup
 */
function generateMultiSigWallets(count, description) {
  console.log(`\n🔐 Generating ${count} wallets for ${description}...`);
  
  const wallets = [];
  const addresses = [];
  
  for (let i = 0; i < count; i++) {
    const wallet = generateWallet();
    wallets.push({
      index: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic
    });
    addresses.push(wallet.address);
    
    console.log(`  Wallet ${i + 1}: ${wallet.address}`);
  }
  
  return { wallets, addresses };
}

/**
 * Generate Gnosis Safe multi-sig configuration
 */
function generateSafeConfig(owners, threshold, description) {
  return {
    description,
    owners,
    threshold,
    saltNonce: crypto.randomBytes(32).toString('hex'),
    setupData: {
      to: '0x0000000000000000000000000000000000000000',
      data: '0x',
      fallbackHandler: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
      paymentToken: '0x0000000000000000000000000000000000000000',
      payment: 0,
      paymentReceiver: '0x0000000000000000000000000000000000000000'
    },
    network: NETWORK,
    version: '1.3.0'
  };
}

/**
 * Main treasury wallet generation
 */
async function generateTreasuryWallets() {
  console.log('🏛️  Wylloh Treasury Wallet Generation');
  console.log('=====================================');
  console.log(`Network: ${NETWORK}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  
  const treasuryData = {
    generated: new Date().toISOString(),
    network: NETWORK,
    wallets: {}
  };
  
  // 1. Generate Primary Treasury Wallet (3-of-5 multi-sig)
  console.log('\n📊 PRIMARY TREASURY WALLET (3-of-5 Multi-Sig)');
  const primaryTreasury = generateMultiSigWallets(5, 'Primary Treasury (3-of-5)');
  const primaryConfig = generateSafeConfig(
    primaryTreasury.addresses,
    3,
    'Wylloh Primary Treasury - Main platform fees and major expenditures'
  );
  
  treasuryData.wallets.primaryTreasury = {
    type: 'multi-sig',
    threshold: '3-of-5',
    purpose: 'Main treasury for platform fees and major expenditures',
    config: primaryConfig,
    signatories: primaryTreasury.wallets.map((wallet, index) => ({
      role: ['Platform Founder', 'Technical Lead', 'Community Representative', 'Legal Advisor', 'Financial Advisor'][index],
      address: wallet.address,
      index: wallet.index
    }))
  };
  
  // 2. Generate Operational Wallet (single signature)
  console.log('\n💼 OPERATIONAL WALLET (Single Signature)');
  const operationalWallet = generateWallet();
  console.log(`  Address: ${operationalWallet.address}`);
  
  treasuryData.wallets.operational = {
    type: 'single-sig',
    purpose: 'Day-to-day operational expenses (monthly limit: $5,000)',
    address: operationalWallet.address,
    monthlyLimit: '$5,000 USD equivalent'
  };
  
  // 3. Generate Emergency Reserve Wallet (4-of-5 multi-sig)
  console.log('\n🚨 EMERGENCY RESERVE WALLET (4-of-5 Multi-Sig)');
  const emergencyReserve = generateMultiSigWallets(5, 'Emergency Reserve (4-of-5)');
  const emergencyConfig = generateSafeConfig(
    emergencyReserve.addresses,
    4,
    'Wylloh Emergency Reserve - Platform security and emergency situations'
  );
  
  treasuryData.wallets.emergencyReserve = {
    type: 'multi-sig',
    threshold: '4-of-5',
    purpose: 'Platform security and emergency situations only',
    config: emergencyConfig,
    signatories: emergencyReserve.wallets.map((wallet, index) => ({
      role: ['Platform Founder', 'Technical Lead', 'Community Representative', 'Legal Advisor', 'Financial Advisor'][index],
      address: wallet.address,
      index: wallet.index
    }))
  };
  
  // Save public treasury information
  const publicTreasuryInfo = {
    generated: treasuryData.generated,
    network: treasuryData.network,
    wallets: {
      primaryTreasury: {
        type: treasuryData.wallets.primaryTreasury.type,
        threshold: treasuryData.wallets.primaryTreasury.threshold,
        purpose: treasuryData.wallets.primaryTreasury.purpose,
        signatoryRoles: treasuryData.wallets.primaryTreasury.signatories.map(s => s.role),
        addresses: treasuryData.wallets.primaryTreasury.signatories.map(s => s.address)
      },
      operational: {
        type: treasuryData.wallets.operational.type,
        purpose: treasuryData.wallets.operational.purpose,
        address: treasuryData.wallets.operational.address,
        monthlyLimit: treasuryData.wallets.operational.monthlyLimit
      },
      emergencyReserve: {
        type: treasuryData.wallets.emergencyReserve.type,
        threshold: treasuryData.wallets.emergencyReserve.threshold,
        purpose: treasuryData.wallets.emergencyReserve.purpose,
        signatoryRoles: treasuryData.wallets.emergencyReserve.signatories.map(s => s.role),
        addresses: treasuryData.wallets.emergencyReserve.signatories.map(s => s.address)
      }
    }
  };
  
  // Save public information (safe to commit to git)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'treasury-public.json'),
    JSON.stringify(publicTreasuryInfo, null, 2)
  );
  
  // Save private keys separately (DO NOT COMMIT TO GIT)
  const privateKeys = {
    primaryTreasury: primaryTreasury.wallets,
    operational: {
      address: operationalWallet.address,
      privateKey: operationalWallet.privateKey,
      mnemonic: operationalWallet.mnemonic
    },
    emergencyReserve: emergencyReserve.wallets
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'treasury-private.json'),
    JSON.stringify(privateKeys, null, 2)
  );
  
  // Generate Gnosis Safe deployment scripts
  const safeDeploymentScript = `
# Gnosis Safe Deployment Instructions

## Primary Treasury Safe (3-of-5)
Owners: ${primaryTreasury.addresses.join(', ')}
Threshold: 3
Salt Nonce: ${primaryConfig.saltNonce}

## Emergency Reserve Safe (4-of-5)
Owners: ${emergencyReserve.addresses.join(', ')}
Threshold: 4
Salt Nonce: ${emergencyConfig.saltNonce}

## Deployment Steps:
1. Go to https://app.safe.global/
2. Connect wallet with sufficient ETH for deployment
3. Create new Safe with the above parameters
4. Save the Safe addresses in treasury-addresses.json
5. Test multi-sig functionality before use

## Security Checklist:
- [ ] Verify all owner addresses are correct
- [ ] Test transaction signing with required threshold
- [ ] Backup all private keys securely
- [ ] Document key holder responsibilities
- [ ] Set up monitoring for all treasury wallets
`;
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'DEPLOYMENT_INSTRUCTIONS.md'),
    safeDeploymentScript
  );
  
  // Generate .gitignore for treasury folder
  const gitignore = `
# Treasury Security - DO NOT COMMIT PRIVATE KEYS
treasury-private.json
*.key
*.pem
*.p12
backup/
keys/
`;
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '.gitignore'),
    gitignore
  );
  
  console.log('\n✅ Treasury Wallet Generation Complete!');
  console.log('=====================================');
  console.log(`📁 Files generated in: ${OUTPUT_DIR}`);
  console.log('📊 treasury-public.json - Public wallet information (safe to commit)');
  console.log('🔐 treasury-private.json - Private keys (DO NOT COMMIT)');
  console.log('📋 DEPLOYMENT_INSTRUCTIONS.md - Gnosis Safe setup guide');
  console.log('🚫 .gitignore - Security protection');
  
  console.log('\n🔒 SECURITY WARNINGS:');
  console.log('- treasury-private.json contains sensitive private keys');
  console.log('- Store private keys in secure, offline storage');
  console.log('- Use hardware wallets for production signatories');
  console.log('- Never share private keys via insecure channels');
  console.log('- Regularly backup and test wallet access');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Securely distribute private keys to designated signatories');
  console.log('2. Deploy Gnosis Safe contracts using the provided instructions');
  console.log('3. Test multi-signature functionality with small amounts');
  console.log('4. Update treasury governance document with actual addresses');
  console.log('5. Begin treasury operations according to governance policies');
  
  return treasuryData;
}

// Run the script
if (require.main === module) {
  generateTreasuryWallets()
    .then(() => {
      console.log('\n🎉 Treasury setup ready for deployment!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error generating treasury wallets:', error);
      process.exit(1);
    });
}

module.exports = { generateTreasuryWallets }; 