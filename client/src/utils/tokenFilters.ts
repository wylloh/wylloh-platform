import { providers, Contract } from 'ethers';

// Types
export interface TokenData {
  tokenId: string;
  contractAddress: string;
  standard: string;
  chain: string;
  metadata?: any;
}

// Wylloh-verified contract addresses (for demo purposes)
// In production, this would come from a registry or configuration
const WYLLOH_VERIFIED_CONTRACTS: Record<string, string[]> = {
  'ethereum': [
    '0x1234567890abcdef1234567890abcdef12345678', // Example movie collection
    '0xabcdef1234567890abcdef1234567890abcdef12', // Example film festival collection
  ],
  'polygon': [
    '0x2345678901abcdef2345678901abcdef23456789', // Example Polygon movie collection
  ],
  'binance': [
    '0x3456789012abcdef3456789012abcdef34567890', // Example BSC movie collection
  ]
};

// ABI fragment for contract verification
const CONTRACT_VERIFICATION_ABI = [
  'function isWyllohVerified() external view returns (bool)',
  'function contentType() external view returns (string)',
  'function supportsInterface(bytes4 interfaceId) external view returns (bool)',
];

/**
 * Check if a token is from a Wylloh-verified contract
 * @param contractAddress The token contract address
 * @param chain The blockchain name (lowercase)
 * @returns Boolean indicating if the contract is Wylloh-verified
 */
export const isWyllohVerifiedContract = (contractAddress: string, chain: string): boolean => {
  // Normalize input
  const normalizedChain = chain.toLowerCase();
  const normalizedAddress = contractAddress.toLowerCase();
  
  // Check against known verified contracts
  if (WYLLOH_VERIFIED_CONTRACTS[normalizedChain]) {
    return WYLLOH_VERIFIED_CONTRACTS[normalizedChain].some(
      address => address.toLowerCase() === normalizedAddress
    );
  }
  
  return false;
};

/**
 * Check if a token has the required Wylloh metadata
 * @param metadata Token metadata
 * @returns Boolean indicating if the token has valid movie metadata
 */
export const hasValidWyllohMetadata = (metadata: any): boolean => {
  if (!metadata) return false;
  
  // Check for required movie metadata fields
  const requiredFields = [
    'title',
    'contentType',
    'genre',
    'creator',
    'wyllohContentSignature', // Special signature field for Wylloh content
  ];
  
  const hasRequiredFields = requiredFields.every(field => 
    metadata[field] !== undefined && metadata[field] !== null
  );
  
  // Check if content type is a movie/video
  const isVideoContent = metadata.contentType === 'movie' || 
                        metadata.contentType === 'video' ||
                        metadata.contentType === 'film';
  
  // Verify Wylloh signature (in real implementation, this would validate cryptographically)
  const hasValidSignature = metadata.wyllohContentSignature && 
                           metadata.wyllohContentSignature.startsWith('wylloh:');
  
  return hasRequiredFields && isVideoContent && hasValidSignature;
};

/**
 * Verify if a contract is Wylloh-verified on-chain
 * @param contractAddress Contract address
 * @param provider Ethers.js provider
 * @returns Promise resolving to boolean indicating verification status
 */
export const verifyWyllohContract = async (
  contractAddress: string,
  provider: providers.Provider
): Promise<boolean> => {
  try {
    const contract = new Contract(contractAddress, CONTRACT_VERIFICATION_ABI, provider);
    
    // Check for Wylloh verification interface
    const interfaceId = '0x5b5e139f'; // EIP-165 interface ID for IWyllohVerified (example)
    const supportsInterface = await contract.supportsInterface(interfaceId);
    
    if (!supportsInterface) {
      return false;
    }
    
    // Check verification status
    const isVerified = await contract.isWyllohVerified();
    
    // Check content type
    const contentType = await contract.contentType();
    const isVideoContent = contentType === 'movie' || 
                          contentType === 'video' || 
                          contentType === 'film';
    
    return isVerified && isVideoContent;
  } catch (error) {
    console.error('Error verifying Wylloh contract:', error);
    return false;
  }
};

/**
 * Filter a list of tokens to only include Wylloh movie tokens
 * @param tokens Array of token data 
 * @param includeExternalProtocol Whether to include tokens from external platforms using Wylloh protocol
 * @returns Filtered list of tokens
 */
export const filterWyllohMovieTokens = (
  tokens: TokenData[],
  includeExternalProtocol: boolean = false
): TokenData[] => {
  return tokens.filter(token => {
    // Check contract verification status
    const isVerifiedContract = isWyllohVerifiedContract(token.contractAddress, token.chain);
    
    // Check metadata
    const hasValidMetadata = hasValidWyllohMetadata(token.metadata);
    
    // For external protocol tokens (if enabled)
    const isExternalProtocolToken = includeExternalProtocol && 
                                    token.metadata && 
                                    token.metadata.protocol === 'wylloh';
    
    return isVerifiedContract && hasValidMetadata || isExternalProtocolToken;
  });
};

/**
 * Filter tokens from wallet to only include Wylloh movie tokens
 * @param walletAddress User's wallet address
 * @param provider Ethers.js provider
 * @param includeExternalProtocol Whether to include tokens from external platforms using Wylloh protocol
 * @returns Promise resolving to filtered tokens
 */
export const getWyllohMovieTokensFromWallet = async (
  walletAddress: string,
  provider: providers.Provider,
  includeExternalProtocol: boolean = false
): Promise<TokenData[]> => {
  try {
    // In a real implementation, this would:
    // 1. Query the user's wallet for all tokens
    // 2. Filter for tokens from Wylloh-verified contracts
    // 3. Verify each token has valid movie metadata
    
    // Placeholder implementation
    // This would be replaced with actual wallet querying logic
    const mockTokens: TokenData[] = [
      {
        tokenId: '1234',
        contractAddress: '0x624c5C6395EB28b9952FE9ae0d87B12520b55Bfc', // WyllohFilmRegistry
        standard: 'ERC-721',
        chain: 'ethereum',
        metadata: {
          title: 'Example Movie',
          contentType: 'movie',
          genre: 'Action',
          creator: 'Director Name',
          wyllohContentSignature: 'wylloh:verified:12345'
        }
      },
      {
        tokenId: '5678',
        contractAddress: '0xE171E9db4f2f64d3Fc80AA6E2bdF2770Bb006EC8', // WyllohMarketplace
        standard: 'ERC-1155',
        chain: 'polygon',
        metadata: {
          title: 'Another Film',
          contentType: 'film',
          genre: 'Drama',
          creator: 'Another Director',
          wyllohContentSignature: 'wylloh:verified:67890'
        }
      },
      {
        tokenId: '9012',
        contractAddress: '0xaD36BE606F3c97a61E46b272979A92c33ffB04ED', // WyllohToken
        standard: 'ERC-721',
        chain: 'ethereum',
        metadata: {
          name: 'Random NFT',
          description: 'Not a movie',
          type: 'image'
        }
      }
    ];
    
    // Filter the tokens
    return filterWyllohMovieTokens(mockTokens, includeExternalProtocol);
  } catch (error) {
    console.error('Error getting Wylloh movie tokens from wallet:', error);
    return [];
  }
};

export default {
  isWyllohVerifiedContract,
  hasValidWyllohMetadata,
  verifyWyllohContract,
  filterWyllohMovieTokens,
  getWyllohMovieTokensFromWallet
}; 