import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ethers } from 'ethers';
import { blockchainService } from './blockchain.service';
import { keyManagementService } from './keyManagement.service';

// Add custom type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      selectedAddress?: string;
    };
  }
}

export interface Content {
  id: string;
  title: string;
  description: string;
  contentType: string;
  creator: string;
  creatorAddress: string;
  mainFileCid: string;
  previewCid?: string;
  thumbnailCid?: string;
  image?: string;
  metadata: Record<string, any>;
  tokenized: boolean;
  tokenId?: string;
  price?: number;
  available?: number;
  totalSupply?: number;
  createdAt: string;
  status: 'draft' | 'pending' | 'active';
  visibility: 'public' | 'private' | 'unlisted';
  views: number;
  sales: number;
  rightsThresholds?: Array<{quantity: number, type: string}>;
}

// Add interface for purchased content
export interface PurchasedContent extends Content {
  purchaseDate: string;
  purchasePrice: number;
  purchaseQuantity: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Mock content data for demonstration
const mockContent: Content[] = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    description: 'A short film featuring a large rabbit dealing with three bullying rodents.',
    contentType: 'short film',
    creator: 'Pro Creator',
    creatorAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    // Using a public CID for the official Big Buck Bunny video
    mainFileCid: 'QmVLEz2SxoNiFnuyLpbXsH6SvjPTrHNMU88vCQZyhgBzgw',
    image: 'https://peach.blender.org/wp-content/uploads/bbb-splash.png',
    metadata: { 
      isDemo: true, 
      demoVersion: '1.0',
      rightsThresholds: [
        { quantity: 1, type: 'Personal Viewing' },
        { quantity: 100, type: 'Small Venue' },
        { quantity: 500, type: 'Commercial Exhibition' },
        { quantity: 1000, type: 'Broadcast Rights' }
      ]
    },
    tokenized: true,
    tokenId: '0x1234...5678',
    price: 0.01,
    available: 995,
    totalSupply: 1000,
    createdAt: new Date().toISOString(),
    status: 'active',
    visibility: 'public',
    views: 0,
    sales: 0
  },
  {
    id: '1',
    title: 'The Digital Frontier',
    description: 'A journey into the world of blockchain and digital ownership.',
    contentType: 'movie',
    creator: 'Digital Studios',
    creatorAddress: '0x1234...5678',
    mainFileCid: '',
    image: 'https://source.unsplash.com/random/400x300/?technology',
    metadata: { isDemo: true },
    tokenized: true,
    tokenId: '0x1234...5678',
    price: 0.01,
    available: 250,
    totalSupply: 1000,
    createdAt: '2023-10-15',
    status: 'active',
    visibility: 'public',
    views: 245,
    sales: 18
  },
  {
    id: '2',
    title: 'Nature Unveiled',
    description: 'A breathtaking documentary exploring the wonders of nature.',
    contentType: 'documentary',
    creator: 'EcoVision Films',
    creatorAddress: '0x2345...6789',
    mainFileCid: '',
    image: 'https://source.unsplash.com/random/400x300/?nature',
    metadata: { isDemo: true },
    tokenized: true,
    tokenId: '0x2345...6789',
    price: 0.008,
    available: 450,
    totalSupply: 1000,
    createdAt: '2023-09-22',
    status: 'active',
    visibility: 'public',
    views: 189,
    sales: 12
  }
];

// Local storage keys
const LOCAL_CONTENT_KEY = 'wylloh_local_content';
const LOCAL_PURCHASED_CONTENT_KEY = 'wylloh_local_purchased_content';

class ContentService {
  private readonly baseUrl = `${API_BASE_URL}/content`;

  // Retrieve locally stored content
  private getLocalContent(): Content[] {
    try {
      const localContent = localStorage.getItem(LOCAL_CONTENT_KEY);
      return localContent ? JSON.parse(localContent) : [];
    } catch (error) {
      console.error('Error retrieving local content:', error);
      return [];
    }
  }

