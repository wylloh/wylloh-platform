import { ethers } from 'ethers';
import MarketplaceContract from '../../../artifacts/contracts/marketplace/WyllohMarketplace.sol/WyllohMarketplace.json';

export async function getMarketplaceContract() {
  // Connect to configured blockchain network
  const provider = new ethers.providers.JsonRpcProvider(
  process.env.REACT_APP_WEB3_PROVIDER || 'https://polygon-rpc.com'
);
  
  // Get the contract address from environment
  const contractAddress = process.env.REACT_APP_MARKETPLACE_CONTRACT;
  if (!contractAddress) {
    throw new Error('Marketplace contract address not found in environment variables');
  }
  
  // Create contract instance
  const contract = new ethers.Contract(
    contractAddress,
    MarketplaceContract.abi,
    provider
  );
  
  return contract;
} 