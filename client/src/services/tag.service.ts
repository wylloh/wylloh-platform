import axios from 'axios';
import { Tag, TagCategory, TagWithCategory, TagSuggestion, TagFilter } from '../types/Tag';
import { API_BASE_URL } from '../config';

/**
 * Service for tag management operations
 */
class TagService {
  /**
   * Base API URL for tag operations
   */
  private baseUrl = `${API_BASE_URL}/v1/tags`;
  
  /**
   * Base API URL for tag category operations
   */
  private categoryUrl = `${API_BASE_URL}/v1/tag-categories`;
  
  /**
   * Get all tags with optional filtering
   * @param {Object} options - Filter options
   * @returns {Promise<TagWithCategory[]>} - Array of tags with category info
   */
  async getTags(options?: { 
    categoryId?: string; 
    search?: string; 
    limit?: number;
    sort?: 'name' | 'usage' | 'created';
    order?: 'asc' | 'desc';
  }): Promise<TagWithCategory[]> {
    try {
      const params = new URLSearchParams();
      
      if (options?.categoryId) {
        params.append('categoryId', options.categoryId);
      }
      
      if (options?.search) {
        params.append('search', options.search);
      }
      
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      
      if (options?.sort) {
        params.append('sort', options.sort);
      }
      
      if (options?.order) {
        params.append('order', options.order);
      }
      
      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }
  
  /**
   * Get a single tag by ID
   * @param {string} tagId - Tag ID
   * @returns {Promise<TagWithCategory>} - Tag with category info
   */
  async getTag(tagId: string): Promise<TagWithCategory> {
    try {
      const response = await axios.get(`${this.baseUrl}/${tagId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tag ${tagId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new tag
   * @param {Partial<Tag>} tagData - Tag data to create
   * @returns {Promise<Tag>} - Created tag
   */
  async createTag(tagData: Partial<Tag>): Promise<Tag> {
    try {
      const response = await axios.post(this.baseUrl, tagData);
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing tag
   * @param {string} tagId - Tag ID to update
   * @param {Partial<Tag>} tagData - Tag data to update
   * @returns {Promise<Tag>} - Updated tag
   */
  async updateTag(tagId: string, tagData: Partial<Tag>): Promise<Tag> {
    try {
      const response = await axios.put(`${this.baseUrl}/${tagId}`, tagData);
      return response.data;
    } catch (error) {
      console.error(`Error updating tag ${tagId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a tag
   * @param {string} tagId - Tag ID to delete
   * @returns {Promise<void>}
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${tagId}`);
    } catch (error) {
      console.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all content using a specific tag
   * @param {string} tagId - Tag ID
   * @returns {Promise<any[]>} - Array of content items
   */
  async getContentByTag(tagId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/${tagId}/content`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching content for tag ${tagId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all tag categories
   * @returns {Promise<TagCategory[]>} - Array of tag categories
   */
  async getCategories(): Promise<TagCategory[]> {
    try {
      const response = await axios.get(this.categoryUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching tag categories:', error);
      throw error;
    }
  }
  
  /**
   * Get a single tag category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<TagCategory>} - Tag category
   */
  async getCategory(categoryId: string): Promise<TagCategory> {
    try {
      const response = await axios.get(`${this.categoryUrl}/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tag category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new tag category
   * @param {Partial<TagCategory>} categoryData - Category data to create
   * @returns {Promise<TagCategory>} - Created category
   */
  async createCategory(categoryData: Partial<TagCategory>): Promise<TagCategory> {
    try {
      const response = await axios.post(this.categoryUrl, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating tag category:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing tag category
   * @param {string} categoryId - Category ID to update
   * @param {Partial<TagCategory>} categoryData - Category data to update
   * @returns {Promise<TagCategory>} - Updated category
   */
  async updateCategory(categoryId: string, categoryData: Partial<TagCategory>): Promise<TagCategory> {
    try {
      const response = await axios.put(`${this.categoryUrl}/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating tag category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a tag category
   * @param {string} categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await axios.delete(`${this.categoryUrl}/${categoryId}`);
    } catch (error) {
      console.error(`Error deleting tag category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get tag suggestions for content
   * @param {string} contentId - Content ID to get suggestions for
   * @returns {Promise<TagSuggestion[]>} - Array of tag suggestions
   */
  async getSuggestions(contentId: string): Promise<TagSuggestion[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/content/${contentId}/tag-suggestions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tag suggestions for content ${contentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save a tag filter
   * @param {TagFilter} filter - Filter to save
   * @returns {Promise<TagFilter>} - Saved filter with ID
   */
  async saveFilter(filter: TagFilter): Promise<TagFilter> {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/tag-filters`, filter);
      return response.data;
    } catch (error) {
      console.error('Error saving tag filter:', error);
      throw error;
    }
  }
  
  /**
   * Get saved tag filters
   * @returns {Promise<TagFilter[]>} - Array of saved filters
   */
  async getSavedFilters(): Promise<TagFilter[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/tag-filters`);
      return response.data;
    } catch (error) {
      console.error('Error fetching saved tag filters:', error);
      throw error;
    }
  }
  
  /**
   * Delete a saved tag filter
   * @param {string} filterId - Filter ID to delete
   * @returns {Promise<void>}
   */
  async deleteFilter(filterId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/v1/tag-filters/${filterId}`);
    } catch (error) {
      console.error(`Error deleting tag filter ${filterId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get popular tags
   * @param {number} limit - Maximum number of tags to return
   * @returns {Promise<Tag[]>} - Array of popular tags
   */
  async getPopularTags(limit: number = 20): Promise<Tag[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      throw error;
    }
  }
}

export const tagService = new TagService();
export default tagService; 