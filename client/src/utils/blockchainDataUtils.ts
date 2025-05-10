import { providers, Contract } from 'ethers';
import { SearchResult } from '../services/search.service';

// Common token standards ABIs - minimal interfaces needed for metadata functions
const ERC721_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
];

const ERC1155_ABI = [
  'function uri(uint256 id) external view returns (string memory)',
  'function balanceOf(address account, uint256 id) external view returns (uint256)',
];

/**
 * Fetches token metadata from IPFS, Arweave, or HTTP URI
 * 
 * @param uri Token URI from the contract
 * @returns Parsed metadata object
 */
export const fetchTokenMetadata = async (uri: string): Promise<any> => {
  try {
    // Handle IPFS URLs
    if (uri.startsWith('ipfs://')) {
      const ipfsGateway = 'https://ipfs.io/ipfs/';
      uri = ipfsGateway + uri.replace('ipfs://', '');
    }
    
    // Handle Arweave URLs
    if (uri.startsWith('ar://')) {
      const arweaveGateway = 'https://arweave.net/';
      uri = arweaveGateway + uri.replace('ar://', '');
    }
    
    // Fetch the metadata
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return { error: 'Failed to fetch metadata', uri };
  }
};

/**
 * Verifies if a given address owns a specific token
 * 
 * @param contractAddress The token contract address
 * @param tokenId The token ID to check
 * @param ownerAddress The address to verify ownership for
 * @param chainId The blockchain chain ID
 * @param provider The Ethers.js provider
 * @returns Boolean indicating ownership
 */
