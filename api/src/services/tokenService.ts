import { ethers } from 'ethers';
import { createError } from '../middleware/errorHandler';
import WyllohToken from '../contracts/WyllohToken.json';
import ipfsService from './ipfsService';

// Define token data interface
interface TokenCreationData {
  contentId: string;
  contentCid: string;
  metadataCid: string;
  title: string;
  description: string;
  contentType: string;
  creator: string;
  rightsThresholds: Array<{
    quantity: number;
    rightsType: number;
    description: string;
  }>;
  totalSupply: number;
  royaltyPercentage: number;
}

/**
 * Service for managing token operations
 */
class TokenService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private tokenContract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    // Initialize blockchain connection
    const providerUrl = process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    
    // Set up wallet with private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('Private key is not defined');
      throw new Error('Private key is not defined');
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Set up contract instance
    this.contractAddress = process.env.TOKEN_CONTRACT_ADDRESS || '';
    if (!this.contractAddress) {
      console.error('Token contract address is not defined');
      throw new Error('Token contract address is not defined');
    }
    
    this.tokenContract = new ethers.Contract(
      this.contractAddress,
      WyllohToken.abi,
      this.wallet
    );
  }

  /**
   * Create a new token for content
   * @param tokenData Token creation data
   */
  async createToken(tokenData: TokenCreationData) {
    try {
      // Generate a unique token ID based on content
      const tokenIdBytes = ethers.utils.solidityKeccak256(
        ['string', 'string', 'uint256'],
        [tokenData.contentId, tokenData.contentCid, Date.now()]
      );
      const tokenId = ethers.BigNumber.from(tokenIdBytes);

      // Create token metadata
      const metadata = {
        name: tokenData.title,
        description: tokenData.description,
        image: `ipfs://${tokenData.metadataCid}`, // Thumbnail or poster image
        properties: {
          contentType: tokenData.contentType,
          contentId: tokenData.contentId,
          contentCid: tokenData.contentCid,
          metadataCid: tokenData.metadataCid
        },
        rights: tokenData.rightsThresholds.map(threshold => ({
          quantity: threshold.quantity,
          rightsType: threshold.rightsType,
          description: threshold.description
        }))
      };

      // Upload metadata to IPFS
      const metadataCid = await ipfsService.uploadMetadata(metadata);
      const tokenURI = `ipfs://${metadataCid}`;

      // Convert thresholds to contract format
      const quantities = tokenData.rightsThresholds.map(t => t.quantity);
      const rightsTypes = tokenData.rightsThresholds.map(t => t.rightsType);

      // Get creator's wallet address (this would come from your user management system)
      const creatorAddress = await this.getUserWalletAddress(tokenData.creator);
      
      // Create token transaction
      const tx = await this.tokenContract.create(
        creatorAddress, // initial token recipient (creator)
        tokenId, // token ID
        tokenData.totalSupply, // initial supply
        tokenData.contentId, // content ID
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenData.contentCid)), // content hash
        tokenData.contentType, // content type
        tokenURI, // token URI
        creatorAddress, // royalty recipient (creator)
        tokenData.royaltyPercentage // royalty percentage in basis points
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Set rights thresholds
      if (tokenData.rightsThresholds.length > 0) {
        const quantities = tokenData.rightsThresholds.map(t => t.quantity);
        const rightsTypes = tokenData.rightsThresholds.map(t => t.rightsType);
        
        const rightsTx = await this.tokenContract.setRightsThresholds(
          tokenId,
          quantities,
          rightsTypes
        );
        
        await rightsTx.wait();
      }

      return {
        tokenId: tokenId.toString(),
        contractAddress: this.contractAddress,
        owner: creatorAddress,
        totalSupply: tokenData.totalSupply,
        transactionHash: receipt.transactionHash,
        tokenURI
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw createError(`Failed to create token: ${error.message}`, 500);
    }
  }

  /**
   * Get token details by ID
   * @param tokenId Token ID
   */
  async getTokenById(tokenId: string) {
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
        rightsThresholds: rightsThresholds.map((threshold) => ({
          quantity: threshold.quantity.toString(),
          rightsType: threshold.rightsType,
          enabled: threshold.enabled
        })),
        royaltyRecipient: royaltyInfo[0],
        royaltyPercentage: (royaltyInfo[1].toNumber() / 100)
      };
    } catch (error) {
      console.error('Error getting token details:', error);
      throw createError(`Failed to get token details: ${error.message}`, 500);
    }
  }

  /**
   * Verify if a wallet has specific rights for a token
   * @param tokenId Token ID
   * @param walletAddress Wallet address to check
   * @param rightsType Rights type to check for
   */
  async verifyTokenRights(tokenId: string, walletAddress: string, rightsType: number) {
    try {
      const hasRights = await this.tokenContract.hasRights(walletAddress, tokenId, rightsType);
      return hasRights;
    } catch (error) {
      console.error('Error verifying token rights:', error);
      throw createError(`Failed to verify token rights: ${error.message}`, 500);
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
    } catch (error) {
      console.error('Error getting tokens by owner:', error);
      throw createError(`Failed to get tokens by owner: ${error.message}`, 500);
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
  async listToken(tokenId: string, sellerAddress: string, quantity: number, price: number, currency: string = 'MATIC') {
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
    } catch (error) {
      console.error('Error listing token:', error);
      throw createError(`Failed to list token: ${error.message}`, 500);
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