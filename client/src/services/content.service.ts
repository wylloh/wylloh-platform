import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ethers } from 'ethers';

// Add custom type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
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
    metadata: { isDemo: true, demoVersion: '1.0' },
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
      
      // Create a unique ID for local content
      const newContent: Content = {
        id: `local-${Date.now()}`,
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
      
      this.saveLocalContent(newContent);
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
        item => item.status === 'active' && item.visibility === 'public'
      );
      
      // Include marketplace-appropriate mock content (public/active)
      const filteredMock = mockContent.filter(
        item => item.status === 'active' && item.visibility === 'public'
      );
      
      return this.deduplicateContent([...apiContent, ...localContent, ...filteredMock]);
    } catch (error) {
      console.warn('API unavailable, returning filtered local and mock content:', error);
      
      // For marketplace, filter local content to only public/active items
      const localContent = this.getLocalContent().filter(
        item => item.status === 'active' && item.visibility === 'public'
      );
      
      // Include marketplace-appropriate mock content (public/active)
      const filteredMock = mockContent.filter(
        item => item.status === 'active' && item.visibility === 'public'
      );
      
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
  
  async tokenizeContent(id: string, tokenizationData: any): Promise<Content | undefined> {
    try {
      const response = await axios.post<ApiResponse<Content>>(`${this.baseUrl}/${id}/tokenize`, tokenizationData);
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, tokenizing local content:', error);
      
      // Update tokenization info in local content
      const localContent = this.getLocalContent();
      const contentIndex = localContent.findIndex(item => item.id === id);
      
      if (contentIndex >= 0) {
        // Mock tokenization process
        const tokenId = `0x${Math.random().toString(16).substring(2, 10)}`;
        
        localContent[contentIndex] = {
          ...localContent[contentIndex],
          tokenized: true,
          tokenId,
          price: parseFloat(tokenizationData.initialPrice),
          available: tokenizationData.initialSupply,
          totalSupply: tokenizationData.initialSupply,
          status: 'active',
          visibility: 'public'
        };
        
        localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(localContent));
        return localContent[contentIndex];
      }
      
      return undefined;
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
      // In a real implementation, this would call the blockchain
      // For demo, we'll simulate the purchase with local storage and wallet interaction
      const contentData = await this.getContentById(contentId);
      
      if (!contentData) {
        throw new Error('Content not found');
      }
      
      // Check if content is available for purchase
      if (!contentData.tokenized) {
        throw new Error('Content is not tokenized');
      }
      
      if ((contentData.available || 0) < quantity) {
        throw new Error('Not enough tokens available');
      }
      
      // Get current purchased content
      const purchasedContent = this.getLocalPurchasedContent();
      
      // Check if already purchased
      const existingPurchase = purchasedContent.find(item => item.id === contentId);

      // Simulate blockchain transaction with window.ethereum if available
      // This would actually be using the wallet in the real implementation
      if (window.ethereum) {
        try {
          console.log('Simulating blockchain transaction via wallet...');
          
          // Get seller's address
          const sellerAddress = contentData.creatorAddress;
          
          // Get price in wei (ETH)
          const priceInWei = ethers.utils.parseEther(
            ((contentData.price || 0.01) * quantity).toString()
          );
          
          // Get accounts
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          const buyerAddress = accounts[0];
          
          // Log the transaction details for demo purposes
          console.log('Transaction details:');
          console.log('- From:', buyerAddress);
          console.log('- To:', sellerAddress);
          console.log('- Value:', ethers.utils.formatEther(priceInWei), 'ETH');
          console.log('- Content ID:', contentId);
          console.log('- Quantity:', quantity);
          
          // Request transaction - this creates a MetaMask popup
          // For demo, just simulate success
          
          // Record transaction in buyer's wallet
          localStorage.setItem(
            `transaction_${Date.now()}`, 
            JSON.stringify({
              type: 'purchase',
              from: buyerAddress,
              to: sellerAddress,
              value: ethers.utils.formatEther(priceInWei),
              contentId,
              quantity,
              timestamp: new Date().toISOString()
            })
          );
        } catch (error) {
          console.error('Error with wallet transaction:', error);
          // Continue with local storage fallback
        }
      }
      
      if (existingPurchase) {
        // Update existing purchase
        existingPurchase.purchaseQuantity += quantity;
        existingPurchase.purchaseDate = new Date().toISOString();
      } else {
        // Add new purchase
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
      const contentIndex = localContent.findIndex(item => item.id === contentId);
      
      if (contentIndex >= 0) {
        localContent[contentIndex] = updatedContent;
        localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(localContent));
      }
      
      // Save purchased content
      localStorage.setItem(LOCAL_PURCHASED_CONTENT_KEY, JSON.stringify(purchasedContent));
      
      return true;
    } catch (error) {
      console.error('Error purchasing token:', error);
      throw error;
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
}

export const contentService = new ContentService(); 