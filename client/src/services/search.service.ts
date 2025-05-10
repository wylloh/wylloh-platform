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
  // Create sample data based on the search query and filters
  const results: SearchResult[] = [];
  
  // Genres we'll use for sample data
  const genres = ['Action', 'Comedy', 'Drama', 'Documentary', 'Sci-Fi', 'Horror', 'Romance', 'Thriller'];
  
  // Blockchains we'll use for sample data
  const blockchains = ['Ethereum', 'Polygon', 'Solana', 'Binance Smart Chain'];
  const tokenStandards = ['ERC-721', 'ERC-1155', 'SPL', 'BEP-721'];
  
  // Create 20 sample results
  for (let i = 1; i <= 20; i++) {
    // Randomize some values for variety
    const genre = [genres[Math.floor(Math.random() * genres.length)]];
    if (Math.random() > 0.7) {
      genre.push(genres[Math.floor(Math.random() * genres.length)]);
    }
    
    let year = 2015 + Math.floor(Math.random() * 9); // 2015-2023
    const price = Math.round(Math.random() * 1000) / 10; // 0-100 with one decimal
    const rating = 3 + Math.random() * 2; // 3-5 stars
    const reviews = Math.floor(Math.random() * 1000); // 0-1000 reviews
    
    // Determine availability
    const availabilityOptions = ['forSale', 'forLending', 'owned', 'unavailable'];
    const availability = availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)] as 'forSale' | 'forLending' | 'owned' | 'unavailable';
    
    // Create token data for some items
    let token = undefined;
    if (Math.random() > 0.3) {
      const blockchainIdx = Math.floor(Math.random() * blockchains.length);
      token = {
        tokenId: `${Math.floor(Math.random() * 10000)}`,
        contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        standard: tokenStandards[blockchainIdx],
        chain: blockchains[blockchainIdx],
        owner: `0x${Math.random().toString(16).substring(2, 42)}`,
        metadata: {
          attributes: [
            { trait_type: 'Quality', value: Math.random() > 0.5 ? 'HD' : '4K' },
            { trait_type: 'Length', value: `${Math.floor(Math.random() * 180) + 30} min` }
          ]
        }
      };
    }
    
    // If filters are specified, make sure some results match the filters
    if (filters.genre && filters.genre.length > 0 && i <= 10) {
      genre[0] = filters.genre[0];
    }
    
    if (filters.releaseYear && i <= 5) {
      if (filters.releaseYear.min) {
        // Ensure some results match the min year filter
        const minYear = filters.releaseYear.min;
        const maxYear = filters.releaseYear.max || 2023;
        const range = maxYear - minYear;
        const adjustedYear = minYear + Math.floor(Math.random() * range);
        // Make sure at least one result is exactly at the minimum
        if (i === 1) {
          year = minYear;
        } else {
          year = adjustedYear;
        }
      }
    }
    
    // Make the title include the search query for some results
    let title = '';
    if (i <= 5 && query) {
      title = `${query} ${i}: The Movie`;
    } else {
      const titles = [
        'The Lost Kingdom',
        'Future World',
        'Chronicles of Tomorrow',
        'Eternal Memories',
        'Digital Horizons',
        'Silent Echo',
        'Mystic Journey',
        'Parallel Lives',
        'Quantum Leap',
        'Celestial Dreams'
      ];
      title = titles[Math.floor(Math.random() * titles.length)] + ' ' + i;
    }
    
    // Push the result
    results.push({
      contentId: `content-${i}`,
      title,
      description: `This is a sample description for ${title}. It's a ${genre.join('/')} movie released in ${year}.`,
      thumbnailUrl: `https://source.unsplash.com/random/800x450?movie&sig=${i}`,
      creator: `Director ${String.fromCharCode(65 + (i % 26))}. ${String.fromCharCode(65 + ((i + 10) % 26))}`,
      releaseYear: year,
      genre,
      averageRating: rating,
      totalReviews: reviews,
      price: availability === 'forSale' ? price : undefined,
      availability,
      blockchain: token?.chain,
      token
    });
  }
  
  // Filter results based on search parameters
  let filteredResults = [...results];
  
  // Apply content filters
  if (filters.genre && filters.genre.length > 0) {
    filteredResults = filteredResults.filter(result => 
      result.genre.some(g => filters.genre?.includes(g))
    );
  }
  
  if (filters.releaseYear) {
    if (filters.releaseYear.min) {
      filteredResults = filteredResults.filter(result => result.releaseYear >= (filters.releaseYear?.min || 0));
    }
    if (filters.releaseYear.max) {
      filteredResults = filteredResults.filter(result => result.releaseYear <= (filters.releaseYear?.max || 3000));
    }
  }
  
  if (filters.availability && filters.availability !== 'all') {
    filteredResults = filteredResults.filter(result => result.availability === filters.availability);
  }
  
  if (filters.priceRange) {
    if (filters.priceRange.min !== undefined) {
      filteredResults = filteredResults.filter(result => 
        (result.price || 0) >= (filters.priceRange?.min || 0)
      );
    }
    if (filters.priceRange.max !== undefined) {
      filteredResults = filteredResults.filter(result => 
        (result.price || 0) <= (filters.priceRange?.max || Infinity)
      );
    }
  }
  
  if (filters.blockchain) {
    filteredResults = filteredResults.filter(result => 
      result.blockchain === filters.blockchain
    );
  }
  
  if (filters.tokenStandard) {
    filteredResults = filteredResults.filter(result => 
      result.token?.standard === filters.tokenStandard
    );
  }
  
  // Sort results by the selected ordering
  if (filters.orderBy) {
    switch (filters.orderBy) {
      case 'price':
        filteredResults.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'date':
        filteredResults.sort((a, b) => b.releaseYear - a.releaseYear);
        break;
      case 'popularity':
        filteredResults.sort((a, b) => b.averageRating - a.averageRating);
        break;
      // For relevance, we'll keep the original order which "matches" the query
      case 'relevance':
      default:
        break;
    }
  }
  
  // If query is provided, prioritize exact matches in the title
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredResults.sort((a, b) => {
      const aIncludes = a.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
      const bIncludes = b.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
      return bIncludes - aIncludes;
    });
  }
  
  return {
    results: filteredResults.slice(0, 10), // Only return first 10 for pagination
    totalResults: filteredResults.length,
    currentPage: 1,
    totalPages: Math.ceil(filteredResults.length / 10),
    filters: {
      availableGenres: genres,
      yearRange: { min: 2015, max: 2023 },
      priceRange: { min: 0, max: 100 },
      blockchains,
      tokenStandards
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