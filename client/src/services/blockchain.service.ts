import { ethers } from 'ethers';
import { GANACHE_ID } from '../constants/blockchain';
import { contentService } from './content.service';

// ABI for the WyllohToken contract (simplified version with only the functions we need)
const wyllohTokenAbi = [
  // Read functions
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function getRightsThresholds(uint256 tokenId) view returns (tuple(uint256 quantity, string rightsType)[])",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  
  // Write functions
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  
  // Events
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)"
];

// Default contract address - should be configured at app startup
const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

/**
 * Service for interacting with the blockchain contracts
 */
class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private tokenContract: ethers.Contract | null = null;
  private contractAddress: string = DEFAULT_CONTRACT_ADDRESS;
  
  /**
   * Initialize the blockchain service with the web3 provider
   * @param provider Web3Provider instance
   * @param contractAddress Optional contract address override
   */
  initialize(provider: ethers.providers.Web3Provider, contractAddress?: string) {
    this.provider = provider;
    
    if (contractAddress) {
      this.contractAddress = contractAddress;
    }
    
    // Create contract instance
    this.tokenContract = new ethers.Contract(
      this.contractAddress,
      wyllohTokenAbi,
      this.provider
    );
    
    console.log('BlockchainService initialized with contract:', this.contractAddress);
  }
  
  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return !!this.provider && !!this.tokenContract;
  }
  
  /**
   * Get token balance for a user
   * @param address User's wallet address
   * @param tokenId ID of the token to check balance for
   * @returns Number of tokens owned
   */
  async getTokenBalance(address: string, tokenId: string): Promise<number> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized');
      return 0;
    }
    
    try {
      const balanceBN = await this.tokenContract!.balanceOf(address, tokenId);
      return balanceBN.toNumber();
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }
  
  /**
   * Get rights thresholds for a token
   * @param tokenId ID of the token to get rights thresholds for
   * @returns Array of rights thresholds
   */
  async getRightsThresholds(tokenId: string): Promise<{quantity: number, type: string}[]> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized');
      return [];
    }
    
    try {
      const thresholds = await this.tokenContract!.getRightsThresholds(tokenId);
      return thresholds.map((t: any) => ({
        quantity: t.quantity.toNumber(),
        type: t.rightsType
      }));
    } catch (error) {
      console.error('Error getting rights thresholds:', error);
      return [];
    }
  }
  
  /**
   * Purchase tokens by calling the marketplace contract
   * This is a simplified version that would need to be expanded for production
   * @param tokenId ID of the token to purchase
   * @param quantity Number of tokens to purchase
   * @param price Price per token in ETH
   */
  async purchaseTokens(tokenId: string, quantity: number, price: number): Promise<boolean> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized');
      return false;
    }
    
    try {
      // In a real implementation, this would call the marketplace contract's buy function
      // For now, we'll simulate a successful purchase
      console.log('Simulating token purchase on blockchain:', {
        tokenId,
        quantity,
        price
      });

      // Update local storage through contentService
      await contentService.purchaseToken(tokenId, quantity);
      
      // Mock success for demo
      return true;
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      throw error; // Re-throw to allow proper error handling
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService(); 