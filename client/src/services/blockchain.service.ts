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
    
    // Use provided contract address if given
    if (contractAddress) {
      console.log(`BlockchainService: Using provided contract address: ${contractAddress}`);
      this.contractAddress = contractAddress;
    } else {
      // Try to get contract address from environment variables
      const envContractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || 
                                (window as any).env?.REACT_APP_CONTRACT_ADDRESS;
      if (envContractAddress) {
        console.log(`BlockchainService: Using environment contract address: ${envContractAddress}`);
        this.contractAddress = envContractAddress;
      } else {
        console.log(`BlockchainService: Using default contract address: ${DEFAULT_CONTRACT_ADDRESS}`);
      }
    }
    
    // Use provided marketplace address if given
    if (marketplaceAddress) {
      console.log(`BlockchainService: Using provided marketplace address: ${marketplaceAddress}`);
      this.marketplaceAddress = marketplaceAddress;
    } else {
      // Try to get marketplace address from environment variables
      const envMarketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS || 
                                   (window as any).env?.REACT_APP_MARKETPLACE_ADDRESS;
      if (envMarketplaceAddress) {
        console.log(`BlockchainService: Using environment marketplace address: ${envMarketplaceAddress}`);
        this.marketplaceAddress = envMarketplaceAddress;
      } else {
        console.log(`BlockchainService: Using default marketplace address: ${DEFAULT_MARKETPLACE_ADDRESS}`);
      }
    }
    
    try {
      // Verify that the contract address is valid
      if (!ethers.utils.isAddress(this.contractAddress)) {
        console.error(`BlockchainService: Invalid contract address: ${this.contractAddress}`);
        throw new Error(`Invalid contract address: ${this.contractAddress}`);
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
      
      // Try to verify the contract exists at this address
      this.provider!.getCode(this.contractAddress).then(code => {
        if (code === '0x') {
          console.warn(`No contract found at address ${this.contractAddress}. Contract calls will fail.`);
        } else {
          console.log(`Contract verified at address ${this.contractAddress}`);
        }
      }).catch(error => {
        console.error('Error checking contract code:', error);
      });
      
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      throw new Error(`Failed to initialize blockchain service: ${error}`);
    }
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
        royaltyPercentage,
        contractAddress: this.contractAddress
      });
      
      // Validate contract address
      if (!ethers.utils.isAddress(this.contractAddress)) {
        console.error(`Invalid contract address: ${this.contractAddress}`);
        throw new Error(`Invalid contract address: ${this.contractAddress}`);
      }
      
      // Check if contract exists
      const code = await this.provider!.getCode(this.contractAddress);
      if (code === '0x') {
        console.error(`No contract found at address ${this.contractAddress}`);
        throw new Error(`No contract found at address ${this.contractAddress}. Make sure the contract is deployed.`);
      }
      
      // Get signer
      const signer = this.provider!.getSigner();
      const signerAddress = await signer.getAddress();
      console.log(`Creating token as ${signerAddress}`);
      
      // Connect with signer
      const tokenContractWithSigner = this.tokenContract!.connect(signer);
      
      // Create content URI (simplified version for demo)
      const contentURI = `ipfs://${contentId}`;
      
      console.log(`Calling createToken with parameters:`, {
        signerAddress,
        initialSupply,
        contentURI,
        royaltyBasisPoints: royaltyPercentage * 100
      });
      
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
      
      // Verify that creator received the tokens
      const creatorBalance = await this.getTokenBalance(signerAddress, contentId);
      console.log(`Creator's token balance after creation: ${creatorBalance}`);
      
      if (creatorBalance === 0) {
        console.error('Token creation succeeded but creator has 0 balance');
        throw new Error('Token creation succeeded but creator has 0 balance. This may cause issues with token transfers.');
      }
      
      if (creatorBalance < initialSupply) {
        console.warn(`Creator only received ${creatorBalance} tokens out of ${initialSupply} requested`);
      }
      
      // Set rights thresholds if provided
      if (tokenMetadata.rightsThresholds && tokenMetadata.rightsThresholds.length > 0) {
        console.log('Setting rights thresholds...');
        
        // TokenId is content ID for demo simplicity
        const tokenId = contentId;
        
        // Format rights thresholds for contract
        const thresholds = tokenMetadata.rightsThresholds.map((t: any) => {
          return {
            quantity: t.quantity,
            rightsType: t.type
          };
        });
        
        // Call setRightsThresholds function
        const thresholdsTx = await tokenContractWithSigner.setRightsThresholds(
          tokenId,
          thresholds
        );
        
        console.log('Rights thresholds transaction submitted:', thresholdsTx.hash);
        await thresholdsTx.wait();
        console.log('Rights thresholds set successfully');
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
   * @param price Price per token in ETH (NOT total price)
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
        pricePerToken: price
      });

      // For demo mode, either use direct blockchain transactions if available or simulate
      if (window.ethereum && this.provider) {
        try {
          // Get a signer for the transaction
          const signer = this.provider.getSigner();
          const signerAddress = await signer.getAddress();
          
          console.log(`Using buyer address: ${signerAddress}`);
          
          // Calculate total price in ETH - THIS IS PER TOKEN PRICE * QUANTITY
          const totalPrice = price * quantity;
          console.log(`Calculating total price: ${price} ETH per token × ${quantity} tokens = ${totalPrice} ETH total`);
          const totalPriceWei = ethers.utils.parseEther(totalPrice.toString());
          
          console.log(`Total price: ${totalPrice} ETH (${totalPriceWei.toString()} wei)`);
          
          // Get content details to find the creator's address
          const content = await contentService.getContentById(tokenId);
          if (!content) {
            throw new Error(`Content with ID ${tokenId} not found`);
          }
          
          // Get the creator address from content
          const creatorAddress = content.creatorAddress;
          
          // If creatorAddress is empty or invalid, fall back to the first Ganache account
          const isValidAddress = creatorAddress && ethers.utils.isAddress(creatorAddress);
          let sellerAddress = isValidAddress ? creatorAddress : null;
          
          if (!sellerAddress) {
            // Fall back to first account as creator for demo
            const accounts = await this.provider.listAccounts();
            sellerAddress = accounts[0];
          }
          
          console.log(`Using creator/seller address: ${sellerAddress}`);
          
          // Check if seller has enough tokens to transfer
          const sellerBalance = await this.getTokenBalance(sellerAddress, tokenId);
          console.log(`Seller token balance: ${sellerBalance} tokens`);
          
          if (sellerBalance < quantity) {
            console.error(`Seller doesn't have enough tokens: has ${sellerBalance}, needs ${quantity}`);
            throw new Error(`Creator doesn't have enough tokens available for this purchase (has ${sellerBalance}, needs ${quantity})`);
          }
          
          // Verify that buyer is not the same as seller (important!)
          if (signerAddress.toLowerCase() === sellerAddress.toLowerCase()) {
            console.error('Buyer and seller addresses are the same, aborting purchase');
            throw new Error('Cannot purchase from yourself');
          }
          
          // Check if user has enough balance before proceeding
          const buyerBalance = await this.provider.getBalance(signerAddress);
          console.log(`Buyer balance: ${ethers.utils.formatEther(buyerBalance)} ETH`);
          
          if (buyerBalance.lt(totalPriceWei)) {
            console.error(`Insufficient funds: ${ethers.utils.formatEther(buyerBalance)} ETH available, ${totalPrice} ETH required`);
            throw new Error(`Insufficient funds: ${ethers.utils.formatEther(buyerBalance)} ETH available, ${totalPrice} ETH required`);
          }
          
          // 1. First, send payment to creator
          console.log(`Sending payment of ${totalPrice} ETH from ${signerAddress} to creator ${sellerAddress}`);
          const paymentTx = await signer.sendTransaction({
            to: sellerAddress,
            value: totalPriceWei
          });
          
          console.log('Payment transaction submitted:', paymentTx.hash);
          const paymentReceipt = await paymentTx.wait();
          console.log('Payment confirmed in block:', paymentReceipt.blockNumber);
          
          // 2. Connect to token contract with creator's signer
          // For demo, we'll impersonate the creator by using their account directly
          const creatorProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
          
          // Print details about the contract we're connecting to
          console.log(`Token contract address: ${this.contractAddress}`);
          
          // Check if contract exists at this address
          const code = await creatorProvider.getCode(this.contractAddress);
          if (code === '0x') {
            console.error(`No contract found at address ${this.contractAddress}`);
            // Mark that payment was sent but token transfer failed
            const paymentSentError = new Error(`No contract found at address ${this.contractAddress}`);
            (paymentSentError as any).paymentSent = true;
            throw paymentSentError;
          }
          
          try {
            const creatorSigner = creatorProvider.getSigner(sellerAddress);
            
            // Connect token contract with creator's signer
            const tokenWithCreatorSigner = this.tokenContract!.connect(creatorSigner);
            
            // 3. Transfer tokens from creator to buyer
            console.log(`Transferring ${quantity} tokens of ID ${tokenId} from ${sellerAddress} to ${signerAddress}`);
            
            // Use safeTransferFrom to send tokens
            const transferTx = await tokenWithCreatorSigner.safeTransferFrom(
              sellerAddress,
              signerAddress,
              tokenId,
              quantity,
              "0x" // No data
            );
            
            console.log('Transfer transaction submitted:', transferTx.hash);
            const transferReceipt = await transferTx.wait();
            console.log('Transfer confirmed in block:', transferReceipt.blockNumber);
          } catch (transferError) {
            console.error('Error transferring tokens after payment was sent:', transferError);
            // Mark that payment was sent but token transfer failed
            const paymentSentError = new Error('Payment was sent but token transfer failed');
            (paymentSentError as any).paymentSent = true;
            (paymentSentError as any).originalError = transferError;
            throw paymentSentError;
          }
          
          // 4. Update local storage through contentService
          await contentService.purchaseToken(tokenId, quantity);
          
          return true;
        } catch (error: any) {
          console.error('Blockchain transaction error:', error);
          
          // Check if payment was sent but token transfer failed
          if (error.paymentSent) {
            console.error('Payment was sent but token transfer failed');
            throw new Error('Payment was sent but token transfer failed');
          }
          
          // Check for specific errors
          if (error.message && error.message.includes('insufficient funds')) {
            // Don't record purchase if there are insufficient funds
            console.error('Purchase failed due to insufficient funds');
            throw new Error('Insufficient funds to complete purchase');
          }
          
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
              // Propagate error to prevent local storage update
              throw mintError;
            }
          }
          
          // Re-throw the error to prevent local storage update for failed transactions
          throw error;
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