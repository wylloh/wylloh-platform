import { ethers } from 'ethers';

// Import ABI from local file or environment
let MarketplaceContract: any;
try {
  MarketplaceContract = require('../../../artifacts/contracts/marketplace/WyllohMarketplace.sol/WyllohMarketplace.json');
} catch (error) {
  console.warn('⚠️ Marketplace contract artifacts not found, using minimal ABI');
  MarketplaceContract = {
    abi: [
      "function purchaseTokens(address tokenContract, uint256 tokenId, uint256 quantity) payable",
      "function buyTokens(uint256 tokenId, uint256 quantity) payable",
      "function listTokens(uint256 tokenId, uint256 quantity, uint256 price)",
      "function setTokenPrice(uint256 tokenId, uint256 newPrice)",
      "event TokensPurchased(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice)",
      "event TokensListed(address indexed seller, uint256 indexed tokenId, uint256 quantity, uint256 price)"
    ]
  };
}

/**
 * Contract Configuration Interface
 */
export interface ContractConfig {
  tokenAddress?: string;
  marketplaceAddress?: string;
  filmFactoryAddress?: string;
  networkName?: string;
  chainId?: number;
}

/**
 * Load contract configuration from various sources
 * Priority: Environment variables > deployed config > network-specific config
 */
export function loadContractConfig(): ContractConfig {
  const config: ContractConfig = {};

  // Load from environment variables
  if (process.env.REACT_APP_CONTRACT_ADDRESS) {
    config.tokenAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  }
  if (process.env.REACT_APP_MARKETPLACE_ADDRESS) {
    config.marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
  }
  if (process.env.REACT_APP_FILM_FACTORY_ADDRESS) {
    config.filmFactoryAddress = process.env.REACT_APP_FILM_FACTORY_ADDRESS;
  }

  // Load from deployed addresses config
  try {
    const deployedAddresses = require('../config/deployedAddresses.json');
    if (!config.tokenAddress && deployedAddresses.tokenAddress) {
      config.tokenAddress = deployedAddresses.tokenAddress;
    }
    if (!config.marketplaceAddress && deployedAddresses.marketplaceAddress) {
      config.marketplaceAddress = deployedAddresses.marketplaceAddress;
    }
  } catch (error) {
    console.log('ℹ️ No deployed addresses config found');
  }

  // Load from network-specific config (Polygon)
  try {
    const polygonAddresses = require('../config/polygonAddresses.json');
    if (!config.tokenAddress && polygonAddresses.historicFilmContract) {
      config.tokenAddress = polygonAddresses.historicFilmContract;
    }
    if (!config.filmFactoryAddress && polygonAddresses.factoryAddress) {
      config.filmFactoryAddress = polygonAddresses.factoryAddress;
    }
    config.networkName = polygonAddresses.network;
    config.chainId = polygonAddresses.chainId;
  } catch (error) {
    console.log('ℹ️ No Polygon addresses config found');
  }

  return config;
}

/**
 * Get marketplace contract instance with dynamic address loading
 */
export async function getMarketplaceContract() {
  // Connect to configured blockchain network
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_WEB3_PROVIDER || 'https://polygon-rpc.com'
  );
  
  // Load contract configuration
  const config = loadContractConfig();
  
  // Get the contract address from configuration
  const contractAddress = config.marketplaceAddress || process.env.REACT_APP_MARKETPLACE_CONTRACT;
  if (!contractAddress) {
    throw new Error('Marketplace contract address not found in configuration');
  }
  
  // Validate address format
  if (!ethers.utils.isAddress(contractAddress)) {
    throw new Error(`Invalid marketplace contract address: ${contractAddress}`);
  }
  
  // Create contract instance
  const contract = new ethers.Contract(
    contractAddress,
    MarketplaceContract.abi,
    provider
  );
  
  console.log(`🏪 Marketplace contract loaded: ${contractAddress}`);
  return contract;
}

/**
 * Get film factory contract instance with dynamic address loading
 */
export async function getFilmFactoryContract() {
  // Connect to configured blockchain network
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_WEB3_PROVIDER || 'https://polygon-rpc.com'
  );
  
  // Load contract configuration
  const config = loadContractConfig();
  
  // Get the contract address from configuration
  const contractAddress = config.filmFactoryAddress;
  if (!contractAddress) {
    throw new Error('Film factory contract address not found in configuration');
  }
  
  // Validate address format
  if (!ethers.utils.isAddress(contractAddress)) {
    throw new Error(`Invalid film factory contract address: ${contractAddress}`);
  }
  
  // Film Factory ABI
  const filmFactoryAbi = [
    "function deployFilmContract(string memory filmId, string memory title, address creator, uint256 maxSupply, uint256[] memory rightsThresholds, string memory baseURI) returns (address)",
    "function getFilmContract(string memory filmId) view returns (address)",
    "function getAllFilmContracts() view returns (address[])",
    "function getTotalFilms() view returns (uint256)",
    "event FilmContractDeployed(string indexed filmId, string title, address indexed creator, address indexed contractAddress)"
  ];
  
  // Create contract instance
  const contract = new ethers.Contract(
    contractAddress,
    filmFactoryAbi,
    provider
  );
  
  console.log(`🏭 Film factory contract loaded: ${contractAddress}`);
  return contract;
}

/**
 * Validate contract configuration
 */
export function validateContractConfig(config: ContractConfig): boolean {
  const errors: string[] = [];
  
  if (!config.tokenAddress || !ethers.utils.isAddress(config.tokenAddress)) {
    errors.push('Invalid or missing token contract address');
  }
  
  if (config.marketplaceAddress && !ethers.utils.isAddress(config.marketplaceAddress)) {
    errors.push('Invalid marketplace contract address');
  }
  
  if (config.filmFactoryAddress && !ethers.utils.isAddress(config.filmFactoryAddress)) {
    errors.push('Invalid film factory contract address');
  }
  
  if (errors.length > 0) {
    console.error('❌ Contract configuration validation failed:', errors);
    return false;
  }
  
  console.log('✅ Contract configuration is valid');
  return true;
} 