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
  "function create(address to, uint256 id, uint256 amount, string memory contentId, string memory contentHash, string memory contentType, string memory tokenURI, address royaltyRecipient, uint96 royaltyPercentage)",
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
const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const DEFAULT_MARKETPLACE_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

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
      console.log('Initializing blockchain service...');

      // Check if window.ethereum exists
      if (window.ethereum) {
        console.log('MetaMask detected, connecting to provider...');
        this.provider = new ethers.providers.Web3Provider(window.ethereum as any);
        
        // Get contract address from environment variables or fallback to default
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;
        
        // Explicitly log the value of the env var before reading
        console.log(`Reading process.env.REACT_APP_MARKETPLACE_ADDRESS: [${process.env.REACT_APP_MARKETPLACE_ADDRESS}]`);
        const marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
        
        console.log(`Using token contract address: ${contractAddress}`);
        console.log(`Using marketplace address from initial load: ${marketplaceAddress || 'Not configured'}`);
        
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
        
        // Check if we already have a connected account and dispatch the event
        window.ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              const connectedAccount = accounts[0];
              console.log('Found already connected account during initialization:', connectedAccount);
              
              // Check if this is one of our demo accounts to ensure proper capitalization
              // as MetaMask might return accounts with different capitalization
              const demoWallets = {
                '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1': true,
                '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC': true
              };
              
              // Use the properly capitalized version if it's a demo wallet
              const normalizedAccount = Object.keys(demoWallets).find(
                wallet => wallet.toLowerCase() === connectedAccount.toLowerCase()
              ) || connectedAccount;
              
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
        console.log(`Using marketplace address from initial load: ${marketplaceAddress || 'Not configured'}`);
        
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
          
          // Check if this is one of our demo accounts to ensure proper capitalization
          // as MetaMask might return accounts with different capitalization
          const demoWallets = {
            '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1': true,
            '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC': true
          };
          
          // Use the properly capitalized version if it's a demo wallet
          const normalizedAccount = Object.keys(demoWallets).find(
            wallet => wallet.toLowerCase() === connectedAccount.toLowerCase()
          ) || connectedAccount;
          
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
    if (!this.filmFactoryContract) {
      throw new Error('Film factory not initialized. Please set factory address first.');
    }

    try {
      console.log('Creating film contract through factory:', {
        filmId,
        title,
        creator,
        maxSupply,
        rightsThresholds,
        baseURI
      });

      // Get signer from MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();
      const factoryWithSigner = this.filmFactoryContract.connect(signer);

      // Deploy film contract through factory
      const tx = await factoryWithSigner.deployFilmContract(
        filmId,
        title,
        creator,
        maxSupply,
        rightsThresholds,
        baseURI
      );

      console.log('Film contract deployment transaction:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Film contract deployment confirmed:', receipt);

      // Get the deployed contract address
      const filmContractAddress = await this.filmFactoryContract.getFilmContract(filmId);
      console.log('Film contract deployed to:', filmContractAddress);

      return filmContractAddress;
    } catch (error) {
      console.error('Error creating film contract:', error);
      throw error;
    }
  }

  /**
   * Create a new token for content (legacy method - now uses film factory)
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
        
        // Check if this is one of our demo accounts to ensure proper capitalization
        // as MetaMask might return accounts with different capitalization
        const demoWallets = {
          '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1': true,
          '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC': true
        };
        
        // Use the properly capitalized version if it's a demo wallet
        const normalizedAccount = Object.keys(demoWallets).find(
          wallet => wallet.toLowerCase() === signerAddress.toLowerCase()
        ) || signerAddress;
        
        // Dispatch wallet-account-changed event to trigger auto-login
        // This is needed because our changes to createToken broke the auto-login flow
        const walletChangeEvent = new CustomEvent('wallet-account-changed', { 
          detail: { account: normalizedAccount }
        });
        window.dispatchEvent(walletChangeEvent);
        console.log('Dispatched wallet-account-changed event for:', normalizedAccount);
        
        // Create fresh Web3Provider after account request
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Get network info
        const network = await web3Provider.getNetwork();
        console.log('Connected to network:', network);
        
        // Check if we're on a supported network (chainId 1337 is typically Ganache)
        const expectedChainId = parseInt(process.env.REACT_APP_CHAIN_ID || '1337');
        if (network.chainId !== expectedChainId) {
          console.warn(`You're on network with chainId ${network.chainId}, but expected ${expectedChainId} (Ganache). Attempting to switch networks.`);
          
          try {
            // Try to switch to the correct network
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
            });
            console.log('Successfully switched networks');
          } catch (switchError) {
            console.error('Failed to switch networks:', switchError);
            throw new Error(`Please manually connect MetaMask to the local Ganache network (chainId: ${expectedChainId})`);
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
          
          const balanceBN = await localTokenContract.balanceOf(address, tokenIdBN);
          const balance = balanceBN.toNumber();
          console.log(`Token balance result (local provider): ${balance}`);
          return balance;
        } catch (localError) {
          console.warn('Error getting balance with local provider, falling back to web3 provider:', localError);
          // Fall back to web3 provider
        }
      }
      
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
   * Purchase tokens by calling the marketplace contract
   * @param contentId The content ID/token ID to purchase
   * @param quantity Number of tokens to purchase
   * @param price Price per token in ETH (NOT total price)
   */
  async purchaseTokens(contentId: string, quantity: number, price: number): Promise<boolean> {
    if (!this.isInitialized()) {
      console.warn('BlockchainService not initialized for purchaseTokens');
      return false;
    }
    
    try {
      console.log('BlockchainService: Starting token purchase process with params:', {
        contentId, 
        quantity, 
        price,
        contractAddress: this.contractAddress
      });
      
      // Validate inputs
      if (!contentId || !quantity || quantity <= 0) {
        throw new Error('Invalid token ID or quantity');
      }
      
      // Ensure price is a valid number
      if (typeof price !== 'number' || isNaN(price) || price <= 0) {
        console.error(`Invalid price: ${price}`);
        throw new Error('Invalid price format. Please provide a valid positive number.');
      }
      
      // Generate the correct BigNumber token ID from the contentId string
      const tokenIdBytes = ethers.utils.solidityKeccak256(['string'], [contentId]);
      const tokenIdBN = ethers.BigNumber.from(tokenIdBytes);
      console.log(`Generated BigNumber token ID for purchase: ${tokenIdBN.toString()}`);

      console.log(`Purchasing ${quantity} tokens with ID ${tokenIdBN.toString()} at price ${price} ETH`);
      
      // Calculate total price
      const totalPrice = quantity * price;
      
      // Convert to string with fixed decimal places to avoid floating point issues
      const totalPriceString = totalPrice.toFixed(18);
      
      // Parse to BigNumber
      const totalPriceWei = ethers.utils.parseEther(totalPriceString);
      
      console.log(`Total price: ${totalPrice} ETH (${totalPriceWei.toString()} wei)`);
      
      // For demo mode, either use direct blockchain transactions if available or simulate
      if (window.ethereum && this.provider) {
        try {
          // Get a signer for the transaction
          const signer = this.provider.getSigner();
          const signerAddress = await signer.getAddress();
          
          console.log(`Using buyer address: ${signerAddress}`);
          
          // Get content details to find the creator's address
          const content = await contentService.getContentById(contentId);
          if (!content) {
            throw new Error(`Content with ID ${contentId} not found`);
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
              
              const tokenBalance = await tokenContract.balanceOf(account, tokenIdBN);
              console.log(`Account ${account} has ${tokenBalance.toString()} tokens for token ID ${tokenIdBN.toString()}`);
              
              // If we find an account with tokens but it's not the seller, suggest using this account
              if (tokenBalance.toNumber() > 0 && account.toLowerCase() !== sellerAddress!.toLowerCase()) {
                console.log(`Found tokens on account ${account} which is different from seller ${sellerAddress}`);
                console.log(`Considering using account ${account} as seller instead`);
                
                // If seller has 0 tokens but this account has tokens, use this account instead
                const sellerBalanceCheck = await tokenContract.balanceOf(sellerAddress!, tokenIdBN);
                if (sellerBalanceCheck.toNumber() === 0) {
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
          const sellerBalance = await tokenContract.balanceOf(sellerAddress!, tokenIdBN);
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
                  tokenIdBN,
                  mintAmount,
                  "0x" // No data
                );
                
                console.log('Mint transaction submitted:', mintTx.hash);
                const mintReceipt = await mintTx.wait();
                console.log('Mint confirmed in block:', mintReceipt.blockNumber);
                
                // Check updated balance
                const updatedBalance = await tokenContract.balanceOf(sellerAddress!, tokenIdBN);
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
            console.log(`Transferring ${quantity} tokens of ID ${tokenIdBN.toString()} from ${sellerAddress} to ${signerAddress}`);
            
            // For debugging, check the balance once more before transfer
            const preTransferBalance = await tokenContract.balanceOf(sellerAddress!, tokenIdBN);
            console.log(`Seller balance immediately before transfer: ${preTransferBalance.toString()} tokens`);
            
            // Check approvals - requires the OPERATOR (marketplace) address
            
            // Add explicit logging here to check the marketplace address value
            console.log(`DEBUG: Checking marketplaceAddress inside purchaseTokens: [${this.marketplaceAddress}]`);
            
            if (!this.marketplaceAddress || !ethers.utils.isAddress(this.marketplaceAddress)) {
              console.error("Marketplace address is not configured or invalid. Cannot check/set approval.");
              throw new Error("Marketplace address is not configured. Approval cannot be handled.");
            }
            
            const operatorAddress = this.marketplaceAddress; // The marketplace contract needs approval
            console.log(`Checking if seller (${sellerAddress}) has approved operator (${operatorAddress})...`);
            
            const isApproved = await tokenContract.isApprovedForAll(sellerAddress!, operatorAddress);
            console.log(`Is seller approved for operator (${operatorAddress})? ${isApproved}`);
            
            // In development mode, ensure approval is set if needed, *by the seller*
            if (!isApproved && (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true')) {
              console.log(`Setting approval for operator ${operatorAddress}... (Needs seller's signature)`);
              
              try {
                // This MUST be signed by the seller (creatorSigner)
                const approveTx = await tokenWithCreatorSigner.setApprovalForAll(
                   operatorAddress, // The address to approve (Marketplace Contract)
                   true            // Approve status
                 );
                console.log('Approval transaction submitted:', approveTx.hash);
                const approveReceipt = await approveTx.wait();
                console.log('Approval confirmed in block:', approveReceipt.blockNumber);
              } catch (approvalError) {
                 console.error("Failed to set approval:", approvalError);
                 // Decide if this is critical. For now, we'll log and proceed, maybe transfer fails.
                 // throw new Error("Failed to set approval for marketplace contract."); 
                 console.warn("Proceeding without confirmed approval, transfer might fail.");
              }
            }
            
            // Use safeTransferFrom to send tokens
            let transferTx;
            try {
              transferTx = await tokenWithCreatorSigner.safeTransferFrom(
                sellerAddress,
                signerAddress,
                tokenIdBN,
                quantity,
                "0x", // data - empty for simple transfer
                { gasLimit: 500000 }
              );
            } catch (transferError) {
              console.error('Initial safeTransferFrom failed:', transferError);
              
              // Try alternate method with just "transferFrom" if available
              console.log('Attempting alternate transfer method...');
              try {
                if (tokenWithCreatorSigner.transferFrom) {
                  console.log('Using transferFrom method...');
                  transferTx = await tokenWithCreatorSigner.transferFrom(
                    sellerAddress,
                    signerAddress,
                    tokenIdBN,
                    quantity,
                    { gasLimit: 500000 }
                  );
                } else {
                  throw new Error('No alternative transfer method available');
                }
              } catch (altTransferError) {
                console.error('Alternative transfer method also failed:', altTransferError);
                throw altTransferError;
              }
            }
            
            console.log('Transfer transaction submitted:', transferTx.hash);
            const transferReceipt = await transferTx.wait();
            console.log('Transfer confirmed in block:', transferReceipt.blockNumber);
            
            // Verify the transfer succeeded
            const sellerBalanceAfter = await tokenContract.balanceOf(sellerAddress!, tokenIdBN);
            const buyerBalanceAfter = await tokenContract.balanceOf(signerAddress, tokenIdBN);
            
            console.log(`Seller balance after transfer: ${sellerBalanceAfter.toString()} tokens`);
            console.log(`Buyer balance after transfer: ${buyerBalanceAfter.toString()} tokens`);
            
            if (buyerBalanceAfter.toNumber() < quantity) {
              console.warn(`Buyer received fewer tokens than expected: ${buyerBalanceAfter} < ${quantity}`);
            }
          } catch (transferError) {
            console.error('Error transferring tokens after payment was sent:', transferError);
            // Mark that payment was sent but token transfer failed
            const paymentSentError = new Error('Payment was sent but token transfer failed');
            (paymentSentError as any).paymentSent = true;
            (paymentSentError as any).originalError = transferError;
            throw paymentSentError;
          }
          
          // 4. Update local storage through contentService
          await contentService.purchaseToken(contentId, quantity);
          
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
              console.log(`Minting ${quantity} tokens of ID ${tokenIdBN.toString()} to ${signerAddress}`);
              const mintTx = await tokenWithCreatorSigner.mint(
                signerAddress,
                tokenIdBN,
                quantity,
                "0x" // No data
              );
              
              console.log('Mint transaction submitted:', mintTx.hash);
              const mintReceipt = await mintTx.wait();
              console.log('Mint confirmed in block:', mintReceipt.blockNumber);
              
              // Update local storage
              await contentService.purchaseToken(contentId, quantity);
              return true;
            } catch (mintError) {
              console.error('Mint operation failed:', mintError);
              // Propagate error to prevent local storage update for failed transactions
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
        await contentService.purchaseToken(contentId, quantity);
        
        return true;
      }
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      throw error; // Re-throw to allow proper error handling
    }
  }

  /**
   * Verify token was properly minted to creator
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
      console.log(`Verifying token creation for contentId ${contentId}`);
      
      // Generate token ID from contentId the same way it was created
      const tokenIdBytes = ethers.utils.solidityKeccak256(['string'], [contentId]);
      const tokenId = ethers.BigNumber.from(tokenIdBytes);
      console.log(`Generated token ID for verification: ${tokenId.toString()}`);
      
      // If no creator address provided, try to get the first account
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
      
      // Check balance using multiple methods for reliability
      try {
        // Method 1: Direct contract balance check
        const balance = await this.getTokenBalance(ownerAddress, tokenId.toString());
        console.log(`Token balance for ${ownerAddress} is ${balance}`);
        
        // Method 2: Try using direct Ganache provider
        const ganacheProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        const tokenContract = new ethers.Contract(
          this.contractAddress,
          wyllohTokenAbi,
          ganacheProvider
        );
        
        const ganacheBalance = await tokenContract.balanceOf(ownerAddress, tokenId);
        console.log(`Token balance from Ganache provider: ${ganacheBalance.toString()}`);
        
        // Use the maximum balance reported by either method
        const maxBalance = Math.max(balance, ganacheBalance.toNumber());
        
        // Success if the balance is greater than 0
        const success = maxBalance > 0;
        
        return { 
          success, 
          balance: maxBalance,
          tokenAddress: this.contractAddress
        };
      } catch (error) {
        console.error('Error checking token balance:', error);
        return { success: false, balance: 0, tokenAddress: this.contractAddress };
      }
    } catch (error) {
      console.error('Error verifying token creation:', error);
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