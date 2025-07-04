import { ethers } from 'ethers';
import { POLYGON_MAINNET_ID } from '../constants/blockchain';
import { contentService } from './content.service';

// Complete ABI for the WyllohToken contract (Single Contract - All Films)
const wyllohTokenAbi = [
  // Read functions
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function getRightsThresholds(uint256 tokenId) view returns (tuple(uint256 quantity, string rightsType)[])",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function films(uint256 tokenId) view returns (tuple(string filmId, string title, uint256 maxSupply, uint256 pricePerToken, uint256[] rightsThresholds, address creator, uint256 createdAt, string metadataURI, bool isActive))",
  "function nextTokenId() view returns (uint256)",
  "function getFilmsByCreator(address creator) view returns (uint256[] memory)",
  "function uri(uint256 tokenId) view returns (string memory)",
  "function getAvailableTokens(uint256 tokenId) view returns (uint256)",
  "function getTokenPrice(uint256 tokenId) view returns (uint256)",
  "function totalSupply(uint256 tokenId) view returns (uint256)",
  
  // Write functions - Single Contract Model
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function createFilm(string memory filmId, string memory title, uint256 totalSupply, uint256 pricePerToken, uint256[] memory rightsThresholds, address[] memory royaltyRecipients, uint256[] memory royaltyShares) returns (uint256)",
  "function purchaseTokens(uint256 tokenId, uint256 quantity) payable",
  "function setFilmMetadata(uint256 tokenId, string memory metadataUri)",
  "function updateRoyaltyRecipients(uint256 tokenId, address[] memory recipients, uint256[] memory shares)",
  
  // Events
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
  "event FilmCreated(uint256 indexed tokenId, string indexed filmId, string title, address indexed creator)",
  "event FilmMetadataUpdated(uint256 indexed tokenId, string metadataUri)",
  "event RoyaltyRecipientsUpdated(uint256 indexed tokenId, address[] recipients, uint256[] shares)",
  "event TokensPurchased(address indexed buyer, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice)"
];

// Marketplace ABI for Wylloh token purchases
const marketplaceAbi = [
  // Write functions - Single Contract Integration
  "function purchaseTokens(address tokenContract, uint256 tokenId, uint256 quantity) payable",
  "function buyTokens(uint256 tokenId, uint256 quantity) payable",
  "function listTokens(uint256 tokenId, uint256 quantity, uint256 price)",
  "function setTokenPrice(uint256 tokenId, uint256 newPrice)",
  "function getListingPrice(uint256 tokenId) view returns (uint256)",
  "function getAvailableTokens(uint256 tokenId) view returns (uint256)",
  
  // Events
  "event TokensPurchased(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice)",
  "event TokensListed(address indexed seller, uint256 indexed tokenId, uint256 quantity, uint256 price)"
];

// Treasury Integration ABI for platform fees
const treasuryIntegrationAbi = [
  // Treasury configuration functions
  "function setPlatformTreasury(address treasuryAddress)",
  "function setPlatformFeePercentage(uint256 feePercentage)",
  "function withdrawPlatformFees()",
  "function getPlatformTreasury() view returns (address)",
  "function getPlatformFeePercentage() view returns (uint256)",
  "function getAccumulatedFees() view returns (uint256)",
  
  // Events
  "event PlatformTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury)",
  "event PlatformFeesWithdrawn(address indexed treasury, uint256 amount)"
];

// Film Factory ABI for creating film contracts
const filmFactoryAbi = [
  // Write functions
  "function deployFilmContract(string memory filmId, string memory title, address creator, uint256 maxSupply, uint256[] memory rightsThresholds, string memory baseURI) returns (address)",
  
  // Read functions
  "function getFilmContract(string memory filmId) view returns (address)",
  "function getAllFilmContracts() view returns (address[])",
  "function getTotalFilms() view returns (uint256)",
  
  // Events
  "event FilmContractDeployed(string indexed filmId, string title, address indexed creator, address indexed contractAddress)"
];

// Default contract addresses - should be configured at app startup
const DEFAULT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Will be set via environment or config
const DEFAULT_MARKETPLACE_ADDRESS = '0x0000000000000000000000000000000000000000'; // Will be set via environment or config

/**
 * Service for interacting with the blockchain contracts
 */
class BlockchainService {
  private provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | null = null;
  private tokenContract: ethers.Contract | null = null;
  private marketplaceContract: ethers.Contract | null = null;
  private filmFactoryContract: ethers.Contract | null = null;
  private contractAddress: string = DEFAULT_CONTRACT_ADDRESS;
  private marketplaceAddress: string = DEFAULT_MARKETPLACE_ADDRESS;
  private filmFactoryAddress: string = '';
  private _initialized: boolean = false;
  
  /**
   * Initialize blockchain service with a provider
   */
  initialize(): void {
    try {
      console.log('🚀 Initializing blockchain service for production...');

      // Load contract addresses from configuration
      this.loadContractAddresses();

      // Check if window.ethereum exists
      if (window.ethereum) {
        console.log('MetaMask detected, connecting to provider...');
        this.provider = new ethers.providers.Web3Provider(window.ethereum as any);
        
        this.initializeContracts();
        
        // Check if contracts exist on the blockchain
        this.checkContractExistence();
        
        // Listen for chain and account changes
        this.listenForAccountChanges();
        
        // Check if we already have a connected account and dispatch the event
        window.ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              const connectedAccount = accounts[0];
              console.log('Found already connected account during initialization:', connectedAccount);
              
              // Use the connected account directly - no demo wallet normalization needed
              const normalizedAccount = connectedAccount;
              
              // Dispatch wallet-account-changed event to trigger auto-login
              const walletChangeEvent = new CustomEvent('wallet-account-changed', { 
                detail: { account: normalizedAccount }
              });
              window.dispatchEvent(walletChangeEvent);
              console.log('Dispatched wallet-account-changed event with normalized account:', normalizedAccount);
            }
          })
          .catch((error: any) => {
            console.error('Error checking for connected accounts:', error);
          });
        
