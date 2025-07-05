// Wylloh Platform API - Polygon Mainnet Configuration
// Deployed July 5, 2025

export const API_MAINNET_CONFIG = {
  // Network Configuration
  network: 'polygon',
  chainId: 137,
  
  // Deployed Contract Addresses (Polygon Mainnet)
  contracts: {
    // ERC20 Platform Token
    tokenContract: process.env.TOKEN_CONTRACT_ADDRESS || '0xaD36BE606F3c97a61E46b272979A92c33ffB04ED',
    
    // Master ERC1155 Film Registry
    filmRegistry: process.env.FILM_REGISTRY_ADDRESS || '0x624c5C6395EB28b9952FE9ae0d87B12520b55Bfc',
    
    // Marketplace for trading
    marketplace: process.env.MARKETPLACE_ADDRESS || '0xE171E9db4f2f64d3Fc80AA6E2bdF2770Bb006EC8',
    
    // Royalty distribution
    royaltyDistributor: process.env.ROYALTY_DISTRIBUTOR_ADDRESS || '0x23735B20dED41014a03a3ad1EBCb4623B8aDd52d',
    
    // IPFS storage management
    storagePool: process.env.STORAGE_POOL_ADDRESS || '0x849760495E12529b43e1BA53da6B156ffcE8120A',
    
    // Rights management (using film registry)
    rightsManager: process.env.RIGHTS_MANAGER_ADDRESS || '0x624c5C6395EB28b9952FE9ae0d87B12520b55Bfc'
  },
  
  // Platform Configuration
  platform: {
    adminWallet: process.env.ADMIN_WALLET_ADDRESS || '0x7FA50da5a8f998c9184E344279b205DE699Aa672',
    treasuryWallet: process.env.ADMIN_WALLET_ADDRESS || '0x7FA50da5a8f998c9184E344279b205DE699Aa672'
  },
  
  // RPC Configuration
  rpc: {
    url: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/',
    websocket: process.env.POLYGON_WS_URL || 'wss://polygon-mainnet.infura.io/ws/v3/'
  },
  
  // Blockchain Settings
  blockchain: {
    blockConfirmations: parseInt(process.env.BLOCK_CONFIRMATIONS || '3'),
    gasLimit: parseInt(process.env.GAS_LIMIT || '2000000'),
    gasPrice: process.env.GAS_PRICE || 'auto'
  }
} as const;

// Helper function to get contract address by name
export function getContractAddress(contractName: keyof typeof API_MAINNET_CONFIG.contracts): string {
  return API_MAINNET_CONFIG.contracts[contractName];
}

// Helper function to validate contract addresses
export function validateContractAddresses(): boolean {
  const contracts = API_MAINNET_CONFIG.contracts;
  
  for (const [name, address] of Object.entries(contracts)) {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      console.error(`Invalid contract address for ${name}: ${address}`);
      return false;
    }
  }
  
  return true;
}

// Export for type safety
export type APIMainnetConfig = typeof API_MAINNET_CONFIG; 