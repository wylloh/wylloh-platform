import { ethers } from 'ethers';
import { createError } from '../middleware/errorHandler';
// @ts-ignore - Contract ABI JSON import
import WyllohToken from '../contracts/WyllohToken.json';
import { IpfsService } from './ipfsService';

// Define token data interfaces
interface RightsThreshold {
  quantity: number;
  rightsType: number;
  description: string;
}

interface AccessRights {
  type: 'perpetual';
  features: {
    download: boolean;
    streaming: boolean;
    offline: boolean;
  };
}

interface DistributionTerms {
  duration?: number;  // Optional duration for distribution rights (not access rights)
  territories?: string[];
  channels?: string[];
  restrictions?: string[];
  stackingThresholds?: {
    quantity: number;
    rights: string[];
  }[];
}

interface TokenCreationData {
  contentId: string;
  contentCid: string;
  metadataCid: string;
  title: string;
  description: string;
  contentType: string;
  creator: string;
  rightsThresholds: RightsThreshold[];
  totalSupply: number;
  royaltyPercentage: number;
  distributionTerms?: DistributionTerms;
}

interface TokenMetadataProperties {
  contentType: string;
  contentId: string;
  contentCid: string;
  metadataCid: string;
  accessRights: AccessRights;
  distributionRights: {
    terms: DistributionTerms;
    disclaimer: string;
  };
}

interface TokenRight {
  quantity: number;
  rightsType: number;
  description: string;
  isDistributionRight: boolean;
}

interface TokenMetadata {
  [key: string]: unknown;
  name: string;
  description: string;
  image: string;
  properties: TokenMetadataProperties;
  rights: TokenRight[];
}

/**
 * Service for managing token operations
 */
