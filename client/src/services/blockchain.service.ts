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
          
          // Get all available accounts for demo
          const accounts = await this.provider.listAccounts();
          
          // For demo purposes, we'll use the first account as the creator/seller
          // In a real application, this would come from the content metadata
          const creatorAddress = accounts[0];
          console.log(`Using creator address: ${creatorAddress}`);
          
          // Skip the marketplace contract for demo and do a direct transfer instead
          // This simplifies the flow and ensures the transaction works correctly
          console.log('Using direct token transfer for demo');
          
          // 1. First, send payment to creator
          console.log(`Sending payment of ${totalPrice} ETH to creator ${creatorAddress}`);
          const paymentTx = await signer.sendTransaction({
            to: creatorAddress,
            value: totalPriceWei
          });
          
          console.log('Payment transaction submitted:', paymentTx.hash);
          const paymentReceipt = await paymentTx.wait();
          console.log('Payment confirmed in block:', paymentReceipt.blockNumber);
          
          // 2. Connect to token contract with creator's signer
          // For demo, we'll impersonate the creator by using their account directly
          // In a real application, this would be done via the marketplace contract
          const creatorProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
          const creatorSigner = creatorProvider.getSigner(creatorAddress);
          
          // Connect token contract with creator's signer
          const tokenWithCreatorSigner = this.tokenContract!.connect(creatorSigner);
          
          // 3. Transfer tokens from creator to buyer
          console.log(`Transferring ${quantity} tokens of ID ${tokenId} from ${creatorAddress} to ${signerAddress}`);
          
          // Use safeTransferFrom to send tokens
          const transferTx = await tokenWithCreatorSigner.safeTransferFrom(
            creatorAddress,
            signerAddress,
            tokenId,
            quantity,
            "0x" // No data
          );
          
          console.log('Transfer transaction submitted:', transferTx.hash);
          const transferReceipt = await transferTx.wait();
          console.log('Transfer confirmed in block:', transferReceipt.blockNumber);
          
          // 4. Update local storage through contentService
          await contentService.purchaseToken(tokenId, quantity);
          
          return true;
        } catch (error: any) {
          console.error('Blockchain transaction error:', error);
          
          if (error.message && error.message.includes('cannot estimate gas')) {
            console.log('Gas estimation failed, falling back to mint operation');
            
            try {
              // Alternative approach: mint new tokens directly to buyer
              // This is a simplified approach for the demo
              const signer = this.provider.getSigner();
              const signerAddress = await signer.getAddress();
              
              // For demo, connect to token contract with first account (creator/admin)
              const creatorProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
              const creatorAddress = (await creatorProvider.listAccounts())[0];
              const creatorSigner = creatorProvider.getSigner(creatorAddress);
              
              // Connect token contract with creator's signer
              const tokenWithCreatorSigner = this.tokenContract!.connect(creatorSigner);
              
              // Mint tokens directly to buyer
              console.log(`Minting ${quantity} tokens of ID ${tokenId} to ${signerAddress}`);
              const mintTx = await tokenWithCreatorSigner.mint(
                signerAddress,
                tokenId,
                quantity,
                "0x" // No data
              );
              
              console.log('Mint transaction submitted:', mintTx.hash);
              const mintReceipt = await mintTx.wait();
              console.log('Mint confirmed in block:', mintReceipt.blockNumber);
              
              // Update local storage
              await contentService.purchaseToken(tokenId, quantity);
              return true;
            } catch (mintError) {
              console.error('Mint operation failed:', mintError);
            }
          }
          
          // For demo purposes, still update local storage to allow demo flow to continue
          console.log('All blockchain operations failed, falling back to local storage update for demo');
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