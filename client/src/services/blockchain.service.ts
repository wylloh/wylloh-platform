import { ethers } from 'ethers';
import { GANACHE_ID } from '../constants/blockchain';
import { contentService } from './content.service';

// Complete ABI for the WyllohToken contract (with all necessary functions for tokenization & transfers)
const wyllohTokenAbi = [
  // Read functions
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function getRightsThresholds(uint256 tokenId) view returns (tuple(uint256 quantity, string rightsType)[])",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  
  // Write functions
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function mint(address to, uint256 id, uint256 amount, bytes data)",
  "function createToken(address initialOwner, uint256 initialSupply, string memory contentURI, uint96 royaltyPercentage)",
  "function setRightsThresholds(uint256 tokenId, tuple(uint256 quantity, string rightsType)[] thresholds)",
  
  // Events
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
  "event TokenCreated(uint256 indexed tokenId, address indexed creator, uint256 initialSupply)"
];

// Marketplace ABI for direct token purchases
const marketplaceAbi = [
  // Write functions
  "function buyTokens(uint256 tokenId, uint256 quantity) payable",
  "function listTokens(uint256 tokenId, uint256 quantity, uint256 price)",
  "function setTokenPrice(uint256 tokenId, uint256 newPrice)",
  
  // Events
  "event TokensPurchased(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice)",
  "event TokensListed(address indexed seller, uint256 indexed tokenId, uint256 quantity, uint256 price)"
];

// Default contract addresses - should be configured at app startup
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
   * Create a new token for content
   * @param contentId Content ID to create token for
   * @param initialSupply Initial token supply
   * @param tokenMetadata Metadata for the token
   * @param royaltyPercentage Royalty percentage for secondary sales
   * @returns Transaction hash
   */
  async createToken(
    contentId: string, 
    initialSupply: number, 
    tokenMetadata: any,
    royaltyPercentage: number
  ): Promise<string> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for createToken');
      throw new Error('Blockchain service not initialized');
    }
    
    try {
      console.log('Creating token on blockchain:', {
        contentId,
        initialSupply,
        metadata: tokenMetadata,
        royaltyPercentage
      });
      
      // Get signer
      const signer = this.provider!.getSigner();
      const signerAddress = await signer.getAddress();
      console.log(`Creating token as ${signerAddress}`);
      
      // Connect with signer
      const tokenContractWithSigner = this.tokenContract!.connect(signer);
      
      // Create content URI (simplified version for demo)
      const contentURI = `ipfs://${contentId}`;
      
      // Create token
      const tx = await tokenContractWithSigner.createToken(
        signerAddress,
        initialSupply,
        contentURI,
        royaltyPercentage * 100 // Convert percentage to basis points (100 = 1%)
      );
      
      console.log('Token creation transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('Token creation confirmed in block:', receipt.blockNumber);
      
      // Set rights thresholds if provided
      if (tokenMetadata.rightsThresholds && tokenMetadata.rightsThresholds.length > 0) {
        // Format thresholds for contract
        const formattedThresholds = tokenMetadata.rightsThresholds.map((t: any) => [
          t.quantity,
          t.type
        ]);
        
        console.log('Setting rights thresholds:', formattedThresholds);
        
        // In a real implementation, we would get the tokenId from the TokenCreated event
        // For demo, use the contentId as tokenId (this is simplified)
        const tokenId = contentId;
        
        const thresholdsTx = await tokenContractWithSigner.setRightsThresholds(
          tokenId,
          formattedThresholds
        );
        
        console.log('Rights thresholds transaction submitted:', thresholdsTx.hash);
        const thresholdsReceipt = await thresholdsTx.wait();
        console.log('Rights thresholds confirmed in block:', thresholdsReceipt.blockNumber);
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
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
          
          // For demo, we'll use a direct transfer if marketplace isn't fully set up
          try {
            // Try marketplace purchase first
            const tx = await marketplaceWithSigner.buyTokens(
              tokenId,
              quantity,
              { value: totalPriceWei }
            );
            
            console.log('Purchase transaction submitted:', tx.hash);
            const receipt = await tx.wait();
            console.log('Purchase confirmed in block:', receipt.blockNumber);
          } catch (marketplaceError) {
            console.warn('Marketplace transaction failed, falling back to direct transfer:', marketplaceError);
            
            // Fallback to direct token transfer - this is just for demo
            // Get token contract with signer
            const tokenWithSigner = this.tokenContract!.connect(signer);
            
            // We need the creator's address - in a real scenario this would come from the marketplace
            // For demo, we'll use the first account as the creator
            const accounts = await this.provider.listAccounts();
            const creatorAddress = accounts[0]; // Creator is usually the first account in Ganache
            
            // First set approval if needed
            const isApproved = await this.tokenContract!.isApprovedForAll(creatorAddress, this.marketplaceAddress);
            if (!isApproved) {
              console.log('Setting approval for marketplace...');
              const approveTx = await tokenWithSigner.setApprovalForAll(this.marketplaceAddress, true);
              await approveTx.wait();
            }
            
            // Send payment to creator
            console.log(`Sending payment of ${totalPrice} ETH to creator ${creatorAddress}`);
            const paymentTx = await signer.sendTransaction({
              to: creatorAddress,
              value: totalPriceWei
            });
            await paymentTx.wait();
            
            // Transfer tokens
            console.log(`Transferring ${quantity} tokens of ID ${tokenId} from ${creatorAddress} to ${signerAddress}`);
            const transferTx = await tokenWithSigner.safeTransferFrom(
              creatorAddress,
              signerAddress,
              tokenId,
              quantity,
              "0x" // No data
            );
            
            const transferReceipt = await transferTx.wait();
            console.log('Transfer confirmed in block:', transferReceipt.blockNumber);
          }
          
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