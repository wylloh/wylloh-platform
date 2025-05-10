import axios from 'axios';

// Types
export interface Library {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  items: LibraryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LibraryItem {
  _id?: string;
  contentId: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  licenseType: 'personal' | 'commercial' | 'perpetual' | 'limited';
  licenseExpiry?: string;
  isLent: boolean;
  lentTo?: string;
  // Blockchain token data
  tokenData?: {
    tokenId: string;
    contractAddress: string;
    standard: string;
    chain: string;
    owner?: string;
    verified?: boolean;
    metadata?: any;
    ownershipVerified?: boolean;
    ownershipLastChecked?: string;
    origin?: string;
  };
}

export interface LibraryAnalytics {
  libraryId: string;
  totalValue: number;
  valueHistory: ValueHistoryEntry[];
  lendingMetrics: LendingMetrics;
  engagementMetrics: EngagementMetrics;
  lastUpdated: string;
}

export interface ValueHistoryEntry {
  date: string;
  value: number;
  change: number;
  changePercentage: number;
}

export interface LendingMetrics {
  totalLends: number;
  activeLends: number;
  averageLendDuration: number;
  lendingRevenue: number;
}

export interface EngagementMetrics {
  views: number;
  shares: number;
  uniqueViewers: number;
  averageWatchTime: number;
}

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Library service class
class LibraryService {
  // Get all libraries for the current user
  async getAllLibraries(): Promise<Library[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/libraries`);
      return response.data;
    } catch (error) {
      console.error('Error fetching libraries:', error);
      throw error;
    }
  }

  // Get a single library by ID
  async getLibraryById(libraryId: string): Promise<Library> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/libraries/${libraryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching library with ID ${libraryId}:`, error);
      throw error;
    }
  }

  // Create a new library
  async createLibrary(libraryData: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<Library> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/libraries`, libraryData);
      return response.data;
    } catch (error) {
      console.error('Error creating library:', error);
      throw error;
    }
  }

  // Update a library
  async updateLibrary(
    libraryId: string,
    libraryData: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<Library> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/libraries/${libraryId}`,
        libraryData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating library with ID ${libraryId}:`, error);
      throw error;
    }
  }

  // Delete a library
  async deleteLibrary(libraryId: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/libraries/${libraryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting library with ID ${libraryId}:`, error);
      throw error;
    }
  }

  // Get library items
  async getLibraryItems(libraryId: string): Promise<LibraryItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/libraries/${libraryId}/items`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching items for library with ID ${libraryId}:`, error);
      throw error;
    }
  }

  // Add item to library
  async addItemToLibrary(
    libraryId: string,
    itemData: {
      contentId: string;
      purchasePrice?: number;
      currentValue?: number;
      licenseType?: 'personal' | 'commercial' | 'perpetual' | 'limited';
      licenseExpiry?: string;
    }
  ): Promise<Library> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/libraries/${libraryId}/items`,
        itemData
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding item to library with ID ${libraryId}:`, error);
      throw error;
    }
  }

  // Remove item from library
  async removeItemFromLibrary(libraryId: string, contentId: string): Promise<Library> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/libraries/${libraryId}/items/${contentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error removing item ${contentId} from library ${libraryId}:`, error);
      throw error;
    }
  }

  // Update item in library
  async updateItemInLibrary(
    libraryId: string,
    contentId: string,
    itemData: {
      currentValue?: number;
      licenseType?: 'personal' | 'commercial' | 'perpetual' | 'limited';
      licenseExpiry?: string;
    }
  ): Promise<Library> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/libraries/${libraryId}/items/${contentId}`,
        itemData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating item ${contentId} in library ${libraryId}:`, error);
      throw error;
    }
  }

  // Lend item
  async lendItem(
    itemId: string,
    lendData: {
      borrowerEmail: string;
      duration: number;
      price?: number;
    }
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/libraries/items/${itemId}/lend`,
        lendData
      );
      return response.data;
    } catch (error) {
      console.error(`Error lending item ${itemId}:`, error);
      throw error;
    }
  }

  // Return lent item
  async returnItem(itemId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/libraries/items/${itemId}/return`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error(`Error returning item ${itemId}:`, error);
      throw error;
    }
  }

  // Get lending history
  async getLendingHistory(itemId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/libraries/items/${itemId}/lending-history`
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting lending history for item ${itemId}:`, error);
      throw error;
    }
  }

  // Get library analytics
  async getLibraryAnalytics(libraryId: string, period?: string): Promise<LibraryAnalytics> {
    try {
      const url = period
        ? `${API_BASE_URL}/api/library-analytics/${libraryId}?period=${period}`
        : `${API_BASE_URL}/api/library-analytics/${libraryId}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching analytics for library ${libraryId}:`, error);
      throw error;
    }
  }

  // Get library value trends
  async getLibraryValueTrends(libraryId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/library-analytics/${libraryId}/trends`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching value trends for library ${libraryId}:`, error);
      throw error;
    }
  }
}

export const libraryService = new LibraryService();
export default libraryService; 