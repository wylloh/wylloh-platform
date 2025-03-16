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
  visibility: 'public' | 'private';
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
    metadata: {},
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
    metadata: {},
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
    metadata: {},
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

class ContentService {
  private readonly baseUrl = `${API_BASE_URL}/content`;

  async getAllContent(): Promise<Content[]> {
    try {
      const response = await axios.get<ApiResponse<Content[]>>(this.baseUrl);
      return [...mockContent, ...(response.data.data || [])];
    } catch (error) {
      console.warn('API unavailable, returning mock data:', error);
      return mockContent;
    }
  }

  async getContentById(id: string): Promise<Content | undefined> {
    try {
      const response = await axios.get<ApiResponse<Content>>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.warn('API unavailable, returning mock data:', error);
      return mockContent.find(content => content.id === id);
    }
  }

  async getCreatorContent(): Promise<Content[]> {
    try {
      const response = await axios.get<ApiResponse<Content[]>>(`${this.baseUrl}/creator`);
      return [...mockContent, ...(response.data.data || [])];
    } catch (error) {
      console.warn('API unavailable, returning mock data:', error);
      return mockContent;
    }
  }

  async getMarketplaceContent(): Promise<Content[]> {
    try {
      const response = await axios.get<ApiResponse<Content[]>>(`${this.baseUrl}/marketplace`);
      return [...mockContent, ...(response.data.data || [])];
    } catch (error) {
      console.warn('API unavailable, returning mock data:', error);
      return mockContent;
    }
  }

  async updateContentStatus(id: string, status: Content['status']): Promise<void> {
    try {
      await axios.patch(`${this.baseUrl}/${id}/status`, { status });
    } catch (error) {
      console.warn('API unavailable, status update simulated:', error);
    }
  }

  async updateContentVisibility(id: string, visibility: Content['visibility']): Promise<void> {
    try {
      await axios.patch(`${this.baseUrl}/${id}/visibility`, { visibility });
    } catch (error) {
      console.warn('API unavailable, visibility update simulated:', error);
    }
  }
}

export const contentService = new ContentService(); 