class TokenService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private tokenContract: ethers.Contract;
  private contractAddress: string;
  private ipfsService: IpfsService;

  constructor() {
    // Initialize blockchain connection
    const providerUrl = process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    
    // Set up wallet with private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Private key is not defined');
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Set up contract instance
    this.contractAddress = process.env.TOKEN_CONTRACT_ADDRESS || '';
    if (!this.contractAddress) {
      throw new Error('Token contract address is not defined');
    }
    
    this.tokenContract = new ethers.Contract(
      this.contractAddress,
      WyllohToken.abi,
      this.wallet
    );

    this.ipfsService = new IpfsService();
  }

  /**
   * Create a new token for content
   * @param tokenData Token creation data
   */
  async createToken(tokenData: TokenCreationData): Promise<{ tokenId: string; transactionHash: string }> {
    try {
      // Create token metadata
      const metadata: TokenMetadata = {
        name: tokenData.title,
        description: tokenData.description,
        image: `ipfs://${tokenData.metadataCid}`, // Thumbnail or poster image
        properties: {
          contentType: tokenData.contentType,
          contentId: tokenData.contentId,
          contentCid: tokenData.contentCid,
          metadataCid: tokenData.metadataCid,
          accessRights: {
            type: 'perpetual',
            features: {
              download: true,
              streaming: true,
              offline: true
            }
          },
          distributionRights: {
            terms: tokenData.distributionTerms || {},
            disclaimer: "This token grants perpetual access rights to the content (similar to owning a DVD/Blu-ray) and can be stacked for commercial distribution rights. Copyright and intellectual property rights remain with the content creator/studio."
          }
        },
        rights: tokenData.rightsThresholds.map((threshold: RightsThreshold): TokenRight => ({
          quantity: threshold.quantity,
          rightsType: threshold.rightsType,
          description: threshold.description,
          isDistributionRight: true
        }))
      };

      // Upload metadata to IPFS
      const metadataCid = await this.ipfsService.uploadMetadata(metadata);
      const tokenURI = `ipfs://${metadataCid}`;

      // Generate token ID from content ID
      const tokenId = ethers.utils.id(tokenData.contentId);

      // Create token transaction
      const tx = await this.tokenContract.create(
        tokenData.creator,
        tokenId,
        tokenData.totalSupply,
        tokenData.contentId,
        ethers.utils.id(tokenData.contentCid),
        tokenData.contentType,
        tokenURI,
        tokenData.creator,
        tokenData.royaltyPercentage * 100 // Convert to basis points
      );

      const receipt = await tx.wait();

      return {
        tokenId,
        transactionHash: receipt.transactionHash
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to create token: ${error.message}`, 500);
      }
      throw createError('Failed to create token: Unknown error', 500);
    }
  }

  /**
   * Get token details by ID
   * @param tokenId Token ID
   */
  async getTokenById(tokenId: string): Promise<{
    tokenId: string;
    contractAddress: string;
    tokenURI: string;
    totalSupply: string;
    contentId: string;
    contentType: string;
    creator: string;
    rightsThresholds: Array<{
      quantity: string;
      rightsType: number;
      enabled: boolean;
    }>;
    royaltyRecipient: string;
    royaltyPercentage: number;
  }> {
    try {
      // Get token URI
      const tokenURI = await this.tokenContract.uri(tokenId);
      
      // Get token supply
      const totalSupply = await this.tokenContract.totalSupply(tokenId);
      
      // Get content metadata
      const contentMetadata = await this.tokenContract.getContentMetadata(tokenId);
      
      // Get rights thresholds
      const rightsThresholds = await this.tokenContract.getRightsThresholds(tokenId);
      
      // Get royalty info (assuming 100 as the sale price for percentage calculation)
      const royaltyInfo = await this.tokenContract.royaltyInfo(tokenId, 100);
      
      return {
        tokenId,
        contractAddress: this.contractAddress,
        tokenURI,
        totalSupply: totalSupply.toString(),
        contentId: contentMetadata.contentId,
        contentType: contentMetadata.contentType,
        creator: contentMetadata.creator,
        rightsThresholds: rightsThresholds.map((threshold: { quantity: ethers.BigNumber; rightsType: number; enabled: boolean }) => ({
          quantity: threshold.quantity.toString(),
          rightsType: threshold.rightsType,
          enabled: threshold.enabled
        })),
        royaltyRecipient: royaltyInfo[0],
        royaltyPercentage: (royaltyInfo[1].toNumber() / 100)
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get token details: ${error.message}`, 500);
      }
      throw createError('Failed to get token details: Unknown error', 500);
    }
  }

  /**
   * Verify if a wallet has specific rights for a token
   * @param tokenId Token ID
   * @param walletAddress Wallet address to check
   * @param rightsType Rights type to check for (0 for basic access, 1+ for distribution rights)
   */
  async verifyTokenRights(tokenId: string, walletAddress: string, rightsType: number): Promise<boolean> {
    try {
      // First check if the wallet owns any tokens (grants basic access rights)
      const balance = await this.tokenContract.balanceOf(walletAddress, tokenId);
      
      // If checking for basic access rights (rightsType = 0) and has balance, return true
      if (rightsType === 0 && balance.gt(0)) {
        return true;
      }
      
      // For distribution rights, check if they meet the stacking threshold
      if (rightsType > 0) {
        const hasRights = await this.tokenContract.hasRights(walletAddress, tokenId, rightsType);
        return hasRights;
      }

      return false;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to verify token rights: ${error.message}`, 500);
      }
      throw createError('Failed to verify token rights: Unknown error', 500);
    }
  }

  /**
   * Get tokens owned by a wallet
   * @param walletAddress Wallet address
   * @param page Page number for pagination
   * @param limit Items per page
   */
  async getTokensByOwner(walletAddress: string, page: number = 1, limit: number = 20) {
    try {
      // This is a simplified implementation
      // In a real-world scenario, you would use a subgraph or indexer service
      // to efficiently query tokens owned by a wallet address
      
      // For demonstration purposes, we'll return a stub response
      return {
        tokens: [],
        pagination: {
          page,
          limit,
          totalPages: 0,
          totalItems: 0
        },
        message: 'Implementation requires an indexer service for efficient querying'
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get tokens by owner: ${error.message}`, 500);
      }
      throw createError('Failed to get tokens by owner: Unknown error', 500);
    }
  }

  /**
   * Create a marketplace listing for a token
   * @param tokenId Token ID
   * @param sellerAddress Seller wallet address
   * @param quantity Quantity to list
   * @param price Price per token
   * @param currency Currency for the transaction
   */
  async listToken(
    tokenId: string,
    sellerAddress: string,
    quantity: number,
    price: number,
    currency: string = 'MATIC'
  ): Promise<{
    listingId: string;
    tokenId: string;
    sellerAddress: string;
    quantity: number;
    price: number;
    currency: string;
    status: string;
    message: string;
  }> {
    try {
      // This would integrate with your marketplace smart contract
      // For now, we'll return a stub response
      return {
        listingId: `listing-${Date.now()}`,
        tokenId,
        sellerAddress,
        quantity,
        price,
        currency,
        status: 'active',
        message: 'Implementation requires marketplace smart contract integration'
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to list token: ${error.message}`, 500);
      }
      throw createError('Failed to list token: Unknown error', 500);
    }
  }

  /**
   * Helper method to get a user's wallet address from their user ID
   * @param userId User ID
   */
  private async getUserWalletAddress(userId: string): Promise<string> {
    // In a real implementation, you would query your database to get the wallet address
    // For now, we'll use a placeholder wallet address
    return ethers.Wallet.createRandom().address;
  }
}

export default new TokenService();