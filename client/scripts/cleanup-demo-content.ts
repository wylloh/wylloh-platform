import { ethers } from 'ethers';
import MarketplaceContract from '../../artifacts/contracts/marketplace/WyllohMarketplace.sol/WyllohMarketplace.json';

interface ContentMetadata {
  isDemo?: boolean;
  demoVersion?: string;
}

interface Content {
  id: string;
  title: string;
  description: string;
  metadata?: ContentMetadata;
}

async function getMarketplaceContract() {
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

async function cleanupDemoContent() {
  try {
    const contract = await getMarketplaceContract();
    
    // Get all content
    const allContent = await contract.getAllContent() as Content[];
    
    // Filter for demo content (those with isDemo flag)
    const demoContent = allContent.filter((content: Content) => 
      content.metadata && content.metadata.isDemo
    );
    
    console.log(`Found ${demoContent.length} demo content items to remove...`);
    
    // Remove each demo content
    for (const content of demoContent) {
      await contract.removeContent(content.id);
      console.log(`Removed demo content: ${content.title} (${content.id})`);
    }
    
    console.log('Demo content cleanup complete!');
  } catch (error) {
    console.error('Error cleaning up demo content:', error);
    process.exit(1);
  }
}

cleanupDemoContent()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 