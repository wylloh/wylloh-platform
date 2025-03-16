import axios from 'axios';
import { API_BASE_URL } from '../config';

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

// Local storage key for user-created content when API is unavailable
const LOCAL_CONTENT_KEY = 'wylloh_local_content';

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
}

export const contentService = new ContentService(); 