        this._initialized = true;
        console.log('✅ Blockchain service initialized successfully with MetaMask');
      } else {
        console.log('No Ethereum provider detected, initializing with RPC provider...');
        
        // Initialize provider with production-ready RPC URL
        const rpcUrl = process.env.REACT_APP_WEB3_PROVIDER || 'https://polygon-rpc.com';
        console.log(`Using RPC URL: ${rpcUrl}`);
        
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        this.initializeContracts();
        
        // Check if contracts exist on the blockchain
        this.checkContractExistence();
        
        this._initialized = true;
        console.log('✅ Blockchain service initialized with RPC provider');
      }
    } catch (error) {
      console.error('❌ Error initializing blockchain service:', error);
      this._initialized = false;
    }
  }

  /**
   * Load contract addresses from various sources in priority order:
   * 1. Environment variables
   * 2. Deployed addresses configuration file
   * 3. Network-specific configuration files
   */
  private loadContractAddresses(): void {
    console.log('📋 Loading contract addresses from configuration...');
    
    // Priority 1: Environment variables
    if (process.env.REACT_APP_CONTRACT_ADDRESS) {
      this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      console.log(`📄 Token contract from env: ${this.contractAddress}`);
    }
    
    if (process.env.REACT_APP_MARKETPLACE_ADDRESS) {
      this.marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
      console.log(`🏪 Marketplace contract from env: ${this.marketplaceAddress}`);
    }
    
    if (process.env.REACT_APP_FILM_FACTORY_ADDRESS) {
      this.filmFactoryAddress = process.env.REACT_APP_FILM_FACTORY_ADDRESS;
      console.log(`🏭 Film factory contract from env: ${this.filmFactoryAddress}`);
    }
    
    // Priority 2: Try to load from deployed addresses config
    try {
      const deployedAddresses = require('../config/deployedAddresses.json');
      if (!this.contractAddress && deployedAddresses.tokenAddress) {
        this.contractAddress = deployedAddresses.tokenAddress;
        console.log(`📄 Token contract from config: ${this.contractAddress}`);
      }
      if (!this.marketplaceAddress && deployedAddresses.marketplaceAddress) {
        this.marketplaceAddress = deployedAddresses.marketplaceAddress;
        console.log(`🏪 Marketplace contract from config: ${this.marketplaceAddress}`);
      }
    } catch (error) {
      console.log('ℹ️ No deployed addresses config found, continuing...');
    }
    
    // Priority 3: Try to load from network-specific config (Polygon)
    try {
      const polygonAddresses = require('../config/polygonAddresses.json');
      if (!this.contractAddress && polygonAddresses.historicFilmContract) {
        this.contractAddress = polygonAddresses.historicFilmContract;
        console.log(`📄 Token contract from Polygon config: ${this.contractAddress}`);
      }
      if (!this.filmFactoryAddress && polygonAddresses.factoryAddress) {
        this.filmFactoryAddress = polygonAddresses.factoryAddress;
        console.log(`🏭 Film factory from Polygon config: ${this.filmFactoryAddress}`);
      }
    } catch (error) {
      console.log('ℹ️ No Polygon addresses config found, continuing...');
    }
    
    // Validation
    if (!this.contractAddress || this.contractAddress === DEFAULT_CONTRACT_ADDRESS) {
      console.warn('⚠️ No valid token contract address configured');
    }
    if (!this.marketplaceAddress || this.marketplaceAddress === DEFAULT_MARKETPLACE_ADDRESS) {
      console.warn('⚠️ No valid marketplace contract address configured');
    }
    if (!this.filmFactoryAddress) {
      console.warn('⚠️ No film factory contract address configured');
    }
    
    console.log('📋 Contract address loading complete');
  }

  /**
   * Load treasury configuration for platform fee integration
   */
  private async loadTreasuryConfiguration(): Promise<{
    primaryTreasury?: string;
    operationalTreasury?: string;
    emergencyReserve?: string;
  }> {
    try {
      // Load treasury addresses from configuration
      const treasuryConfig = require('../config/treasury-addresses.json');
      return {
        primaryTreasury: treasuryConfig.primaryTreasury,
        operationalTreasury: treasuryConfig.operationalTreasury,
        emergencyReserve: treasuryConfig.emergencyReserve
      };
    } catch (error) {
      console.warn('⚠️ Treasury configuration not found, using fallback');
      // Fallback to hardcoded treasury address from environment
      return {
        primaryTreasury: process.env.REACT_APP_TREASURY_ADDRESS || '0x7FA50da5a8f998c9184E344279b205DE699Aa672'
      };
    }
  }

  /**
   * Initialize contract instances with loaded addresses
   */
  private initializeContracts(): void {
    console.log('🔗 Initializing contract instances...');
    
    if (!this.provider) {
      console.error('❌ Provider not available for contract initialization');
      return;
    }
    
    // Connect to token contract
    if (this.contractAddress && this.contractAddress !== DEFAULT_CONTRACT_ADDRESS) {
      console.log('📄 Connecting to token contract...');
      this.tokenContract = new ethers.Contract(
        this.contractAddress,
        wyllohTokenAbi,
        this.provider
      );
      console.log('✅ Token contract connected successfully');
    } else {
      console.warn('⚠️ Token contract address not configured, skipping...');
    }
    
    // Connect to marketplace contract if address is provided
    if (this.marketplaceAddress && this.marketplaceAddress !== DEFAULT_MARKETPLACE_ADDRESS) {
      console.log('🏪 Connecting to marketplace contract...');
      this.marketplaceContract = new ethers.Contract(
        this.marketplaceAddress,
        marketplaceAbi,
        this.provider
      );
      console.log('✅ Marketplace contract connected successfully');
    } else {
      console.warn('⚠️ Marketplace contract not configured, skipping...');
    }
    
    // Connect to film factory contract if address is provided
    if (this.filmFactoryAddress) {
      console.log('🏭 Connecting to film factory contract...');
      this.filmFactoryContract = new ethers.Contract(
        this.filmFactoryAddress,
        filmFactoryAbi,
        this.provider
      );
      console.log('✅ Film factory contract connected successfully');
    } else {
      console.warn('⚠️ Film factory contract not configured, skipping...');
    }
    
    console.log('🔗 Contract initialization complete');
  }

  /**
   * Public method to set or update the marketplace address after initialization.
   * This is useful if the address is loaded dynamically or via environment variables
   * that might not be available immediately at service instantiation time.
   * @param address The marketplace contract address
   */
  public setMarketplaceAddress(address: string | undefined): void {
    if (address && ethers.utils.isAddress(address)) {
      console.log(`BlockchainService: Setting marketplace address to ${address}`);
      this.marketplaceAddress = address;

      // Re-initialize the marketplace contract instance if provider exists
      if (this.provider && !this.marketplaceContract) {
        console.log('Connecting to marketplace contract with updated address...');
        this.marketplaceContract = new ethers.Contract(
          this.marketplaceAddress,
          marketplaceAbi,
          this.provider
        );
        console.log('Marketplace contract connected successfully');
        this.checkContractExistence(); // Re-check existence
      } else if (this.provider && this.marketplaceContract && this.marketplaceContract.address !== address) {
         console.log('Re-connecting to marketplace contract with new address...');
         this.marketplaceContract = new ethers.Contract(
           this.marketplaceAddress,
           marketplaceAbi,
           this.provider
         );
         console.log('Marketplace contract re-connected successfully');
         this.checkContractExistence(); // Re-check existence
      }
    } else {
      console.warn(`BlockchainService: Attempted to set invalid or empty marketplace address: [${address}]`);
      // Keep the existing address or default if it was never set
      this.marketplaceAddress = this.marketplaceAddress || ''; 
    }
  }

  /**
   * Public method to set or update the film factory address after initialization.
   * @param address The film factory contract address
   */
  public setFilmFactoryAddress(address: string | undefined): void {
    if (address && ethers.utils.isAddress(address)) {
      console.log(`BlockchainService: Setting film factory address to ${address}`);
      this.filmFactoryAddress = address;

      // Re-initialize the film factory contract instance if provider exists
      if (this.provider && !this.filmFactoryContract) {
        console.log('Connecting to film factory contract with updated address...');
        this.filmFactoryContract = new ethers.Contract(
          this.filmFactoryAddress,
          filmFactoryAbi,
          this.provider
        );
        console.log('Film factory contract connected successfully');
        this.checkContractExistence(); // Re-check existence
      } else if (this.provider && this.filmFactoryContract && this.filmFactoryContract.address !== address) {
         console.log('Re-connecting to film factory contract with new address...');
         this.filmFactoryContract = new ethers.Contract(
           this.filmFactoryAddress,
           filmFactoryAbi,
           this.provider
         );
         console.log('Film factory contract re-connected successfully');
         this.checkContractExistence(); // Re-check existence
      }
    } else {
      console.warn(`BlockchainService: Attempted to set invalid or empty film factory address: [${address}]`);
      this.filmFactoryAddress = this.filmFactoryAddress || ''; 
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
        
        // Dispatch wallet-account-changed event to trigger auto-login
        if (accounts && accounts.length > 0) {
          const connectedAccount = accounts[0];
          
          // Use the connected account directly - no demo wallet normalization needed
          const normalizedAccount = connectedAccount;
          
          const walletChangeEvent = new CustomEvent('wallet-account-changed', { 
            detail: { account: normalizedAccount }
          });
          window.dispatchEvent(walletChangeEvent);
          console.log('Dispatched wallet-account-changed event for changed account:', normalizedAccount);
        }
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
   * Create a new film through the film factory
   * @param filmId Unique identifier for the film
   * @param title Film title
   * @param creator Creator address
   * @param maxSupply Maximum token supply
   * @param rightsThresholds Array of token quantities for different rights
   * @param baseURI Base URI for metadata
   * @returns Film contract address
   */
  async createFilmContract(
    filmId: string,
    title: string,
    creator: string,
    maxSupply: number,
    rightsThresholds: number[],
    baseURI: string
  ): Promise<string> {
    console.warn('⚠️ createFilmContract is deprecated. Using createFilm instead.');
    
    try {
      // Map to new createFilm method
      const result = await this.createFilm({
        filmId,
        title,
        totalSupply: maxSupply,
        pricePerToken: 4.99, // Default $4.99 for The Cocoanuts
        rightsThresholds,
        royaltyRecipients: [creator],
        royaltyShares: [10000], // 100% to creator initially
        metadataUri: baseURI
      });
      
      // Return the contract address (WyllohFilmRegistry address)
      return this.contractAddress;
    } catch (error) {
      console.error('Error in createFilmContract legacy method:', error);
      throw error;
    }
  }

  /**
   * Create a new film token on the Wylloh platform (Single Contract Model)
   * @param filmData Film creation parameters
   * @returns New token ID
   */
  async createFilm(filmData: {
    filmId: string;
    title: string;
    totalSupply: number;
    pricePerToken: number; // In USDC for stable pricing
    rightsThresholds: number[];
    royaltyRecipients: string[];
    royaltyShares: number[];
    metadataUri?: string;
  }): Promise<{ tokenId: number; transactionHash: string }> {
    if (!this.isInitialized()) {
      throw new Error('Blockchain service not initialized');
    }

    if (!this.tokenContract) {
      throw new Error('Token contract not configured');
    }

    try {
      console.log('🎬 Creating film on Wylloh platform:', {
        filmId: filmData.filmId,
        title: filmData.title,
        totalSupply: filmData.totalSupply,
        pricePerToken: filmData.pricePerToken,
        contractAddress: this.contractAddress
      });

      // Get signer from MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();
      const tokenContractWithSigner = this.tokenContract.connect(signer);

      // Validate treasury integration
      const treasury = await this.loadTreasuryConfiguration();
      const enhancedRoyaltyRecipients = [...filmData.royaltyRecipients];
      const enhancedRoyaltyShares = [...filmData.royaltyShares];

      // Add platform treasury to royalty recipients (5% platform fee)
      if (treasury.primaryTreasury) {
        enhancedRoyaltyRecipients.push(treasury.primaryTreasury);
        enhancedRoyaltyShares.push(500); // 5% in basis points
      }

      // Convert price to wei (USDC has 6 decimals, but we'll use parseEther for demo compatibility)
      const priceInWei = ethers.utils.parseEther(filmData.pricePerToken.toString());

      console.log('📋 Film creation parameters:', {
        filmId: filmData.filmId,
        title: filmData.title,
        totalSupply: filmData.totalSupply,
        pricePerToken: `$${filmData.pricePerToken} USDC`,
        rightsThresholds: filmData.rightsThresholds,
        royaltyRecipients: enhancedRoyaltyRecipients,
        royaltyShares: enhancedRoyaltyShares
      });

      // Create film transaction
      const tx = await tokenContractWithSigner.createFilm(
        filmData.filmId,
        filmData.title,
        filmData.totalSupply,
        priceInWei,
        filmData.rightsThresholds,
        enhancedRoyaltyRecipients,
        enhancedRoyaltyShares,
        {
          gasLimit: 1000000 // Higher gas limit for film creation
        }
      );

      console.log('🚀 Film creation transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Film creation confirmed:', receipt);

      // Extract token ID from events
      const filmCreatedEvent = receipt.events?.find(
        (event: any) => event.event === 'FilmCreated'
      );
      
      if (!filmCreatedEvent) {
        throw new Error('FilmCreated event not found in transaction receipt');
      }

      const tokenId = filmCreatedEvent.args.tokenId.toNumber();
      console.log(`🎭 Film "${filmData.title}" created with token ID: ${tokenId}`);

      // Set metadata URI if provided
      if (filmData.metadataUri) {
        console.log('📝 Setting film metadata...');
        const metadataTx = await tokenContractWithSigner.setFilmMetadata(
          tokenId,
          filmData.metadataUri
        );
        await metadataTx.wait();
        console.log('✅ Metadata set successfully');
      }

      return {
        tokenId,
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('❌ Error creating film:', error);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility - redirects to createFilm
   * @deprecated Use createFilm instead
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
      
      // Force MetaMask connection before attempting transaction
      if (!window.ethereum) {
        console.error('MetaMask not available for token creation');
        throw new Error('MetaMask not available. Please install MetaMask to create tokens.');
      }
      
        console.log('Using MetaMask provider for token creation to ensure popup appears');
        
      // Reset connection to MetaMask to ensure fresh state
      try {
        // Try to get current chainId from MetaMask
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        console.log(`Current MetaMask chainId: ${chainId}`);
        
        // Explicitly request accounts to trigger MetaMask popup if not connected
          console.log('Requesting MetaMask account access...');
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          if (!accounts || accounts.length === 0) {
          throw new Error('No MetaMask accounts available. Please connect your wallet first.');
        }
        
        // Get the connected account address
        const signerAddress = accounts[0];
        console.log(`Using account address for token creation: ${signerAddress}`);
        
        // Dispatch wallet-account-changed event for Web3AuthManager coordination
        const walletChangeEvent = new CustomEvent('wallet-account-changed', { 
          detail: { account: signerAddress }
        });
        window.dispatchEvent(walletChangeEvent);
        console.log('Dispatched wallet-account-changed event for:', signerAddress);
        
        // Create fresh Web3Provider after account request
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Get network info
        const network = await web3Provider.getNetwork();
        console.log('Connected to network:', network);
        
        // Check if we're on Polygon mainnet
        const expectedChainId = 137; // Polygon mainnet
        if (network.chainId !== expectedChainId) {
          console.warn(`You're on network with chainId ${network.chainId}, but expected ${expectedChainId} (Polygon). Attempting to switch networks.`);
          
          try {
            // Try to switch to Polygon mainnet
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
            });
            console.log('Successfully switched to Polygon mainnet');
          } catch (switchError) {
            console.error('Failed to switch networks:', switchError);
            throw new Error(`Please manually connect MetaMask to Polygon mainnet (chainId: ${expectedChainId})`);
          }
      }
      
      // Get signer from Web3Provider
      const signer = web3Provider.getSigner();
      
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
      
        // For debugging, check the contract state before token creation
        // Remove the non-standard .exists() check
        /*
        try {
          console.log(`Checking if token ${contentId} already exists...`);
          // Convert contentId to tokenId for check
          const tokenIdBytesForCheck = ethers.utils.solidityKeccak256(['string'], [contentId]);
          const tokenIdForCheck = ethers.BigNumber.from(tokenIdBytesForCheck);
          
          // Assuming exists check is replaced by a balance check or similar standard check
          // const exists = await tokenContractWithSigner.exists(tokenIdForCheck); // Removed
          // console.log(`Token ${contentId} (ID: ${tokenIdForCheck.toString()}) exists: ${exists}`);
          
          // Check balance instead of exists
          const currentBalance = await tokenContractWithSigner.balanceOf(signerAddress, tokenIdForCheck);
          console.log(`Current balance for token ID ${tokenIdForCheck.toString()}: ${currentBalance.toString()}`);
          
          if (currentBalance.gt(0)) {
             console.log('Token already exists and has balance.');
          }

        } catch (checkError) {
          console.warn('Error checking token existence/balance:', checkError);
        }
        */
      
      // Production environment - using Polygon mainnet
      
        // Create a unique token ID from the contentId using hash
        // This ensures deterministic but unique IDs for each content
        const tokenIdBytes = ethers.utils.solidityKeccak256(['string'], [contentId]);
        const tokenId = ethers.BigNumber.from(tokenIdBytes);
        
        // Use more explicit transaction options for better reliability in the demo environment
        console.log('Generating token ID from contentId:', {
          contentId, 
          tokenIdBytes: tokenIdBytes.substring(0, 20) + '...',
          tokenId: tokenId.toString()
        });
        
        console.log('Submitting createToken transaction...');
      let tx;
      try {
          tx = await tokenContractWithSigner.create(
            signerAddress,  // to - recipient address 
            tokenId,        // id - token ID (using hash of contentId)
            initialSupply,  // amount - initial token supply
            contentId,      // contentId string
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(contentId)),  // contentHash - hash of contentId
            "media",        // contentType - type of content
            contentURI,     // tokenURI - metadata URI
            signerAddress,  // royaltyRecipient - creator address
            royaltyPercentage * 100, // royaltyPercentage - convert percentage to basis points (100 = 1%)
            { 
              gasLimit: 5000000,  // Higher gas limit for local development
              gasPrice: ethers.utils.parseUnits('50', 'gwei')  // Higher gas price for priority
          }
        );
        
        console.log('Token creation transaction submitted:', tx);
        console.log('Transaction hash:', tx.hash);
      
      // Wait for transaction confirmation with timeout
      console.log('Waiting for transaction confirmation...');
      try {
        // Implement a timeout for transaction confirmation (30 seconds)
            const confirmationPromise = tx.wait(1); // Wait for 1 confirmation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000);
        });
        
            const receipt = await Promise.race([confirmationPromise, timeoutPromise]);
        console.log('Token creation confirmed in block:', receipt.blockNumber);
        console.log('Transaction receipt:', receipt);
            
            // Verify that tokens were minted properly - add a longer delay to ensure blockchain state updates
            console.log(`Waiting 3 seconds before checking token balance...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
              const balanceAfter = await tokenContractWithSigner.balanceOf(signerAddress, tokenId);
              console.log(`Creator's token balance after creation: ${balanceAfter.toString()}`);
              
              if (balanceAfter.eq(0)) {
                console.warn('Warning: Creator has 0 tokens despite successful transaction. Attempting to mint tokens directly...');
                
                // If balance is still 0, try to mint tokens directly to the creator
                try {
                  console.log('Attempting direct token mint as a recovery mechanism...');
                  const mintTx = await tokenContractWithSigner.mint(
                    signerAddress,  // creator address to receive tokens
                    tokenId,        // token ID
                    initialSupply,  // amount to mint
                    [],             // no data for simplicity
                    { 
                      gasLimit: 5000000,
                      gasPrice: ethers.utils.parseUnits('50', 'gwei')
                    }
                  );
                  
                  console.log('Mint transaction submitted:', mintTx.hash);
                  await mintTx.wait(1);
                  
                  // Check balance again after direct mint
                  const balanceAfterMint = await tokenContractWithSigner.balanceOf(signerAddress, tokenId);
                  console.log(`Creator's token balance after direct mint: ${balanceAfterMint.toString()}`);
                  
                  if (balanceAfterMint.eq(0)) {
                    throw new Error('Failed to mint tokens to creator even with direct mint attempt');
                  }
                } catch (mintError) {
                  console.error('Error attempting direct token mint:', mintError);
                  throw new Error('Token creation succeeded but minting failed. This may be a contract implementation issue.');
                }
        }
      } catch (balanceError) {
              console.error('Error checking token balance after creation:', balanceError);
              throw new Error('Error verifying token balance after creation. Please check the transaction in MetaMask.');
            }
          } catch (confirmError) {
            console.error('Error confirming token creation transaction:', confirmError);
            
            // Check if the error is a timeout
            if (confirmError instanceof Error && confirmError.message === 'Transaction confirmation timeout') {
              console.log('Transaction confirmation timed out. The transaction may still complete.');
              
              // Still return the transaction hash so the UI can proceed
              console.log('Returning transaction hash despite timeout:', tx.hash);
              return tx.hash;
            }
            
            throw new Error('Transaction was submitted but could not be confirmed. It may still be processing in the background.');
          }
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
            }
          }
          throw txError;
      }
      
      return tx.hash;
      } catch (error) {
        console.error('MetaMask connection error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }
  
  /**
   * Get token balance for a user
   * @param address User's wallet address
   * @param tokenId ID of the token to check balance for (can be string contentId or BigNumber tokenId)
   * @returns Number of tokens owned
   */
  async getTokenBalance(address: string, tokenIdInput: string | ethers.BigNumber): Promise<number> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for getTokenBalance');
      return 0;
    }
    
    let tokenIdBN: ethers.BigNumber;
    try {
      // Convert string contentId to BigNumber tokenId if needed
      if (typeof tokenIdInput === 'string') {
         console.log(`Converting contentId "${tokenIdInput}" to BigNumber tokenId for balance check`);
         const tokenIdBytes = ethers.utils.solidityKeccak256(['string'], [tokenIdInput]);
         tokenIdBN = ethers.BigNumber.from(tokenIdBytes);
         console.log(`Generated tokenId: ${tokenIdBN.toString()}`);
      } else {
         tokenIdBN = tokenIdInput;
         console.log(`Using provided BigNumber tokenId: ${tokenIdBN.toString()}`);
      }

      console.log(`Checking token balance for address ${address} and token ID ${tokenIdBN.toString()}`);
      
      // Get balance using the configured provider
      
      // Standard approach with web3 provider
      const balanceBN = await this.tokenContract!.balanceOf(address, tokenIdBN);
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
   * @param tokenId ID of the token to get rights thresholds for (can be string contentId or BigNumber tokenId)
   * @returns Array of rights thresholds
   */
  async getRightsThresholds(tokenIdInput: string | ethers.BigNumber): Promise<{quantity: number, type: string}[]> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for getRightsThresholds');
      return [];
    }
    
    let tokenIdBN: ethers.BigNumber;
    try {
       // Convert string contentId to BigNumber tokenId if needed
       if (typeof tokenIdInput === 'string') {
          console.log(`Converting contentId "${tokenIdInput}" to BigNumber tokenId for rights check`);
          const tokenIdBytes = ethers.utils.solidityKeccak256(['string'], [tokenIdInput]);
          tokenIdBN = ethers.BigNumber.from(tokenIdBytes);
          console.log(`Generated tokenId: ${tokenIdBN.toString()}`);
       } else {
          tokenIdBN = tokenIdInput;
          console.log(`Using provided BigNumber tokenId: ${tokenIdBN.toString()}`);
       }

      console.log(`Getting rights thresholds for token ID ${tokenIdBN.toString()}`);
      const thresholds = await this.tokenContract!.getRightsThresholds(tokenIdBN);
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
   * Purchase tokens through marketplace contract (PRODUCTION VERSION)
   * Clean implementation for content access token purchases
   * @param contentId The content ID/token ID to purchase
   * @param quantity Number of tokens to purchase (unlocks content access)
   * @param price Price per token in USDC for stable, user-friendly pricing
   */
  async purchaseTokens(contentId: string, quantity: number, price: number): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Blockchain service not initialized');
    }

    if (!this.tokenContract) {
      throw new Error('Token contract not configured');
    }

    if (!window.ethereum || !this.provider) {
      throw new Error('MetaMask not available');
    }

    try {
      console.log('🚀 Production USDC token purchase for content access:', { contentId, quantity, price });
      
      // Validate inputs
      if (!contentId || quantity <= 0 || price <= 0) {
        throw new Error('Invalid purchase parameters');
      }

      // Get buyer's signer
      const signer = this.provider.getSigner();
      const buyerAddress = await signer.getAddress();
      
      // Find the token ID for this content
      const tokenId = await this.getTokenIdForContent(contentId);
      if (!tokenId) {
        throw new Error('Content not found in registry');
      }
      
      // Calculate total price in USDC (with 6 decimals)
      const totalPriceUSDC = ethers.utils.parseUnits((quantity * price).toString(), 6);
      
      console.log(`Buyer: ${buyerAddress}, Token ID: ${tokenId}, Quantity: ${quantity}, Total: $${quantity * price} USDC`);
      
      // Check if we need to use marketplace or direct purchase
      const tokenContractWithSigner = this.tokenContract.connect(signer);
      
      // For production, use direct purchase through WyllohFilmRegistry
      // (The registry will handle USDC transfers internally)
      const purchaseTx = await tokenContractWithSigner.purchaseTokens(
        tokenId,              // token ID
        quantity,             // quantity to purchase
        {
          gasLimit: 500000
        }
      );

      console.log('Purchase transaction submitted:', purchaseTx.hash);
      const receipt = await purchaseTx.wait();
      console.log('Purchase confirmed in block:', receipt.blockNumber);

      // Verify buyer received tokens (content access keys)
      const buyerTokenBalance = await this.tokenContract.balanceOf(buyerAddress, tokenId);
      console.log(`Buyer token balance after purchase: ${buyerTokenBalance.toString()} tokens`);

      if (buyerTokenBalance.toNumber() < quantity) {
        throw new Error('Purchase failed: content access tokens not received');
      }

      // Update local storage through contentService
      await contentService.purchaseToken(contentId, quantity);

      console.log(`✅ Successfully purchased ${quantity} tokens for content ${contentId} - content access unlocked`);
      return true;
    } catch (error) {
      console.error('❌ Error purchasing content access tokens:', error);
      throw error;
    }
  }

  /**
   * Get token ID for content ID (maps content to blockchain token)
   * @param contentId Content identifier
   * @returns Token ID or null if not found
   */
  private async getTokenIdForContent(contentId: string): Promise<number | null> {
    if (!this.tokenContract) {
      return null;
    }

    try {
      // Get next token ID to know the range
      const nextTokenId = await this.tokenContract.nextTokenId();
      
      // Search through existing tokens to find matching filmId
      for (let i = 1; i < nextTokenId.toNumber(); i++) {
        const filmData = await this.tokenContract.films(i);
        if (filmData.filmId === contentId) {
          return i;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding token ID for content:', error);
      return null;
    }
  }

  /**
   * Verify token was properly minted to creator (PRODUCTION VERSION)
   * Production blockchain service for Polygon mainnet
   * @param contentId The content ID/token ID to check
   * @param creatorAddress The creator's wallet address
   * @returns Object containing success flag and balance
   */
  async verifyTokenCreation(contentId: string, creatorAddress?: string): Promise<{success: boolean, balance: number, tokenAddress: string}> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for verifyTokenCreation');
      return { success: false, balance: 0, tokenAddress: this.contractAddress };
    }
    
    try {
      console.log(`🔍 Verifying token creation for contentId ${contentId}`);
      
      // Generate token ID from contentId the same way it was created
      const tokenIdBytes = ethers.utils.solidityKeccak256(['string'], [contentId]);
      const tokenId = ethers.BigNumber.from(tokenIdBytes);
      console.log(`Generated token ID for verification: ${tokenId.toString()}`);
      
      // If no creator address provided, try to get the current account
      let ownerAddress = creatorAddress;
      if (!ownerAddress && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          ownerAddress = accounts[0];
          console.log(`Using connected account as owner: ${ownerAddress}`);
        } catch (e) {
          console.error('Failed to get accounts from MetaMask:', e);
        }
      }
      
      if (!ownerAddress) {
        console.error('No owner address available for verification');
        return { success: false, balance: 0, tokenAddress: this.contractAddress };
      }
      
      // Check balance using the current provider (production-ready)
      try {
        const balance = await this.getTokenBalance(ownerAddress, tokenId.toString());
        console.log(`✅ Token balance for ${ownerAddress}: ${balance} tokens`);
        
        // Success if the balance is greater than 0
        const success = balance > 0;
        
        if (success) {
          console.log(`🎉 Token verification successful - creator has ${balance} tokens`);
        } else {
          console.warn(`⚠️ Token verification failed - creator has 0 tokens`);
        }
        
        return { 
          success, 
          balance,
          tokenAddress: this.contractAddress
        };
      } catch (error) {
        console.error('❌ Error checking token balance:', error);
        return { success: false, balance: 0, tokenAddress: this.contractAddress };
      }
    } catch (error) {
      console.error('❌ Error verifying token creation:', error);
      return { success: false, balance: 0, tokenAddress: this.contractAddress };
    }
  }

  /**
   * Add token to MetaMask
   * @param tokenId The token ID to add
   * @returns Promise resolving to boolean indicating success
   */
  async addTokenToMetaMask(tokenId: string): Promise<boolean> {
    if (!window.ethereum) {
      console.error('MetaMask not available');
      return false;
    }
    
    try {
      console.log(`Adding token ${tokenId} to MetaMask`);
      
      // Note: MetaMask does not fully support adding ERC-1155 tokens through wallet_watchAsset yet
      // This is best effort and may not work in all versions of MetaMask
      try {
        // Try to add as an NFT (ERC-721)
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: [
            {
              type: 'ERC721', 
              options: {
                address: this.contractAddress,
                tokenId: tokenId,
              },
            }
          ]
        });
        
        if (wasAdded) {
          console.log('Token was added to MetaMask as ERC-721');
          return true;
        }
      } catch (nftError) {
        console.warn('Failed to add as ERC-721:', nftError);
        
        // Try to add as a standard token (fallback to ERC-20)
        try {
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: [
              {
                type: 'ERC20', 
                options: {
                  address: this.contractAddress,
                  symbol: 'WYLLOH',
                  decimals: 0,
                  image: `https://localhost:3000/assets/token-icon.png`,
                },
              }
            ]
          });
          
          if (wasAdded) {
            console.log('Token contract was added to MetaMask as ERC-20');
            console.warn('Note: This adds the contract but not the specific token ID');
            return true;
          }
        } catch (erc20Error) {
          console.warn('Failed to add as ERC-20:', erc20Error);
        }
      }
      
      console.log('Token was not added to MetaMask');
      console.log('To view tokens in MetaMask, go to NFTs tab and click Import NFTs, then enter:');
      console.log(`Contract Address: ${this.contractAddress}`);
      console.log(`Token ID: ${tokenId}`);
      
      return false;
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
      console.log('To manually add the token to MetaMask, go to NFTs tab and click Import NFTs, then enter:');
      console.log(`Contract Address: ${this.contractAddress}`);
      console.log(`Token ID: ${tokenId}`);
      return false;
    }
  }

  /**
   * Get all films on the Wylloh platform
   * @returns Array of film data
   */
  async getAllWyllohFilms(): Promise<Array<{
    tokenId: number;
    filmId: string;
    title: string;
    totalSupply: number;
    pricePerToken: string;
    creator: string;
    createdAt: number;
  }>> {
    if (!this.isInitialized() || !this.tokenContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const nextTokenId = await this.tokenContract.nextTokenId();
      const films = [];

      for (let i = 1; i < nextTokenId.toNumber(); i++) {
        const filmData = await this.tokenContract.films(i);
        films.push({
          tokenId: i,
          filmId: filmData.filmId,
          title: filmData.title,
          totalSupply: filmData.totalSupply.toNumber(),
          pricePerToken: ethers.utils.formatEther(filmData.pricePerToken),
          creator: filmData.creator,
          createdAt: filmData.createdAt.toNumber()
        });
      }

      return films;
    } catch (error) {
      console.error('Error fetching Wylloh films:', error);
      throw error;
    }
  }

  /**
   * Get films created by a specific creator
   * @param creatorAddress Creator's wallet address
   * @returns Array of film token IDs
   */
  async getFilmsByCreator(creatorAddress: string): Promise<number[]> {
    if (!this.isInitialized() || !this.tokenContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const filmIds = await this.tokenContract.getFilmsByCreator(creatorAddress);
      return filmIds.map((id: any) => id.toNumber());
    } catch (error) {
      console.error('Error fetching creator films:', error);
      throw error;
    }
  }

  /**
   * Get user's Wylloh film collection for Library display
   * @param userAddress User's wallet address
   * @returns Array of user's films with balances and rights
   */
  async getUserWyllohLibrary(userAddress: string): Promise<Array<{
    tokenId: number;
    filmId: string;
    title: string;
    balance: number;
    rightsLevel: string;
    pricePerToken: string;
  }>> {
    if (!this.isInitialized() || !this.tokenContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const allFilms = await this.getAllWyllohFilms();
      const userLibrary = [];

      for (const film of allFilms) {
        const balance = await this.getTokenBalance(userAddress, film.tokenId.toString());
        
        if (balance > 0) {
          // Determine rights level based on balance and thresholds
          const rightsThresholds = await this.getRightsThresholds(film.tokenId.toString());
          let rightsLevel = 'Personal Viewing';
          
          for (const threshold of rightsThresholds.reverse()) {
            if (balance >= threshold.quantity) {
              rightsLevel = threshold.type;
              break;
            }
          }

          userLibrary.push({
            tokenId: film.tokenId,
            filmId: film.filmId,
            title: film.title,
            balance,
            rightsLevel,
            pricePerToken: film.pricePerToken
          });
        }
      }

      return userLibrary;
    } catch (error) {
      console.error('Error fetching user library:', error);
      throw error;
    }
  }

  /**
   * Get token value metrics and history for a library
   * @param tokenIds Array of token IDs to get values for
   * @param period Optional period (7d, 30d, 1y)
   * @returns Token value metrics and history
   */
  async getTokenValueMetrics(tokenIds: string[], period: string = '30d'): Promise<{
    totalTokenValue: number,
    tokenValueHistory: Array<{
      date: string,
      value: number,
      change: number,
      changePercentage: number,
      verifiedTokensCount: number
    }>,
    verifiedTokens: number,
    unverifiedTokens: number,
    tokenPriceChanges: {
      day: number,
      week: number,
      month: number
    },
    highestValueToken: {
      contentId: string,
      tokenId: string,
      value: number,
      chain: string
    }
  }> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for getTokenValueMetrics');
      throw new Error('Blockchain service not initialized');
    }
    
    try {
      console.log(`Getting token value metrics for ${tokenIds.length} tokens, period: ${period}`);
      
      // For real implementation, we would query blockchain for token price history
      // For now, we'll generate simulated data based on the token IDs
      
      // Generate a deterministic seed based on tokenIds to ensure consistency
      const seed = tokenIds.reduce((acc, id) => acc + parseInt(id.substring(0, 8), 16), 0);
      const random = (min: number, max: number) => {
        const x = Math.sin(seed * 9999) * 10000;
        const r = x - Math.floor(x);
        return min + r * (max - min);
      };
      
      // Get date range based on period
      const today = new Date();
      let days = 30;
      switch (period) {
        case '7d':
          days = 7;
          break;
        case '30d':
          days = 30;
          break;
        case '1y':
          days = 365;
          break;
      }
      
      // Generate token value history
      const tokenValueHistory = [];
      let currentValue = 1000 + (seed % 1000); // Start value based on token IDs
      let verifiedCount = Math.max(1, Math.min(tokenIds.length, Math.floor(tokenIds.length * 0.7))); // Start with 70% verified
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        // Random daily change between -3% and +4%
        const changePercent = random(-3, 4);
        const change = currentValue * (changePercent / 100);
        currentValue += change;
        
        // Occasionally increase verified tokens count
        if (i % 10 === 0 && verifiedCount < tokenIds.length) {
          verifiedCount = Math.min(tokenIds.length, verifiedCount + 1);
        }
        
        tokenValueHistory.push({
          date: date.toISOString(),
          value: Math.round(currentValue),
          change: Math.round(change),
          changePercentage: Math.round(changePercent * 10) / 10,
          verifiedTokensCount: verifiedCount
        });
      }
      
      // Last day's value
      const lastValue = tokenValueHistory[tokenValueHistory.length - 1].value;
      
      // Calculate price changes
      const dayChange = tokenValueHistory.length >= 2 
        ? ((tokenValueHistory[tokenValueHistory.length - 1].value / tokenValueHistory[tokenValueHistory.length - 2].value) - 1) * 100 
        : 0;
        
      const weekChange = tokenValueHistory.length >= 8 
        ? ((tokenValueHistory[tokenValueHistory.length - 1].value / tokenValueHistory[tokenValueHistory.length - 8].value) - 1) * 100 
        : 0;
        
      const monthChange = tokenValueHistory.length >= 31 
        ? ((tokenValueHistory[tokenValueHistory.length - 1].value / tokenValueHistory[tokenValueHistory.length - 31].value) - 1) * 100 
        : ((tokenValueHistory[tokenValueHistory.length - 1].value / tokenValueHistory[0].value) - 1) * 100;
      
      // Find highest value token
      const highestValueTokenIndex = Math.floor(random(0, tokenIds.length));
      const highestTokenId = tokenIds[highestValueTokenIndex] || tokenIds[0] || '0x1';
      const contentId = `content-${highestTokenId.substring(0, 8)}`;
      
      return {
        totalTokenValue: lastValue,
        tokenValueHistory,
        verifiedTokens: verifiedCount,
        unverifiedTokens: tokenIds.length - verifiedCount,
        tokenPriceChanges: {
          day: Math.round(dayChange * 10) / 10,
          week: Math.round(weekChange * 10) / 10,
          month: Math.round(monthChange * 10) / 10
        },
        highestValueToken: {
          contentId,
          tokenId: highestTokenId,
          value: Math.round(lastValue * 0.3), // Highest token is 30% of total value
          chain: 'Ethereum'
        }
      };
    } catch (error) {
      console.error('Error getting token value metrics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService(); 