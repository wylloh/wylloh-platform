// Wylloh Platform - Polygon Mainnet Configuration
// Deployed July 5, 2025

export const MAINNET_CONFIG = {
  // Network Configuration
  network: 'polygon',
  chainId: 137,
  rpcUrl: 'https://polygon-mainnet.infura.io/v3/', // Add your Infura project ID
  
  // Deployed Contract Addresses (Polygon Mainnet)
  contracts: {
    // Master contract for all films (ERC1155)
    WyllohFilmRegistry: '0x624c5C6395EB28b9952FE9ae0d87B12520b55Bfc',
    
    // Platform utility token (ERC20)
    WyllohToken: '0xaD36BE606F3c97a61E46b272979A92c33ffB04ED',
    
    // Film trading & licensing marketplace
    WyllohMarketplace: '0xE171E9db4f2f64d3Fc80AA6E2bdF2770Bb006EC8',
    
    // Automated royalty distribution
    RoyaltyDistributor: '0x23735B20dED41014a03a3ad1EBCb4623B8aDd52d',
    
    // IPFS storage management
    StoragePool: '0x849760495E12529b43e1BA53da6B156ffcE8120A'
  },
  
  // Legacy addresses for backward compatibility
  legacy: {
    tokenAddress: '0xaD36BE606F3c97a61E46b272979A92c33ffB04ED',
    marketplaceAddress: '0xE171E9db4f2f64d3Fc80AA6E2bdF2770Bb006EC8',
    filmFactoryAddress: 'DEPRECATED' // Use WyllohFilmRegistry instead
  },
  
  // Platform Configuration
  platform: {
    adminWallet: '0x7FA50da5a8f998c9184E344279b205DE699Aa672',
    treasuryWallet: '0x7FA50da5a8f998c9184E344279b205DE699Aa672',
    deployedAt: '2025-07-05T17:09:17.967Z'
  },
  
  // First Film Configuration
  firstFilm: {
    tokenId: 1,
    slug: 'the-cocoanuts-1929',
    title: 'The Cocoanuts',
    director: 'Robert Florey',
    year: 1929,
    significance: 'First film tokenized on Wylloh platform'
  },
  
  // External Services
  services: {
    ipfsGateway: 'https://gateway.pinata.cloud/ipfs/',
    polygonscanApi: 'https://api.polygonscan.com/api',
    infuraWss: 'wss://polygon-mainnet.infura.io/ws/v3/' // Add your project ID
  }
} as const;

// Type definitions for type safety
export type MainnetConfig = typeof MAINNET_CONFIG;
export type ContractName = keyof typeof MAINNET_CONFIG.contracts; 