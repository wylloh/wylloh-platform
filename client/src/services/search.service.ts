import axios from 'axios';
import { LibraryItem } from './library.service';

// Types
export interface SearchFilters {
  genre?: string[];
  releaseYear?: { min?: number; max?: number };
  availability?: 'all' | 'forSale' | 'forLending' | 'owned';
  licenseType?: ('personal' | 'commercial' | 'perpetual' | 'limited')[];
  priceRange?: { min?: number; max?: number };
  orderBy?: 'relevance' | 'price' | 'date' | 'popularity';
  creator?: string;
  tokenStandard?: string;
  blockchain?: string;
}

export interface SearchResult {
  contentId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  creator: string;
  releaseYear: number;
  genre: string[];
  averageRating: number;
  totalReviews: number;
  price?: number;
  availability: 'forSale' | 'forLending' | 'owned' | 'unavailable';
  blockchain?: string;
  token?: {
    tokenId: string;
    contractAddress: string;
    standard: string;
    chain: string;
    owner: string;
    metadata: Record<string, any>;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: {
    availableGenres: string[];
    yearRange: { min: number; max: number };
    priceRange: { min: number; max: number };
    blockchains: string[];
    tokenStandards: string[];
  };
}

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Sample results for development
const generateSampleResults = (query: string, filters: SearchFilters): SearchResponse => {
  // Production-ready: Return empty results instead of fake movie titles
  return {
    results: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    filters: {
      availableGenres: [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
        'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
        'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
      ],
      yearRange: { min: 2015, max: 2024 },
      priceRange: { min: 0, max: 100 },
      blockchains: ['Ethereum', 'Polygon', 'Arbitrum'],
      tokenStandards: ['ERC-721', 'ERC-1155']
    }
  };
};

// Search service class
class SearchService {
  // Search for content
  async searchContent(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResponse> {
    try {
      // In development mode with sample data flag, return sample data
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_SAMPLE_DATA === 'true') {
        return generateSampleResults(query, filters);
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/search`, {
        params: {
          query,
          ...filters,
          page,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching content:', error);
      
      // In development, fall back to sample data
      if (process.env.NODE_ENV === 'development') {
        console.log('Using sample data for search due to error');
        return generateSampleResults(query, filters);
      }
      
      throw error;
    }
  }
  
  // Get blockchain token details for content
  async getTokenDetails(contentId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content/${contentId}/token`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching token details for content ${contentId}:`, error);
      throw error;
    }
  }
  
  // Verify token ownership for a user
  async verifyTokenOwnership(contentId: string, walletAddress: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/content/${contentId}/verify-ownership`,
        { params: { walletAddress } }
      );
      return response.data.owned;
    } catch (error) {
      console.error(`Error verifying token ownership for content ${contentId}:`, error);
      throw error;
    }
  }
  
  // Fetch trending content (based on blockchain activity and platform metrics)
  async getTrendingContent(limit: number = 10): Promise<SearchResult[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/trending`, {
        params: { limit }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching trending content:', error);
      
      // In development, return some sample results
      if (process.env.NODE_ENV === 'development') {
        return generateSampleResults('trending', {}).results.slice(0, limit);
      }
      
      throw error;
    }
  }
  
  // Search for content by blockchain/token properties
  async searchByBlockchain(
    blockchain: string,
    tokenStandard?: string,
    contractAddress?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/blockchain-search`, {
        params: {
          blockchain,
          tokenStandard,
          contractAddress,
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching by blockchain:', error);
      
      // In development, return sample data
      if (process.env.NODE_ENV === 'development') {
        return generateSampleResults('', { 
          blockchain, 
          tokenStandard: tokenStandard ? tokenStandard : undefined 
        });
      }
      
      throw error;
    }
  }
}

export const searchService = new SearchService();
export default searchService; 