export const verifyTokenOwnership = async (
  contractAddress: string,
  tokenId: string,
  ownerAddress: string,
  tokenStandard: string,
  chainId: number,
  provider: providers.Provider
): Promise<boolean> => {
  try {
    // Select ABI based on token standard
    const abi = tokenStandard.includes('721') ? ERC721_ABI : ERC1155_ABI;
    
    // Create contract instance
    const contract = new Contract(contractAddress, abi, provider);
    
    // Check ownership based on token standard
    if (tokenStandard.includes('721')) {
      // ERC-721 - check ownerOf
      const currentOwner = await contract.ownerOf(tokenId);
      return currentOwner.toLowerCase() === ownerAddress.toLowerCase();
    } else if (tokenStandard.includes('1155')) {
      // ERC-1155 - check balance > 0
      const balance = await contract.balanceOf(ownerAddress, tokenId);
      return balance.gt(0);
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying token ownership:', error);
    return false;
  }
};

/**
 * Enhances search results with blockchain token data
 * 
 * @param results Search results to enhance
 * @param provider Ethers.js provider
 * @returns Enhanced search results with token data
 */
export const enhanceResultsWithBlockchainData = async (
  results: SearchResult[],
  provider: providers.Provider
): Promise<SearchResult[]> => {
  // Filter results that have token data
  const tokenResults = results.filter(result => result.token);
  
  // Process results in parallel
  const enhancedPromises = tokenResults.map(async (result) => {
    try {
      if (!result.token) return result;
      
      // Get token metadata
      let metadata = result.token.metadata;
      
      // If metadata doesn't exist or is minimal, fetch it
      if (!metadata || Object.keys(metadata).length <= 2) {
        const tokenContract = new Contract(
          result.token.contractAddress,
          result.token.standard.includes('721') ? ERC721_ABI : ERC1155_ABI,
          provider
        );
        
        // Get token URI
        let tokenUri;
        try {
          if (result.token.standard.includes('721')) {
            tokenUri = await tokenContract.tokenURI(result.token.tokenId);
          } else {
            tokenUri = await tokenContract.uri(result.token.tokenId);
            // Some ERC-1155 implementations use URI templates with {id}
            if (tokenUri.includes('{id}')) {
              // Convert tokenId to hex and pad to 64 characters
              const hexId = Number(result.token.tokenId).toString(16).padStart(64, '0');
              tokenUri = tokenUri.replace('{id}', hexId);
            }
          }
          
          // Fetch and parse metadata
          metadata = await fetchTokenMetadata(tokenUri);
        } catch (error) {
          console.error(`Error fetching token URI for ${result.contentId}:`, error);
        }
      }
      
      // Update result with enhanced metadata
      return {
        ...result,
        token: {
          ...result.token,
          metadata: metadata || result.token.metadata,
        }
      };
    } catch (error) {
      console.error(`Error enhancing result ${result.contentId}:`, error);
      return result;
    }
  });
  
  // Wait for all enhancements to complete
  const enhancedTokenResults = await Promise.all(enhancedPromises);
  
  // Replace the original token results with enhanced ones
  const resultMap = new Map(results.map(r => [r.contentId, r]));
  enhancedTokenResults.forEach(r => resultMap.set(r.contentId, r));
  
  return Array.from(resultMap.values());
};

/**
 * Gets supported blockchains and their configurations
 * 
 * @returns List of supported blockchains with configurations
 */
export const getSupportedBlockchains = () => {
  return [
    { 
      id: 'ethereum', 
      name: 'Ethereum', 
      chainId: 1,
      rpcUrl: 'https://mainnet.infura.io/v3/your-infura-key',
      blockExplorer: 'https://etherscan.io',
      tokenStandards: ['ERC-721', 'ERC-1155'] 
    },
    { 
      id: 'polygon', 
      name: 'Polygon', 
      chainId: 137,
      rpcUrl: 'https://polygon-rpc.com',
      blockExplorer: 'https://polygonscan.com',
      tokenStandards: ['ERC-721', 'ERC-1155'] 
    },
    { 
      id: 'solana', 
      name: 'Solana',
      chainId: 0, // Not an EVM chain
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      blockExplorer: 'https://explorer.solana.com',
      tokenStandards: ['SPL'] 
    },
    { 
      id: 'binance', 
      name: 'Binance Smart Chain',
      chainId: 56,
      rpcUrl: 'https://bsc-dataseed.binance.org',
      blockExplorer: 'https://bscscan.com',
      tokenStandards: ['BEP-721', 'BEP-1155'] 
    }
  ];
};

/**
 * Gets blockchain explorer URL for a token or address
 * 
 * @param blockchain Blockchain identifier (ethereum, polygon, etc.)
 * @param address Contract address or wallet address
 * @param tokenId Optional token ID for specific token view
 * @returns Explorer URL
 */
export const getBlockchainExplorerUrl = (
  blockchain: string,
  address: string,
  tokenId?: string
): string => {
  const chains = getSupportedBlockchains();
  const chain = chains.find(c => c.id === blockchain);
  
  if (!chain) return '';
  
  let url = `${chain.blockExplorer}/token/${address}`;
  
  if (tokenId) {
    // Format depends on the explorer
    if (blockchain === 'ethereum' || blockchain === 'polygon' || blockchain === 'binance') {
      url = `${chain.blockExplorer}/token/${address}?a=${tokenId}`;
    } else if (blockchain === 'solana') {
      url = `${chain.blockExplorer}/address/${tokenId}`;
    }
  }
  
  return url;
};

/**
 * Formats blockchain address for display
 * 
 * @param address Blockchain address to format
 * @param length Number of characters to show at start and end
 * @returns Formatted address (e.g. 0x1234...5678)
 */
export const formatAddress = (address: string, length: number = 4): string => {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
};

/**
 * Resolves ENS name for an Ethereum address
 * 
 * @param address Ethereum address to resolve
 * @param provider Ethers.js provider
 * @returns ENS name if available, or formatted address
 */
export const resolveEnsName = async (
  address: string,
  provider: providers.Provider
): Promise<string> => {
  try {
    const ensName = await provider.lookupAddress(address);
    return ensName || formatAddress(address);
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return formatAddress(address);
  }
}; 