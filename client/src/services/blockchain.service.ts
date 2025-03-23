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
  private provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | null = null;
  private tokenContract: ethers.Contract | null = null;
  private marketplaceContract: ethers.Contract | null = null;
  private contractAddress: string = DEFAULT_CONTRACT_ADDRESS;
  private marketplaceAddress: string = DEFAULT_MARKETPLACE_ADDRESS;
  private _initialized: boolean = false;
  
  /**
   * Initialize blockchain service with a provider
   */
  initialize(): void {
    try {
      console.log('Initializing blockchain service...');

      // Check if window.ethereum exists
      if (window.ethereum) {
        console.log('MetaMask detected, connecting to provider...');
        this.provider = new ethers.providers.Web3Provider(window.ethereum as any);
        
        // Get contract address from environment variables or fallback to default
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;
        const marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
        
        console.log(`Using token contract address: ${contractAddress}`);
        console.log(`Using marketplace address: ${marketplaceAddress || 'Not configured'}`);
        
        this.contractAddress = contractAddress;
        this.marketplaceAddress = marketplaceAddress || '';
        
        // Connect to token contract
        if (this.contractAddress) {
          console.log('Connecting to token contract...');
          this.tokenContract = new ethers.Contract(
            this.contractAddress,
            wyllohTokenAbi,
            this.provider
          );
          console.log('Token contract connected successfully');
        } else {
          console.error('Token contract address not configured');
        }
        
        // Connect to marketplace contract if address is provided
        if (this.marketplaceAddress) {
          console.log('Connecting to marketplace contract...');
          this.marketplaceContract = new ethers.Contract(
            this.marketplaceAddress,
            marketplaceAbi,
            this.provider
          );
          console.log('Marketplace contract connected successfully');
        } else {
          console.log('Marketplace contract not configured');
        }
        
        // Check if contracts exist on the blockchain
        this.checkContractExistence();
        
        // Listen for chain and account changes
        this.listenForAccountChanges();
        
        this._initialized = true;
        console.log('Blockchain service initialized successfully');
      } else {
        console.log('No Ethereum provider detected, running in demo mode');
        
        // Initialize provider with fallback RPC URL
        const rpcUrl = process.env.REACT_APP_WEB3_PROVIDER || 'http://localhost:8545';
        console.log(`Using fallback RPC URL: ${rpcUrl}`);
        
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Get contract address from environment variables or fallback to default
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;
        const marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
        
        console.log(`Using token contract address: ${contractAddress}`);
        console.log(`Using marketplace address: ${marketplaceAddress || 'Not configured'}`);
        
        this.contractAddress = contractAddress;
        this.marketplaceAddress = marketplaceAddress || '';
        
        // Connect to token contract
        if (this.contractAddress && this.provider) {
          console.log('Connecting to token contract...');
          this.tokenContract = new ethers.Contract(
            this.contractAddress,
            wyllohTokenAbi,
            this.provider
          );
          console.log('Token contract connected successfully');
        } else {
          console.error('Token contract address not configured');
        }
        
        // Connect to marketplace contract if address is provided
        if (this.marketplaceAddress && this.provider) {
          console.log('Connecting to marketplace contract...');
          this.marketplaceContract = new ethers.Contract(
            this.marketplaceAddress,
            marketplaceAbi,
            this.provider
          );
          console.log('Marketplace contract connected successfully');
        } else {
          console.log('Marketplace contract not configured');
        }
        
        // Check if contracts exist on the blockchain
        this.checkContractExistence();
        
        this._initialized = true;
        console.log('Blockchain service initialized in demo mode');
      }
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      this._initialized = false;
    }
  }

  /**
   * Listen for account changes in MetaMask
   */
  private listenForAccountChanges(): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('Account changed:', accounts[0]);
        // Refresh provider with new account
        this.provider = new ethers.providers.Web3Provider(window.ethereum as any);
      });

      window.ethereum.on('chainChanged', (_chainId: string) => {
        console.log('Network changed, reloading...');
        window.location.reload();
      });
    }
  }

  /**
   * Check if contracts exist on the blockchain
   */
  async checkContractExistence(): Promise<void> {
    if (!this.provider) {
      console.error('Provider not initialized');
      return;
    }
    
    try {
      // Check token contract
      if (this.contractAddress) {
        console.log(`Checking if token contract exists at ${this.contractAddress}...`);
        const tokenCode = await this.provider.getCode(this.contractAddress);
        if (tokenCode === '0x') {
          console.error(`⚠️ No contract found at token address: ${this.contractAddress}`);
        } else {
          console.log(`✅ Token contract verified at ${this.contractAddress}`);
        }
      }
      
      // Check marketplace contract
      if (this.marketplaceAddress) {
        console.log(`Checking if marketplace contract exists at ${this.marketplaceAddress}...`);
        const marketplaceCode = await this.provider.getCode(this.marketplaceAddress);
        if (marketplaceCode === '0x') {
          console.error(`⚠️ No contract found at marketplace address: ${this.marketplaceAddress}`);
        } else {
          console.log(`✅ Marketplace contract verified at ${this.marketplaceAddress}`);
        }
      }
    } catch (error) {
      console.error('Error checking contract existence:', error);
    }
  }
  
  /**
   * Verify contracts exist and have expected interfaces
   * @returns Promise resolving to true if contracts are verified
   */
  async verifyContracts(): Promise<boolean> {
    if (!this.provider) {
      console.error('Provider not initialized for contract verification');
      return false;
    }
    
    try {
      // Check token contract
      const tokenCode = await this.provider.getCode(this.contractAddress);
      if (tokenCode === '0x') {
        console.error(`No contract found at token address ${this.contractAddress}`);
        return false;
      }
      
      // Try to call a read function to verify ABI matches
      try {
        // Call a simple view function
        const adminRole = await this.tokenContract!.ADMIN_ROLE();
        console.log('Token contract verified with ADMIN_ROLE:', adminRole);
      } catch (err) {
        console.error('Token contract exists but interface doesn\'t match expected ABI:', err);
        return false;
      }
      
      // Check marketplace contract
      const marketplaceCode = await this.provider.getCode(this.marketplaceAddress);
      if (marketplaceCode === '0x') {
        console.error(`No contract found at marketplace address ${this.marketplaceAddress}`);
        return false;
      }
      
      console.log('Contracts verified successfully');
      return true;
    } catch (err) {
      console.error('Error verifying contracts:', err);
      return false;
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
      
      // Print contract ABI for debugging
      console.log('Using Token ABI:', wyllohTokenAbi);
      
      // Ensure we're using Web3Provider for MetaMask interaction
      let web3Provider: ethers.providers.Web3Provider;
      
      // Force the use of MetaMask provider if available to ensure popup appears
      if (window.ethereum) {
        console.log('Using MetaMask provider for token creation to ensure popup appears');
        
        try {
          // Request account access explicitly - this should trigger the MetaMask popup
          console.log('Requesting MetaMask account access...');
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log('MetaMask accounts:', accounts);
          
          if (!accounts || accounts.length === 0) {
            throw new Error('MetaMask access denied or no accounts available');
          }
          
          // Create fresh Web3Provider
          web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          console.log('MetaMask Web3Provider created successfully');
        } catch (metamaskError) {
          console.error('Error requesting MetaMask account access:', metamaskError);
          
          // Provide more helpful error message
          if (metamaskError instanceof Error) {
            if (metamaskError.message.includes('denied') || metamaskError.message.includes('rejected')) {
              throw new Error('MetaMask access denied. Please approve the connection request in MetaMask.');
            } else if (metamaskError.message.includes('chain ID')) {
              throw new Error('Please connect MetaMask to the correct network (Ganache/localhost:8545).');
            }
          }
          throw metamaskError;
        }
      } else if (this.provider instanceof ethers.providers.Web3Provider) {
        web3Provider = this.provider as ethers.providers.Web3Provider;
      } else {
        console.error('MetaMask provider not available for token creation');
        throw new Error('MetaMask not available. Please install MetaMask to create tokens.');
      }
      
      // Get signer from Web3Provider
      const signer = web3Provider.getSigner();
      let signerAddress;
      
      try {
        signerAddress = await signer.getAddress();
        console.log(`Creating token as ${signerAddress}`);
      } catch (signerError) {
        console.error('Error getting signer address:', signerError);
        throw new Error('Error accessing your wallet. Please make sure MetaMask is unlocked and connected.');
      }
      
      // Connect with signer
      const tokenContractWithSigner = new ethers.Contract(
        this.contractAddress,
        wyllohTokenAbi,
        signer
      );
      
      // Create content URI (simplified version for demo)
      const contentURI = `ipfs://${contentId}`;
      
      console.log(`Calling createToken with parameters:`, {
        signerAddress,
        initialSupply,
        contentURI,
        royaltyBasisPoints: royaltyPercentage * 100
      });
      
      // Check network connection before attempting transaction
      try {
        const network = await web3Provider.getNetwork();
        console.log('Current network:', network);
        
        // Check if we're on a supported network (chainId 1337 is typically Ganache)
        const expectedChainId = parseInt(process.env.REACT_APP_CHAIN_ID || '1337');
        if (network.chainId !== expectedChainId) {
          console.warn(`You're on network with chainId ${network.chainId}, but expected ${expectedChainId} (Ganache). Please switch networks in MetaMask.`);
          throw new Error(`Please connect MetaMask to the correct network. Expected chainId: ${expectedChainId} (Ganache/localhost), current: ${network.chainId}`);
        }
      } catch (networkError) {
        console.error('Error checking network:', networkError);
        throw new Error('Error connecting to blockchain network. Please check your connection.');
      }
      
      // Display debugging info about Ganache accounts
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true') {
        try {
          const jsonRpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
          const accounts = await jsonRpcProvider.listAccounts();
          console.log('Available Ganache accounts:', accounts);
          
          // Check balances
          for (const account of accounts.slice(0, 2)) {
            const balance = await jsonRpcProvider.getBalance(account);
            console.log(`Account ${account} has ${ethers.utils.formatEther(balance)} ETH`);
          }
        } catch (e) {
          console.log('Error fetching Ganache accounts for debugging:', e);
        }
      }
      
      // Create token - this should trigger MetaMask popup
      console.log('Calling createToken contract method...');
      let tx;
      try {
        // Set gas limit explicitly to avoid estimation errors
        tx = await tokenContractWithSigner.createToken(
          signerAddress,
          initialSupply,
          contentURI,
          royaltyPercentage * 100, // Convert percentage to basis points (100 = 1%)
          { 
            gasLimit: 3000000, // Explicit gas limit to avoid estimation issues
            gasPrice: ethers.utils.parseUnits('20', 'gwei') // Set explicit gas price for Ganache
          }
        );
        
        console.log('Token creation transaction submitted:', tx);
        console.log('Transaction hash:', tx.hash);
        console.log('Waiting for transaction confirmation...');
      } catch (txError) {
        console.error('Error submitting token creation transaction:', txError);
        
        // Provide more specific error messages
        if (txError instanceof Error) {
          if (txError.message.includes('denied') || txError.message.includes('rejected')) {
            throw new Error('Transaction was rejected in MetaMask. Please approve the transaction to create tokens.');
          } else if (txError.message.includes('insufficient funds')) {
            throw new Error('Your wallet has insufficient funds to complete this transaction.');
          } else if (txError.message.includes('gas required exceeds allowance')) {
            throw new Error('Transaction would exceed gas limits. Please try with a smaller initial supply.');
          } else if (txError.message.includes('execution reverted')) {
            throw new Error('Transaction failed: Contract execution reverted. This may be due to contract restrictions.');
          } else if (txError.message.includes('JSON-RPC')) {
            throw new Error('JSON-RPC error: There was a problem communicating with the blockchain. Please check your connection to MetaMask and the local blockchain.');
          }
        }
        throw txError;
      }
      
      // Wait for transaction confirmation with timeout
      console.log('Waiting for transaction confirmation...');
      let receipt;
      try {
        // Implement a timeout for transaction confirmation (30 seconds)
        const confirmationPromise = tx.wait();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000);
        });
        
        receipt = await Promise.race([confirmationPromise, timeoutPromise]);
        console.log('Token creation confirmed in block:', receipt.blockNumber);
        console.log('Transaction receipt:', receipt);
      } catch (confirmError) {
        console.error('Error confirming token creation transaction:', confirmError);
        
        // Check if the error is a timeout
        if (confirmError instanceof Error && confirmError.message === 'Transaction confirmation timeout') {
          console.log('Transaction confirmation timed out. The transaction may still complete.');
          
          // Still return the transaction hash so the UI can proceed
          console.log('Returning transaction hash despite timeout:', tx.hash);
          return tx.hash;
        }
        
        throw new Error('Transaction was submitted but could not be confirmed. Please check your transaction in MetaMask.');
      }
      
      // Verify that creator received the tokens
      console.log(`Checking token balance for creator ${signerAddress} after creation...`);
      
      // Use multiple methods to verify token balance
      try {
        // 1. Check using standard web3Provider
        const balanceStandard = await tokenContractWithSigner.balanceOf(signerAddress, contentId);
        console.log(`Creator's token balance (standard provider): ${balanceStandard.toString()}`);
        
        // 2. Try with direct Ganache provider
        const ganacheProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        const tokenContractGanache = new ethers.Contract(
          this.contractAddress,
          wyllohTokenAbi,
          ganacheProvider
        );
        
        const balanceGanache = await tokenContractGanache.balanceOf(signerAddress, contentId);
        console.log(`Creator's token balance (Ganache provider): ${balanceGanache.toString()}`);
        
        // Check if balances match
        if (balanceStandard.toString() !== balanceGanache.toString()) {
          console.warn(`Balance discrepancy: Standard provider: ${balanceStandard}, Ganache provider: ${balanceGanache}`);
        }
        
        // Unified check regardless of which provider was used
        const creatorBalance = Math.max(
          balanceStandard.toNumber(),
          balanceGanache.toNumber()
        );
        
        console.log(`Final creator's token balance: ${creatorBalance}`);
        
        if (creatorBalance < initialSupply) {
          console.warn(`Creator only received ${creatorBalance} tokens out of ${initialSupply} requested`);
        }
        
        if (creatorBalance === 0) {
          console.error('Token creation succeeded but creator has 0 balance');
          throw new Error('Token creation succeeded but creator has 0 balance. This may be a contract issue.');
        }
      } catch (balanceError) {
        console.error('Error checking creator balance:', balanceError);
        // Continue despite balance check error - don't fail the token creation
        console.warn('Unable to verify creator balance, but transaction was submitted successfully');
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
        
        try {
          // Call setRightsThresholds function
          const thresholdsTx = await tokenContractWithSigner.setRightsThresholds(
            tokenId,
            thresholds
          );
          
          console.log('Rights thresholds transaction submitted:', thresholdsTx.hash);
          await thresholdsTx.wait();
          console.log('Rights thresholds set successfully');
        } catch (rightsError) {
          console.error('Error setting rights thresholds:', rightsError);
          console.warn('Token was created but rights thresholds could not be set');
          // Don't fail the token creation if rights thresholds fail
        }
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
      
      // If in demo mode, try different providers to ensure we get the balance
      if (process.env.REACT_APP_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development') {
        try {
          // Try with local provider first for demo mode
          const localProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
          const localTokenContract = new ethers.Contract(
            this.contractAddress,
            wyllohTokenAbi,
            localProvider
          );
          
          const balanceBN = await localTokenContract.balanceOf(address, tokenId);
          const balance = balanceBN.toNumber();
          console.log(`Token balance result (local provider): ${balance}`);
          return balance;
        } catch (localError) {
          console.warn('Error getting balance with local provider, falling back to web3 provider:', localError);
          // Fall back to web3 provider
        }
      }
      
      // Standard approach with web3 provider
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
        pricePerToken: price,
        contractAddress: this.contractAddress
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
          
          console.log(`Content creator address from content record:`, creatorAddress);
          
          if (!sellerAddress) {
            // Fall back to first account as creator for demo
            console.log('Creator address is invalid, falling back to first Ganache account');
            const accounts = await this.provider.listAccounts();
            sellerAddress = accounts[0];
            console.log(`Using fallback seller address: ${sellerAddress}`);
          }
          
          console.log(`Using creator/seller address: ${sellerAddress}`);
          
          // Connect to Ganache directly as backup for reliable queries
          const ganacheProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
          
          // Check if token contract exists at the address
          const contractCode = await ganacheProvider.getCode(this.contractAddress);
          if (contractCode === '0x') {
            console.error(`No contract found at address ${this.contractAddress}`);
            throw new Error(`No token contract found at ${this.contractAddress}. Please check the contract deployment.`);
          }
          
          // Get all Ganache accounts and their balances for debugging
          const allAccounts = await ganacheProvider.listAccounts();
          console.log('All available Ganache accounts:');
          
          for (const account of allAccounts.slice(0, 3)) {
            const balance = await ganacheProvider.getBalance(account);
            console.log(`Account ${account} has ${ethers.utils.formatEther(balance)} ETH`);
            
            // Check token balance for each account to identify where tokens might be
            try {
              const tokenContract = new ethers.Contract(
                this.contractAddress,
                wyllohTokenAbi,
                ganacheProvider
              );
              
              const tokenBalance = await tokenContract.balanceOf(account, tokenId);
              console.log(`Account ${account} has ${tokenBalance.toString()} tokens for token ID ${tokenId}`);
              
              // If we find an account with tokens but it's not the seller, suggest using this account
              if (tokenBalance.toNumber() > 0 && account.toLowerCase() !== sellerAddress!.toLowerCase()) {
                console.log(`Found tokens on account ${account} which is different from seller ${sellerAddress}`);
                console.log(`Considering using account ${account} as seller instead`);
                
                // If seller has 0 tokens but this account has tokens, use this account instead
                const sellerBalance = await tokenContract.balanceOf(sellerAddress!, tokenId);
                if (sellerBalance.toNumber() === 0) {
                  console.log(`Seller has 0 tokens but account ${account} has ${tokenBalance.toString()} tokens`);
                  console.log(`Switching seller to account ${account}`);
                  sellerAddress = account;
                }
              }
            } catch (tokenBalanceError) {
              console.error(`Error checking token balance for account ${account}:`, tokenBalanceError);
            }
          }
          
          // Check if seller has enough tokens to transfer using the Ganache provider for reliability
          const tokenContract = new ethers.Contract(
            this.contractAddress,
            wyllohTokenAbi,
            ganacheProvider
          );
          
          console.log(`Checking token balance for seller ${sellerAddress}`);
          const sellerBalance = await tokenContract.balanceOf(sellerAddress!, tokenId);
          console.log(`Seller token balance from Ganache: ${sellerBalance.toString()} tokens`);
          
          if (sellerBalance.toNumber() < quantity) {
            console.error(`Seller doesn't have enough tokens: has ${sellerBalance}, needs ${quantity}`);
            
            // In demo mode, we can try to mint more tokens to the seller before failing
            if (process.env.REACT_APP_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development') {
              console.log('Demo mode: attempting to mint additional tokens to seller');
              
              try {
                // Connect to provider with first account (admin)
                const accounts = await ganacheProvider.listAccounts();
                const adminSigner = ganacheProvider.getSigner(accounts[0]);
                
                // Connect token contract with admin signer
                const tokenWithAdminSigner = tokenContract.connect(adminSigner);
                
                // Mint additional tokens to seller
                const mintAmount = quantity - sellerBalance.toNumber() + 5; // Add some buffer
                console.log(`Minting ${mintAmount} additional tokens to seller ${sellerAddress}`);
                
                const mintTx = await tokenWithAdminSigner.mint(
                  sellerAddress!,
                  tokenId,
                  mintAmount,
                  "0x" // No data
                );
                
                console.log('Mint transaction submitted:', mintTx.hash);
                const mintReceipt = await mintTx.wait();
                console.log('Mint confirmed in block:', mintReceipt.blockNumber);
                
                // Check updated balance
                const updatedBalance = await tokenContract.balanceOf(sellerAddress!, tokenId);
                console.log(`Updated seller balance: ${updatedBalance.toString()} tokens`);
                
                if (updatedBalance.toNumber() < quantity) {
                  console.error(`Failed to mint enough tokens for seller: has ${updatedBalance}, needs ${quantity}`);
                  throw new Error(`Failed to mint enough tokens for seller: has ${updatedBalance}, needs ${quantity}`);
                }
              } catch (mintError) {
                console.error('Error minting additional tokens to seller:', mintError);
                throw new Error(`Creator doesn't have enough tokens available for this purchase (has ${sellerBalance}, needs ${quantity})`);
              }
            } else {
              throw new Error(`Creator doesn't have enough tokens available for this purchase (has ${sellerBalance}, needs ${quantity})`);
            }
          }
          
          // Verify that buyer is not the same as seller (important!)
          if (signerAddress.toLowerCase() === sellerAddress!.toLowerCase()) {
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
            const creatorSigner = creatorProvider.getSigner(sellerAddress!);
            
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