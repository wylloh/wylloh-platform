import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ethers } from 'ethers';
import { blockchainService } from './blockchain.service';
import { keyManagementService } from './keyManagement.service';
import { cdnService } from './cdn.service';
import { getIpfsUrl, getProjectIpfsUrl, getStreamUrl, getThumbnailUrl as getOriginalThumbnailUrl } from '../utils/ipfs';

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

// Production content data - minimal examples for demonstration
const productionContent: Content[] = [
  // This would typically be populated from your backend API
  // For now, keeping empty for production
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
        ...productionContent
      ]);
      
      return combinedContent;
    } catch (error) {
      console.warn('API unavailable, returning local and mock data:', error);
      return this.deduplicateContent([...this.getLocalContent(), ...productionContent]);
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
      return productionContent.find(content => content.id === id);
    }
  }

  async getCreatorContent(): Promise<Content[]> {
    try {
      const response = await axios.get<ApiResponse<Content[]>>(`${this.baseUrl}/creator`);
      const apiContent = response.data.data || [];
      const localContent = this.getLocalContent();
      
      // For demo purposes, include mock content in creator's content
      return this.deduplicateContent([...apiContent, ...localContent, ...productionContent]);
    } catch (error) {
      console.warn('API unavailable, returning local and mock content:', error);
      return this.deduplicateContent([...this.getLocalContent(), ...productionContent]);
    }
  }

  /**
   * Get content available in the store
   */
  async getStoreContent(): Promise<Content[]> {
    try {
      // Attempt to get data from API
      const response = await axios.get(`${this.baseUrl}/store`);
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, using local content for store:', error);
      
      // Filter local content to only show active, public content
      const localContent = this.getLocalContent();
      return localContent.filter(item => 
        item.status === 'active' && 
        item.visibility === 'public'
      );
    }
  }

  /**
   * @deprecated Use getStoreContent() instead
   */
  async getMarketplaceContent(): Promise<Content[]> {
    return this.getStoreContent();
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
      // Check for demo/development mode to allow forced re-tokenization
      const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';
      const forceTokenization = (process.env.NODE_ENV === 'development' || isDemoMode) && 
                               tokenizationData.forceRetokenize === true;
      
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Demo Mode:', isDemoMode);
      console.log('Force tokenization enabled:', forceTokenization);
      console.log('forceRetokenize flag value:', tokenizationData.forceRetokenize);
      
      if (forceTokenization) {
        console.log('Development/Demo mode: Bypassing tokenization check');
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
        // Make sure blockchain service is initialized
        if (!blockchainService.isInitialized()) {
          console.error('Blockchain service not initialized. Attempting to initialize...');
          blockchainService.initialize();
          
          if (!blockchainService.isInitialized()) {
            throw new Error('Failed to initialize blockchain service. Please check your network connection and reload the page.');
          }
        }
        
        // Check if MetaMask is available
        if (!(window as any).ethereum) {
          console.error('MetaMask not detected. Cannot create token.');
          throw new Error('MetaMask not detected. Please install MetaMask to create tokens.');
        }
        
        // Get wallet address for verification after token creation
        const walletAddress = this.getConnectedWalletAddress();
        if (!walletAddress) {
          console.warn('No wallet address available for verification after token creation');
        } else {
          console.log(`Will verify token ownership for wallet: ${walletAddress}`);
        }
        
        // Log every step of the process for better debugging
        console.log('Starting token creation process with parameters:', {
          contentId: id,
          initialSupply: tokenizationData.initialSupply,
          title: content.title,
          description: content.description,
          rightsThresholds: rightsThresholds,
          royaltyPercentage: tokenizationData.royaltyPercentage,
          forceRetokenize: forceTokenization
        });
        
        // Inform user to check MetaMask
        console.log('Please check MetaMask for a transaction confirmation popup');
        
        // Create film contract through factory
        let filmContractAddress: string;
        try {
          // Extract rights threshold quantities
          const thresholdQuantities = rightsThresholds.map((rt: {quantity: number, type: string}) => rt.quantity);
          
          filmContractAddress = await blockchainService.createFilmContract(
            id, // filmId
            content.title, // title
            walletAddress || content.creatorAddress, // creator
            tokenizationData.initialSupply, // maxSupply
            thresholdQuantities, // rightsThresholds
            `https://api.wylloh.com/films/${id}/` // baseURI
          );
        
        console.log('Film contract created at address:', filmContractAddress);
        
          if (!filmContractAddress) {
            throw new Error('Film contract creation failed - no contract address returned');
          }
          
          // Verify token creation immediately
          // This step is crucial - don't proceed without verification
          console.log('Attempting to verify token creation');
          
          // Wait for blockchain state to update
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Attempt to verify the token was created properly
          const verification = await this.verifyTokenCreation(id, walletAddress || undefined);
          
          if (!verification.success) {
            console.error('Token verification failed immediately after creation:', verification);
            
            // Clean up - flag the content as having a tokenization failure
            localStorage.setItem(`tokenization_failed_${id}`, 'true');
            
            // Create a partial update that doesn't mark it as fully tokenized
            const partialContent = {
              ...content,
              status: 'active' as const,
              visibility: 'public' as const,
              creatorAddress: walletAddress || content.creatorAddress,
              filmContractAddress: filmContractAddress,
              // Note we're not setting tokenized: true here
            };
            
            // Save to local storage 
            this.saveLocalContent(partialContent);
            
            throw new Error('Token creation transaction submitted but verification failed. The transaction may be pending.');
          }
          
          console.log('Token verified successfully:', verification);
          
          // Only if verification succeeded, update content metadata with tokenization details
        const updatedContent = {
          ...content,
            tokenized: true, // Only set this to true when verified
            tokenId: id,
          price: tokenizationData.price,
          available: tokenizationData.initialSupply,
          totalSupply: tokenizationData.initialSupply,
          rightsThresholds: rightsThresholds,
                      status: 'active' as const,
            visibility: 'public' as const,
            creatorAddress: walletAddress || content.creatorAddress,
            filmContractAddress: filmContractAddress
          };
          
          // Save to local storage and return
          this.saveLocalContent(updatedContent);
          
          // Remove any failure flag if it existed
          localStorage.removeItem(`tokenization_failed_${id}`);
          
          return updatedContent;
        } catch (tokenCreationError) {
          console.error('Token creation error:', tokenCreationError);
          
          // Check for specific error conditions
          const errorMessage = tokenCreationError instanceof Error ? tokenCreationError.message : String(tokenCreationError);
          
          if (errorMessage.includes('Transaction confirmation timeout')) {
            console.log('Token creation transaction submitted but confirmation timed out.');
            console.log('Will attempt to verify token creation anyway.');
            
            // Give the blockchain a moment to process
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check if the token was created despite the timeout
            try {
              const verificationResult = await this.verifyTokenCreation(id, walletAddress || undefined);
              
              if (verificationResult.success) {
                console.log('Token creation verified after timeout. Proceeding with tokenization.');
                
                // Update content metadata with tokenization details
            const updatedContent = {
              ...content,
              tokenized: true,
              tokenId: id,
              price: tokenizationData.price,
              available: tokenizationData.initialSupply,
              totalSupply: tokenizationData.initialSupply,
              rightsThresholds: rightsThresholds,
              status: 'active' as const,
                  visibility: 'public' as const,
                  creatorAddress: walletAddress || content.creatorAddress
            };
            
                // Save to local storage and return
            this.saveLocalContent(updatedContent);
            
                // Remove any failure flag if it existed
                localStorage.removeItem(`tokenization_failed_${id}`);
                
            return updatedContent;
              } else {
                console.error('Token verification failed after timeout:', verificationResult);
                
                // Set failure flag
                localStorage.setItem(`tokenization_failed_${id}`, 'true');
                
                throw new Error('Token creation transaction timed out and verification failed. Please check your transaction status in MetaMask.');
              }
            } catch (verificationError) {
              console.error('Error during post-timeout verification:', verificationError);
              
              // Set failure flag
              localStorage.setItem(`tokenization_failed_${id}`, 'true');
              
              throw new Error('Unable to verify token creation after timeout. Please check your transaction status in MetaMask.');
            }
          }
          
          // Set failure flag for any other errors
          localStorage.setItem(`tokenization_failed_${id}`, 'true');
          
          // Re-throw the original error
          throw tokenCreationError;
        }
      } catch (blockchainError) {
        console.error('Blockchain error during token creation:', blockchainError);
        
        // Set failure flag
        localStorage.setItem(`tokenization_failed_${id}`, 'true');
        
        // Provide more helpful error messages based on common error types
        if (blockchainError instanceof Error) {
          if (blockchainError.message.includes('MetaMask not detected')) {
            throw new Error('MetaMask not available. Please install MetaMask to create tokens.');
          } else if (blockchainError.message.includes('rejected')) {
            throw new Error('You rejected the transaction. Please approve the MetaMask transaction to create tokens.');
          } else if (blockchainError.message.includes('network') || blockchainError.message.includes('chainId')) {
            throw new Error('Network error. Please make sure MetaMask is connected to the correct network.');
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
  
  /**
   * Verify token creation was successful immediately after transaction
   * @param contentId Content ID to verify
   * @param walletAddress Wallet address of token creator
   * @returns Promise resolving to verification result
   * @private
   */
  private async verifyTokenCreation(contentId: string, walletAddress?: string): Promise<{ success: boolean, balance?: number }> {
    try {
      if (!blockchainService.isInitialized()) {
        await blockchainService.initialize();
      }
      
      // Wait briefly to give blockchain time to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify token creation using blockchain service
      const verificationResult = await blockchainService.verifyTokenCreation(contentId, walletAddress || undefined);
      
      return {
        success: verificationResult.success && verificationResult.balance > 0,
        balance: verificationResult.balance
      };
    } catch (error) {
      console.error('Error verifying token creation:', error);
      return { success: false };
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
            content.mainFileCid !== productionContent[0].mainFileCid) {
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
          let price = contentData.price;
          console.log(`ContentService: Original price from content: ${price} (type: ${typeof price})`);
          
          // Handle potentially invalid price formats
          if (price === undefined || price === null) {
            console.log('ContentService: Price is undefined/null, defaulting to 0.01');
            price = 0.01;
          } else if (typeof price === 'string') {
            if (price === '') {
              console.log('ContentService: Price is an empty string, defaulting to 0.01');
              price = 0.01;
            } else {
              // Try to convert string price to number
              try {
                price = parseFloat(price);
                if (isNaN(price)) {
                  console.log('ContentService: Price string is not a valid number, defaulting to 0.01');
                  price = 0.01;
                }
              } catch (e) {
                console.log('ContentService: Error parsing price string, defaulting to 0.01');
                price = 0.01;
              }
            }
          }
          
          console.log(`ContentService: Token price after validation: ${price} (type: ${typeof price})`);
          console.log(`ContentService: Price is a valid number: ${!isNaN(Number(price))}`);
          console.log(`ContentService: Quantity: ${quantity} (type: ${typeof quantity})`);
          
          // Ensure price is a valid number
          const validPrice = Number(price);
          if (isNaN(validPrice) || validPrice <= 0) {
            console.error(`ContentService: Invalid price: ${price}`);
            throw new Error(`Invalid price: ${price}. Price must be a positive number.`);
          }
          
          // Use blockchainService for the actual purchase
          const { blockchainService } = await import('./blockchain.service');
          
          // This will throw an error if the purchase fails
          const success = await blockchainService.purchaseTokens(contentId, quantity, validPrice);
          
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

  /**
   * Verify token creation and provide option to import to MetaMask
   * @param contentId Content ID to verify and import
   * @returns Promise resolving to verification result
   */
  async verifyAndImportToken(contentId: string): Promise<any> {
    console.log(`Verifying token for content ID: ${contentId}`);
    
    try {
      // Get the content details to find the token ID
      const content = await this.getContentById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }
      
      console.log(`Found content with title "${content.title}"`);
      
      if (!content.tokenId) {
        console.error('Content has no token ID - tokenization may have failed');
        return { verified: false, reason: 'No token ID found for content' };
      }
      
      // Make sure the blockchain service is initialized
      if (!blockchainService.isInitialized()) {
        await blockchainService.initialize();
      }
      
      // Get current wallet address
      let walletAddress = '';
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          walletAddress = accounts[0];
        } catch (error) {
          console.error('Error getting wallet address:', error);
          throw new Error('No MetaMask account available. Please connect MetaMask first.');
        }
      }
      
      if (!walletAddress) {
        throw new Error('No MetaMask account available');
      }
      
      // Get token balance for the current address
      const tokenId = content.tokenId;
      
      // Use verifyTokenCreation method as it's more robust
      const verificationResult = await blockchainService.verifyTokenCreation(tokenId, walletAddress || undefined);
      
      console.log(`Token verification result:`, verificationResult);
      
      let imported = false;
      if (verificationResult.success) {
        try {
          // Try to import the token to MetaMask
          imported = await blockchainService.addTokenToMetaMask(tokenId);
          console.log(`Token import result: ${imported ? 'success' : 'failed'}`);
        } catch (importError) {
          console.error('Failed to import token to MetaMask:', importError);
        }
      }
      
      // Return verification result
      return {
        verified: verificationResult.success,
        balance: verificationResult.balance,
        tokenId: tokenId,
        creatorAddress: walletAddress,
        contractAddress: verificationResult.tokenAddress,
        imported: imported
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  }

  // Get content streaming URL with CDN optimization
  getContentStreamingUrl(cid: string): string {
    if (!cid) return '';
    
    // Use CDN service for optimized streaming URL
    return cdnService.getStreamingUrl(cid);
  }
  
  // Get content thumbnail URL with CDN optimization
  getContentThumbnailUrl(cid: string, fallbackCid?: string): string {
    if (!cid && !fallbackCid) {
      // If no CID is provided, return a placeholder
      return 'https://via.placeholder.com/400x300?text=No+Thumbnail';
    }
    
    // Use CDN service for optimized thumbnail URL
    return cdnService.getThumbnailUrl(cid || fallbackCid || '');
  }
  
  // Get content preview URL with CDN optimization
  getContentPreviewUrl(cid: string): string {
    if (!cid) return '';
    
    // Use CDN service for optimized URL
    return cdnService.getOptimizedUrl(cid);
  }
  
  // Prefetch content for faster access
  async prefetchContent(contentId: string): Promise<void> {
    try {
      const content = await this.getContentById(contentId);
      if (!content) return;
      
      // Prefetch thumbnail for immediate display
      if (content.thumbnailCid) {
        cdnService.prefetchContent(content.thumbnailCid);
      }
      
      // Prefetch preview if available
      if (content.previewCid) {
        cdnService.prefetchContent(content.previewCid);
      }
      
      // For main content, only prefetch if user has permission
      const ownership = await this.checkContentOwnership(contentId, false);
      if (ownership.owned && content.mainFileCid) {
        cdnService.prefetchContent(content.mainFileCid);
      }
    } catch (error) {
      console.warn(`Error prefetching content ${contentId}:`, error);
    }
  }
  
  // Initialize the CDN service and prefetch popular content
  async initializeContentDelivery(): Promise<void> {
    try {
      // Initialize the CDN service
      await cdnService.initialize();
      
      // Prefetch popular content thumbnails
      const popularContent = await this.getStoreContent();
      
      // Prefetch thumbnails for top 5 popular items
      popularContent.slice(0, 5).forEach(content => {
        if (content.thumbnailCid) {
          cdnService.prefetchContent(content.thumbnailCid);
        }
      });
      
      console.log('Content delivery system initialized');
    } catch (error) {
      console.error('Error initializing content delivery:', error);
    }
  }
}

export const contentService = new ContentService(); 