  // Save content locally when API is unavailable
  private saveLocalContent(content: Content): void {
    try {
      const existingContent = this.getLocalContent();
      
      // Check if content with this ID already exists
      const index = existingContent.findIndex(c => c.id === content.id);
      
      if (index >= 0) {
        // Update existing content
        existingContent[index] = content;
      } else {
        // Add new content
        existingContent.push(content);
      }
      
      localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(existingContent));
    } catch (error) {
      console.error('Error saving local content:', error);
    }
  }

  // Create new content entry
  async createContent(content: Partial<Content>): Promise<Content> {
    try {
      const response = await axios.post<ApiResponse<Content>>(this.baseUrl, content);
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, storing content locally:', error);
      
      // Check if we have a provided ID
      let contentId = content.id;
      
      // If no ID is provided, create a unique one
      if (!contentId) {
        contentId = `local-${Date.now()}`;
      }
      
      console.log(`ContentService: Creating content with ID ${contentId}`);
      
      // Create a new content object
      const newContent: Content = {
        id: contentId,
        title: content.title || 'Untitled',
        description: content.description || '',
        contentType: content.contentType || 'other',
        creator: 'Local User',
        creatorAddress: content.creatorAddress || '0x0',
        mainFileCid: content.mainFileCid || '',
        previewCid: content.previewCid || '',
        thumbnailCid: content.thumbnailCid || '',
        metadata: content.metadata || {},
        tokenized: content.tokenized || false,
        createdAt: new Date().toISOString(),
        status: content.status || 'draft',
        visibility: content.visibility || 'private',
        views: 0,
        sales: 0
      };
      
      // Add price and supply if tokenized
      if (newContent.tokenized) {
        newContent.price = content.price;
        newContent.available = content.totalSupply;
        newContent.totalSupply = content.totalSupply;
      }
      
      // Add rights thresholds if present
      if (content.rightsThresholds) {
        newContent.rightsThresholds = content.rightsThresholds;
      }
      
      // Before saving, check if a content item with this ID already exists
      const existingContent = this.getLocalContent();
      const existingIndex = existingContent.findIndex(c => c.id === contentId);
      
      if (existingIndex >= 0) {
        console.log(`ContentService: Updating existing content with ID ${contentId}`);
        // Update the existing content
        existingContent[existingIndex] = {
          ...existingContent[existingIndex],
          ...newContent
        };
        localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(existingContent));
        return existingContent[existingIndex];
      } else {
        console.log(`ContentService: Adding new content with ID ${contentId}`);
        // Add new content
        this.saveLocalContent(newContent);
      }
      
      return newContent;
    }
  }

  async getAllContent(): Promise<Content[]> {
    try {
      const response = await axios.get<ApiResponse<Content[]>>(this.baseUrl);
      const apiContent = response.data.data || [];
      const localContent = this.getLocalContent();
      
      // Combine API content, local content, and mock content with unique IDs
      const combinedContent = this.deduplicateContent([
        ...apiContent, 
        ...localContent,
        ...mockContent
      ]);
      
      return combinedContent;
    } catch (error) {
      console.warn('API unavailable, returning local and mock data:', error);
      return this.deduplicateContent([...this.getLocalContent(), ...mockContent]);
    }
  }

  async getContentById(id: string): Promise<Content | undefined> {
    try {
      const response = await axios.get<ApiResponse<Content>>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, checking local content:', error);
      
      // First check local content
      const localContent = this.getLocalContent();
      const localMatch = localContent.find(content => content.id === id);
      
      if (localMatch) return localMatch;
      
      // Then check mock content
      return mockContent.find(content => content.id === id);
    }
  }

  async getCreatorContent(): Promise<Content[]> {
    try {
      const response = await axios.get<ApiResponse<Content[]>>(`${this.baseUrl}/creator`);
      const apiContent = response.data.data || [];
      const localContent = this.getLocalContent();
      
      // For demo purposes, include mock content in creator's content
      return this.deduplicateContent([...apiContent, ...localContent, ...mockContent]);
    } catch (error) {
      console.warn('API unavailable, returning local and mock content:', error);
      return this.deduplicateContent([...this.getLocalContent(), ...mockContent]);
    }
  }

  async getMarketplaceContent(): Promise<Content[]> {
    try {
      const response = await axios.get<ApiResponse<Content[]>>(`${this.baseUrl}/marketplace`);
      const apiContent = response.data.data || [];
      
      // For marketplace, filter local content to only public/active items
      const localContent = this.getLocalContent().filter(
        item => item.visibility === 'public' && item.status === 'active'
      );
      
      // Include marketplace-appropriate mock content (public/active)
      const filteredMock = mockContent.filter(
        item => item.visibility === 'public' && item.status === 'active'
      );
      
      // Debug output
      console.log('API Content for marketplace:', apiContent.length);
      console.log('Local Content for marketplace:', localContent.length);
      console.log('Mock Content for marketplace:', filteredMock.length);
      
      return this.deduplicateContent([...apiContent, ...localContent, ...filteredMock]);
    } catch (error) {
      console.warn('API unavailable, returning filtered local and mock content:', error);
      
      // For marketplace, filter local content to only public/active items
      const localContent = this.getLocalContent().filter(
        item => item.visibility === 'public' && item.status === 'active'
      );
      
      // Include marketplace-appropriate mock content (public/active)
      const filteredMock = mockContent.filter(
        item => item.visibility === 'public' && item.status === 'active'
      );
      
      // Debug output
      console.log('Local Content for marketplace (fallback):', localContent.length);
      console.log('Mock Content for marketplace (fallback):', filteredMock.length);
      
      return this.deduplicateContent([...localContent, ...filteredMock]);
    }
  }

  async updateContentStatus(id: string, status: Content['status']): Promise<void> {
    try {
      await axios.patch(`${this.baseUrl}/${id}/status`, { status });
    } catch (error) {
      console.warn('API unavailable, updating local content status:', error);
      
      // Update status in local content
      const localContent = this.getLocalContent();
      const contentIndex = localContent.findIndex(item => item.id === id);
      
      if (contentIndex >= 0) {
        localContent[contentIndex].status = status;
        localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(localContent));
      }
    }
  }

  async updateContentVisibility(id: string, visibility: Content['visibility']): Promise<void> {
    try {
      await axios.patch(`${this.baseUrl}/${id}/visibility`, { visibility });
    } catch (error) {
      console.warn('API unavailable, updating local content visibility:', error);
      
      // Update visibility in local content
      const localContent = this.getLocalContent();
      const contentIndex = localContent.findIndex(item => item.id === id);
      
      if (contentIndex >= 0) {
        localContent[contentIndex].visibility = visibility;
        localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(localContent));
      }
    }
  }
  
  /**
   * Tokenize content
   * @param id Content ID to tokenize
   * @param tokenizationData Tokenization parameters
   */
  async tokenizeContent(id: string, tokenizationData: any): Promise<Content | undefined> {
    try {
      // If environment is development, allow forced re-tokenization
      const forceTokenization = process.env.NODE_ENV === 'development' && 
                               tokenizationData.forceRetokenize === true;
      
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Force tokenization:', forceTokenization);
      
      if (forceTokenization) {
        console.log('Development mode: Bypassing tokenization check');
      }
      
      // Try to get the content from both local storage and API
      const localContent = this.getLocalContent();
      const content = localContent.find(c => c.id === id);
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      // Check if already tokenized (skip check if force tokenization is enabled)
      if (content.tokenized && !forceTokenization) {
        console.log('Content is already tokenized:', content);
        throw new Error('Content is already tokenized');
      }
      
      // Format rights thresholds for blockchain 
      const rightsThresholds = tokenizationData.rightsThresholds || [];

      // Create token on blockchain
      try {
        // Check if MetaMask is available
        if (!(window as any).ethereum) {
          console.error('MetaMask not detected. Cannot create token.');
          throw new Error('MetaMask not detected. Please install MetaMask to create tokens.');
        }
        
        // Log every step of the process for better debugging
        console.log('Starting token creation process with parameters:', {
          contentId: id,
          initialSupply: tokenizationData.initialSupply,
          title: content.title,
          description: content.description,
          rightsThresholds: rightsThresholds,
          royaltyPercentage: tokenizationData.royaltyPercentage
        });
        
        // Inform user to check MetaMask
        console.log('Please check MetaMask for a transaction confirmation popup');
        
        const txHash = await blockchainService.createToken(
          id,
          tokenizationData.initialSupply,
          {
            contentId: id,
            title: content.title,
            description: content.description,
            rightsThresholds: rightsThresholds
          },
          tokenizationData.royaltyPercentage
        );
        
        console.log('Token created on blockchain, transaction hash:', txHash);
        
        // Verify token creation by checking creator's balance
        const wallet = this.getConnectedWalletAddress();
        if (wallet) {
          console.log(`Verifying token balance for creator wallet: ${wallet}`);
          const balance = await blockchainService.getTokenBalance(wallet, id);
          console.log(`Creator's token balance after creation: ${balance}`);
          
          if (balance === 0) {
            console.error('Token creation transaction succeeded but balance is 0');
            throw new Error('Token creation failed: Creator received 0 tokens. Please try again.');
          }
          
          if (balance < tokenizationData.initialSupply) {
            console.warn(`Creator only received ${balance} tokens out of ${tokenizationData.initialSupply} requested`);
          }
        }
        
        // Update content metadata
        const updatedContent = {
          ...content,
          tokenized: true,
          tokenId: id, // In a real implementation, this would be the token ID from the blockchain
          price: tokenizationData.price,
          available: tokenizationData.initialSupply,
          totalSupply: tokenizationData.initialSupply,
          rightsThresholds: rightsThresholds,
          status: 'active',
          visibility: 'public'
        };
        
        // Update content in API or local storage
        const response = await axios.put<ApiResponse<Content>>(
          `${this.baseUrl}/${id}`, 
          updatedContent
        );
        
        // If API call succeeded, return updated content
        console.log('Content updated with tokenization info:', response.data.data);
        return response.data.data;
      } catch (blockchainError) {
        console.error('Error creating token on blockchain:', blockchainError);
        
        // Add more specific error details
        if (blockchainError instanceof Error) {
          // Check for MetaMask errors
          if (blockchainError.message.includes('user denied transaction') || 
              blockchainError.message.includes('User denied')) {
            console.warn('User rejected the MetaMask transaction');
            throw new Error('Token creation cancelled: You rejected the transaction in MetaMask. Please try again if this was unintended.');
          } else if (blockchainError.message.includes('0 tokens')) {
            throw new Error('Token creation failed: Creator received 0 tokens. This may be due to a blockchain issue or contract configuration problem. Please try again.');
          } else if (blockchainError.message.includes('MetaMask not available')) {
            throw new Error('MetaMask not available. Please install MetaMask to create tokens.');
          }
        }
        
        // Re-throw the error to be handled by the caller
        throw blockchainError;
      }
    } catch (error) {
      console.error('Error tokenizing content:', error);
      throw error;
    }
  }
  
  // Helper function to deduplicate content by ID
  private deduplicateContent(contentArray: Content[]): Content[] {
    const seen = new Map<string, Content>();
    
    // Preference: API content > local content > mock content
    // In case of duplicates, the last one added (using the above preference) will be kept
    contentArray.forEach(content => {
      if (content.id) {
        // For any content with the same ID as Big Buck Bunny but NOT from the mock list,
        // ensure it has a unique ID to prevent merging
        if (content.id === 'big-buck-bunny' && 
            content.mainFileCid !== mockContent[0].mainFileCid) {
          content.id = `${content.id}-${Date.now()}`;
        }
        seen.set(content.id, content);
      }
    });
    
    return Array.from(seen.values());
  }

  // Purchase content token
  async purchaseToken(contentId: string, quantity: number): Promise<boolean> {
    try {
      console.log(`ContentService: Purchasing token for content ID ${contentId}, quantity: ${quantity}`);
      
      // Get the content
      const contentData = await this.getContentById(contentId);
      if (!contentData) {
        console.error('ContentService: Failed to find content');
        throw new Error('Content not found');
      }
      
      console.log(`ContentService: Content data for purchase:`, contentData);
      
      // Get current user's wallet address
      const walletAddress = this.getConnectedWalletAddress();
      if (!walletAddress) {
        console.error('ContentService: No wallet connected for purchase');
        throw new Error('No wallet connected');
      }
      
      console.log(`ContentService: Using wallet address for purchase: ${walletAddress}`);

      // Use the blockchain service for the actual purchase
      if (window.ethereum) {
        try {
          console.log('ContentService: Initiating blockchain transaction via wallet...');
          
          // Get price from content data
          const price = contentData.price || 0.01;
          
          // Use blockchainService for the actual purchase
          const { blockchainService } = await import('./blockchain.service');
          
          // This will throw an error if the purchase fails
          const success = await blockchainService.purchaseTokens(contentId, quantity, price);
          
          if (!success) {
            console.error('ContentService: Blockchain purchase returned failure');
            throw new Error('Blockchain purchase failed');
          }
          
          // Record the purchase details in local storage for the demo
          this.recordContentPurchaseInLocalStorage(contentData, quantity, walletAddress);
          
          // Clear the key cache to force fresh verification
          console.log('ContentService: Clearing key cache for purchased content');
          const { keyManagementService } = await import('./keyManagement.service');
          keyManagementService.clearKeyCache(contentId);
          
          // Initialize a timer to verify token ownership after purchase
          // This helps ensure immediate verification works by giving the blockchain transaction time
          setTimeout(async () => {
            try {
              console.log('ContentService: Post-purchase verification check');
              
              // Try to verify ownership
              const ownership = await this.checkContentOwnership(contentId, true);
              console.log(`ContentService: Post-purchase ownership check: ${ownership.owned ? 'Success' : 'Failed'}`);
              
              // If ownership verification succeeded, ensure key is available
              if (ownership.owned) {
                const { keyManagementService } = await import('./keyManagement.service');
                const contentCid = contentData.mainFileCid;
                
                if (contentCid) {
                  console.log(`ContentService: Pre-caching content key for ${contentCid}`);
                  const contentKey = await keyManagementService.getContentKey(contentId, walletAddress);
                  console.log(`ContentService: Content key retrieval ${contentKey ? 'successful' : 'failed'}`);
                }
              }
            } catch (error) {
              console.error('ContentService: Error in post-purchase verification:', error);
            }
          }, 2000);
          
          return true;
        } catch (error) {
          console.error('ContentService: Error processing blockchain transaction:', error);
          throw error;
        }
      } else {
        console.log('ContentService: Window.ethereum not available, using fallback');
        
        // Fallback to simple purchase recording for demo without MetaMask
        this.recordContentPurchaseInLocalStorage(contentData, quantity, walletAddress);
        
        return true;
      }
    } catch (error) {
      console.error('ContentService: Error in purchaseToken:', error);
      throw error;
    }
  }
  
  /**
   * Record content purchase in local storage for demo purposes
   * 
   * @param contentData Content data
   * @param quantity Quantity purchased
   * @param walletAddress Wallet address
   * @private
   */
  private recordContentPurchaseInLocalStorage(contentData: Content, quantity: number, walletAddress: string): void {
    try {
      console.log('ContentService: Recording content purchase in local storage');
      
      // Record transaction in buyer's wallet
      localStorage.setItem(
        `transaction_${Date.now()}`, 
        JSON.stringify({
          type: 'purchase',
          from: walletAddress,
          to: contentData.creatorAddress,
          value: ((contentData.price || 0.01) * quantity).toFixed(4),
          pricePerToken: (contentData.price || 0.01),
          quantity: quantity,
          contentId: contentData.id,
          timestamp: new Date().toISOString()
        })
      );
      
      // Record the purchase in local storage
      this.recordContentPurchase(contentData, quantity);
      
    } catch (error) {
      console.error('ContentService: Error recording purchase in local storage:', error);
    }
  }

  // Get purchased content for the user
  async getPurchasedContent(): Promise<PurchasedContent[]> {
    try {
      return this.getLocalPurchasedContent();
    } catch (error) {
      console.error('Error getting purchased content:', error);
      return [];
    }
  }
  
  // Helper to get purchased content from local storage
  private getLocalPurchasedContent(): PurchasedContent[] {
    try {
      const localPurchased = localStorage.getItem(LOCAL_PURCHASED_CONTENT_KEY);
      return localPurchased ? JSON.parse(localPurchased) : [];
    } catch (error) {
      console.error('Error retrieving local purchased content:', error);
      return [];
    }
  }

  /**
   * Check if user owns content by checking token balance
   * This will check the blockchain if a wallet is connected,
   * otherwise fall back to local storage
   * 
   * @param contentId Content ID to check
   * @param forceRefresh Force a fresh check without using cached data
   * @returns An object containing ownership status and quantity
   */
  async checkContentOwnership(contentId: string, forceRefresh: boolean = false): Promise<{ owned: boolean, quantity: number }> {
    try {
      // Get wallet info
      const walletAddress = this.getConnectedWalletAddress();
      
      console.log(`ContentService: Checking ownership for content ${contentId}, wallet: ${walletAddress}, forceRefresh: ${forceRefresh}`);
      
      // Look for cached result - use only if not forcing refresh
      const cacheKey = `ownership_${contentId}_${walletAddress}`;
      if (!forceRefresh && walletAddress) {
        const cachedResult = localStorage.getItem(cacheKey);
        if (cachedResult) {
          const parsed = JSON.parse(cachedResult);
          const cacheAge = Date.now() - parsed.timestamp;
          
          // Use cache if it's less than 1 minute old
          if (cacheAge < 60000) {
            console.log(`ContentService: Using cached ownership result (${cacheAge}ms old):`, parsed.result);
            return parsed.result;
          }
        }
      }
      
      // If connected to a blockchain wallet, check token ownership directly
      if (walletAddress && blockchainService.isInitialized()) {
        console.log('ContentService: Checking token ownership on blockchain for', contentId);
        const tokenBalance = await blockchainService.getTokenBalance(
          walletAddress,
          contentId
        );
        
        console.log('ContentService: Token balance from blockchain:', tokenBalance);
        
        const result = {
          owned: tokenBalance > 0,
          quantity: tokenBalance
        };
        
        // Cache the result
        if (walletAddress) {
          localStorage.setItem(cacheKey, JSON.stringify({
            result,
            timestamp: Date.now()
          }));
        }
        
        return result;
      }
      
      // Fallback to local storage
      console.log('ContentService: Falling back to local storage for ownership check');
      const purchasedContent = this.getLocalPurchasedContent();
      const content = purchasedContent.find(item => item.id === contentId);
      
      const result = {
        owned: !!content,
        quantity: content?.purchaseQuantity || 0
      };
      
      console.log('ContentService: Local storage ownership result:', result);
      
      // Cache the result
      if (walletAddress) {
        localStorage.setItem(cacheKey, JSON.stringify({
          result,
          timestamp: Date.now()
        }));
      }
      
      return result;
    } catch (error) {
      console.error('ContentService: Error checking content ownership:', error);
      
      // Fallback to local storage on error
      const purchasedContent = this.getLocalPurchasedContent();
      const content = purchasedContent.find(item => item.id === contentId);
      
      return {
        owned: !!content,
        quantity: content?.purchaseQuantity || 0
      };
    }
  }
  
  /**
   * Get connected wallet address from local storage
   * This is a temporary solution until proper wallet integration
   */
  private getConnectedWalletAddress(): string | null {
    try {
      // Check if we have a connected wallet via window.ethereum
      if (window.ethereum && window.ethereum.selectedAddress) {
        return window.ethereum.selectedAddress;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }
  
  /**
   * Get rights thresholds for content from blockchain
   * Falls back to local data if blockchain is not available
   * 
   * @param contentId Content ID to get rights thresholds for
   * @returns Array of rights thresholds
   */
  async getRightsThresholds(contentId: string): Promise<{quantity: number, type: string}[]> {
    try {
      // Try to get from blockchain first
      if (blockchainService.isInitialized()) {
        const thresholds = await blockchainService.getRightsThresholds(contentId);
        if (thresholds && thresholds.length > 0) {
          return thresholds;
        }
      }
      
      // Fallback to local data
      const content = await this.getContentById(contentId);
      if (content?.metadata?.rightsThresholds) {
        return content.metadata.rightsThresholds;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting rights thresholds:', error);
      
      // Fallback to local data
      const content = await this.getContentById(contentId);
      return content?.metadata?.rightsThresholds || [];
    }
  }

  /**
   * Record content purchase in local storage
   * 
   * @param contentData Content that was purchased
   * @param quantity Quantity purchased
   * @private
   */
  private recordContentPurchase(contentData: Content, quantity: number): void {
    try {
      console.log('ContentService: Recording content purchase in local storage');
      
      // Get current purchased content
      const purchasedContent = this.getLocalPurchasedContent();
      
      // Check if already purchased
      const existingPurchase = purchasedContent.find(item => item.id === contentData.id);
      
      if (existingPurchase) {
        // Update existing purchase
        console.log('ContentService: Updating existing purchase');
        existingPurchase.purchaseQuantity += quantity;
        existingPurchase.purchaseDate = new Date().toISOString();
      } else {
        // Add new purchase
        console.log('ContentService: Adding new purchase');
        const purchase: PurchasedContent = {
          ...contentData,
          purchaseDate: new Date().toISOString(),
          purchasePrice: contentData.price || 0.01,
          purchaseQuantity: quantity
        };
        
        purchasedContent.push(purchase);
      }
      
      // Update available supply
      const updatedContent = {...contentData};
      updatedContent.available = (updatedContent.available || 0) - quantity;
      updatedContent.sales = (updatedContent.sales || 0) + quantity;
      
      // Update local content storage
      const localContent = this.getLocalContent();
      const contentIndex = localContent.findIndex(item => item.id === contentData.id);
      
      if (contentIndex >= 0) {
        localContent[contentIndex] = updatedContent;
        localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(localContent));
      }
      
      // Save purchased content
      localStorage.setItem(LOCAL_PURCHASED_CONTENT_KEY, JSON.stringify(purchasedContent));
      console.log('ContentService: Purchase recorded successfully');
    } catch (error) {
      console.error('ContentService: Error recording purchase:', error);
    }
  }
}

export const contentService = new ContentService(); 