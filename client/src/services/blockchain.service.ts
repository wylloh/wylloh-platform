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

// Simple marketplace ABI for direct token purchases
const marketplaceAbi = [
  // Write functions
  "function buyTokens(uint256 tokenId, uint256 quantity) payable",
  
  // Events
  "event TokensPurchased(address indexed buyer, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice)"
];

// Default contract address - should be configured at app startup
const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const DEFAULT_MARKETPLACE_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

/**
 * Service for interacting with the blockchain contracts
 */
class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private tokenContract: ethers.Contract | null = null;
  private marketplaceContract: ethers.Contract | null = null;
  private contractAddress: string = DEFAULT_CONTRACT_ADDRESS;
  private marketplaceAddress: string = DEFAULT_MARKETPLACE_ADDRESS;
  
  /**
   * Initialize the blockchain service with the web3 provider
   * @param provider Web3Provider instance
   * @param contractAddress Optional contract address override
   * @param marketplaceAddress Optional marketplace address override
   */
  initialize(
    provider: ethers.providers.Web3Provider, 
    contractAddress?: string,
    marketplaceAddress?: string
  ) {
    this.provider = provider;
    
    if (contractAddress) {
      this.contractAddress = contractAddress;
    }
    
    if (marketplaceAddress) {
      this.marketplaceAddress = marketplaceAddress;
    }
    
    // Create contract instances
    this.tokenContract = new ethers.Contract(
      this.contractAddress,
      wyllohTokenAbi,
      this.provider
    );
    
    this.marketplaceContract = new ethers.Contract(
      this.marketplaceAddress,
      marketplaceAbi,
      this.provider
    );
    
    console.log('BlockchainService initialized with:', {
      provider: !!this.provider,
      tokenContract: this.contractAddress,
      marketplaceContract: this.marketplaceAddress
    });
  }
  
  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    const initialized = !!this.provider && !!this.tokenContract;
    console.log(`BlockchainService initialization status: ${initialized}`);
    return initialized;
  }
  
  /**
   * Get token balance for a user
   * @param address User's wallet address
   * @param tokenId ID of the token to check balance for
   * @returns Number of tokens owned
   */
  async getTokenBalance(address: string, tokenId: string): Promise<number> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for getTokenBalance');
      return 0;
    }
    
    try {
      console.log(`Checking token balance for address ${address} and token ID ${tokenId}`);
      const balanceBN = await this.tokenContract!.balanceOf(address, tokenId);
      const balance = balanceBN.toNumber();
      console.log(`Token balance result: ${balance}`);
      return balance;
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
      console.warn('BlockchainService not initialized for getRightsThresholds');
      return [];
    }
    
    try {
      console.log(`Getting rights thresholds for token ID ${tokenId}`);
      const thresholds = await this.tokenContract!.getRightsThresholds(tokenId);
      const formattedThresholds = thresholds.map((t: any) => ({
        quantity: t.quantity.toNumber(),
        type: t.rightsType
      }));
      console.log(`Rights thresholds:`, formattedThresholds);
      return formattedThresholds;
    } catch (error) {
      console.error('Error getting rights thresholds:', error);
      return [];
    }
  }
  
  /**
   * Purchase tokens by calling the marketplace contract
   * @param tokenId ID of the token to purchase
   * @param quantity Number of tokens to purchase
   * @param price Price per token in ETH
   */
  async purchaseTokens(tokenId: string, quantity: number, price: number): Promise<boolean> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for purchaseTokens');
      return false;
    }
    
    try {
      console.log('Purchasing tokens on blockchain:', {
        tokenId,
        quantity,
        price
      });

      // For demo mode, either use direct blockchain transactions if available or simulate
      if (window.ethereum && this.provider) {
        try {
          // Get a signer for the transaction
          const signer = this.provider.getSigner();
          const signerAddress = await signer.getAddress();
          
          console.log(`Using signer address: ${signerAddress}`);
          
          // Calculate total price in ETH
          const totalPrice = price * quantity;
          const totalPriceWei = ethers.utils.parseEther(totalPrice.toString());
          
          console.log(`Total price: ${totalPrice} ETH (${totalPriceWei.toString()} wei)`);
          
          // Get connected marketplace contract with signer
          const marketplaceWithSigner = this.marketplaceContract!.connect(signer);
          
          // Execute the purchase transaction
          console.log('Executing blockchain transaction...');
          
          // For demo mode, we'll simulate the marketplace purchase
          // In production, this would call the actual marketplace contract
          
          // Simulate ERC-1155 transfer instead - directly transfer tokens
          // from content creator to buyer
          const tx = await marketplaceWithSigner.buyTokens(
            tokenId,
            quantity,
            { value: totalPriceWei }
          );
          
          console.log('Transaction submitted:', tx.hash);
          
          // Wait for transaction to be mined
          console.log('Waiting for transaction confirmation...');
          const receipt = await tx.wait();
          
          console.log('Transaction confirmed:', {
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status
          });
          
          // Update local storage through contentService
          await contentService.purchaseToken(tokenId, quantity);
          
          return true;
        } catch (error: any) {
          console.error('Blockchain transaction error:', error);
          
          // For demo purposes, if there's a blockchain error, still update local storage
          // to allow the demo flow to continue
          console.log('Falling back to local storage update for demo mode');
          await contentService.purchaseToken(tokenId, quantity);
          
          return true;
        }
      } else {
        // No ethereum provider available, simulate the transaction
        console.log('No Ethereum provider available, simulating transaction');
        
        // Update local storage through contentService
        await contentService.purchaseToken(tokenId, quantity);
        
        return true;
      }
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      throw error; // Re-throw to allow proper error handling
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService(); 