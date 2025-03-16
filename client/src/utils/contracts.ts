import { ethers } from 'ethers';
import MarketplaceContract from '../../../artifacts/contracts/marketplace/WyllohMarketplace.sol/WyllohMarketplace.json';

export async function getMarketplaceContract() {
  // Connect to local Ganache
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  
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