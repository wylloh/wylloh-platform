import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ContentType, ContentMetadata } from './metadata.service';
import { storageService } from './storage.service';
import metadataService from './metadata.service';

// Recommendation types
export enum RecommendationType {
  PERSONALIZED = 'personalized',
  SIMILAR = 'similar',
  TRENDING = 'trending',
  GENRE_BASED = 'genre_based',
  NEW_RELEASES = 'new_releases'
}

// Recommendation result interface
export interface RecommendationResult {
  contentId: string;
  metadata: ContentMetadata;
  reason: string;
  score: number;
}

// Recommendation options interface
export interface RecommendationOptions {
  contentType?: ContentType;
  limit?: number;
  excludeIds?: string[];
  includeMetadata?: boolean;
}

// Similar content options interface
export interface SimilarContentOptions extends RecommendationOptions {
  sourceContentId: string;
  includeSameCreator?: boolean;
}

// Personalization source options
export interface PersonalizationSourceOptions {
  includeWatchHistory?: boolean;
  includeFavorites?: boolean;
  includeGenrePreferences?: boolean;
  includeExplicitRatingPreferences?: boolean;
  weightRecentActivity?: boolean;
}

/**
 * Recommendation service for providing content recommendations
 */
class RecommendationService {
  private cachedTrendingContent: Map<ContentType | 'all', RecommendationResult[]> = new Map();
  private cachedNewReleases: Map<ContentType | 'all', RecommendationResult[]> = new Map();
  private cacheExpirationTime = 30 * 60 * 1000; // 30 minutes
  private cacheTimestamps: Map<string, number> = new Map();
  
  /**
   * Get personalized recommendations for the current user
   * 
   * @param options Recommendation options
   * @param sourceOptions Personalization source options
   * @returns List of recommended content
   */
  public async getPersonalizedRecommendations(
    options: RecommendationOptions = {},
    sourceOptions: PersonalizationSourceOptions = {}
  ): Promise<RecommendationResult[]> {
    try {
      const {
        contentType,
        limit = 10,
        excludeIds = [],
        includeMetadata = true
      } = options;
      
      const {
        includeWatchHistory = true,
        includeFavorites = true,
        includeGenrePreferences = true,
        includeExplicitRatingPreferences = true,
        weightRecentActivity = true
      } = sourceOptions;
      
      // API call parameters
      const params: any = {
        limit,
        exclude_ids: excludeIds.join(','),
        include_metadata: includeMetadata,
        include_watch_history: includeWatchHistory,
        include_favorites: includeFavorites,
        include_genre_preferences: includeGenrePreferences,
        include_explicit_rating_preferences: includeExplicitRatingPreferences,
        weight_recent_activity: weightRecentActivity
      };
      
      if (contentType) {
        params.content_type = contentType;
      }
      
      // Make API request for personalized recommendations
      const response = await axios.get(`${API_BASE_URL}/api/recommendations/personalized`, { params });
      
      return response.data.recommendations;
    } catch (error) {
      console.error('RecommendationService: Error getting personalized recommendations', error);
      
      // Fallback to non-personalized trending content if API fails
      return this.getTrendingContent({
        contentType: options.contentType,
        limit: options.limit,
        excludeIds: options.excludeIds
      });
    }
  }
  
  /**
   * Get similar content recommendations based on a source content item
   * 
   * @param options Similar content options with source content ID
   * @returns List of similar content
   */
  public async getSimilarContent(options: SimilarContentOptions): Promise<RecommendationResult[]> {
    try {
      const {
        sourceContentId,
        contentType,
        limit = 6,
        excludeIds = [],
        includeMetadata = true,
        includeSameCreator = false
      } = options;
      
      if (!sourceContentId) {
        throw new Error('Source content ID is required for similar content recommendations');
      }
      
      // Check if we already have source content metadata
      let sourceMetadata: ContentMetadata | null = null;
      try {
        sourceMetadata = await metadataService.getMetadata(sourceContentId);
      } catch (error) {
        console.warn(`RecommendationService: Could not get source metadata for ${sourceContentId}`, error);
      }
      
      // API call parameters
      const params: any = {
        content_id: sourceContentId,
        limit,
        exclude_ids: [...excludeIds, sourceContentId].join(','),
        include_metadata: includeMetadata,
        include_same_creator: includeSameCreator
      };
      
      if (contentType) {
        params.content_type = contentType;
      }
      
      // Make API request for similar content
      const response = await axios.get(`${API_BASE_URL}/api/recommendations/similar`, { params });
      
      return response.data.recommendations;
    } catch (error) {
      console.error('RecommendationService: Error getting similar content', error);
      
      // Get fallback recommendations based on source content metadata
      return this.getFallbackSimilarContent(options);
    }
  }
  
  /**
   * Get trending content across the platform
   * 
   * @param options Recommendation options
   * @returns List of trending content
   */
  public async getTrendingContent(
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult[]> {
    try {
      const {
        contentType,
        limit = 10,
        excludeIds = [],
        includeMetadata = true
      } = options;
      
      const cacheKey = contentType || 'all';
      
      // Check cache first if not expired
      const cacheTimestamp = this.cacheTimestamps.get(`trending_${cacheKey}`);
      if (
        this.cachedTrendingContent.has(cacheKey) &&
        cacheTimestamp &&
        Date.now() - cacheTimestamp < this.cacheExpirationTime
      ) {
        const cachedResults = this.cachedTrendingContent.get(cacheKey) || [];
        return this.filterRecommendations(cachedResults, { limit, excludeIds });
      }
      
      // API call parameters
      const params: any = {
        limit: Math.max(limit, 20), // Get more items for caching
        include_metadata: includeMetadata
      };
      
      if (contentType) {
        params.content_type = contentType;
      }
      
      // Make API request for trending content
      const response = await axios.get(`${API_BASE_URL}/api/recommendations/trending`, { params });
      
      // Cache the results
      this.cachedTrendingContent.set(cacheKey, response.data.recommendations);
      this.cacheTimestamps.set(`trending_${cacheKey}`, Date.now());
      
      // Filter and return the results
      return this.filterRecommendations(response.data.recommendations, { limit, excludeIds });
    } catch (error) {
      console.error('RecommendationService: Error getting trending content', error);
      
      // Return empty array if API fails
      return [];
    }
  }
  
  /**
   * Get new releases
   * 
   * @param options Recommendation options
   * @returns List of new releases
   */
  public async getNewReleases(
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult[]> {
    try {
      const {
        contentType,
        limit = 10,
        excludeIds = [],
        includeMetadata = true
      } = options;
      
      const cacheKey = contentType || 'all';
      
      // Check cache first if not expired
      const cacheTimestamp = this.cacheTimestamps.get(`new_releases_${cacheKey}`);
      if (
        this.cachedNewReleases.has(cacheKey) &&
        cacheTimestamp &&
        Date.now() - cacheTimestamp < this.cacheExpirationTime
      ) {
        const cachedResults = this.cachedNewReleases.get(cacheKey) || [];
        return this.filterRecommendations(cachedResults, { limit, excludeIds });
      }
      
      // API call parameters
      const params: any = {
        limit: Math.max(limit, 20), // Get more items for caching
        include_metadata: includeMetadata
      };
      
      if (contentType) {
        params.content_type = contentType;
      }
      
      // Make API request for new releases
      const response = await axios.get(`${API_BASE_URL}/api/recommendations/new-releases`, { params });
      
      // Cache the results
      this.cachedNewReleases.set(cacheKey, response.data.recommendations);
      this.cacheTimestamps.set(`new_releases_${cacheKey}`, Date.now());
      
      // Filter and return the results
      return this.filterRecommendations(response.data.recommendations, { limit, excludeIds });
    } catch (error) {
      console.error('RecommendationService: Error getting new releases', error);
      
      // Return empty array if API fails
      return [];
    }
  }
  
  /**
   * Get recommendations based on specific genres
   * 
   * @param genres Array of genres to recommend from
   * @param options Recommendation options
   * @returns List of genre-based recommendations
   */
  public async getGenreRecommendations(
    genres: string[],
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult[]> {
    try {
      if (!genres || genres.length === 0) {
        throw new Error('At least one genre is required for genre recommendations');
      }
      
      const {
        contentType,
        limit = 10,
        excludeIds = [],
        includeMetadata = true
      } = options;
      
      // API call parameters
      const params: any = {
        genres: genres.join(','),
        limit,
        exclude_ids: excludeIds.join(','),
        include_metadata: includeMetadata
      };
      
      if (contentType) {
        params.content_type = contentType;
      }
      
      // Make API request for genre recommendations
      const response = await axios.get(`${API_BASE_URL}/api/recommendations/by-genre`, { params });
      
      return response.data.recommendations;
    } catch (error) {
      console.error('RecommendationService: Error getting genre recommendations', error);
      
      // Return trending content as fallback
      return this.getTrendingContent(options);
    }
  }
  
  /**
   * Filter recommendation results based on options
   * 
   * @param recommendations Full list of recommendations
   * @param options Filtering options
   * @returns Filtered recommendations
   */
  private filterRecommendations(
    recommendations: RecommendationResult[],
    options: { limit?: number; excludeIds?: string[] }
  ): RecommendationResult[] {
    const { limit = 10, excludeIds = [] } = options;
    
    // Filter out excluded IDs
    let filtered = recommendations;
    if (excludeIds.length > 0) {
      filtered = recommendations.filter(item => !excludeIds.includes(item.contentId));
    }
    
    // Apply limit
    return filtered.slice(0, limit);
  }
  
  /**
   * Generate fallback similar content recommendations when API fails
   * 
   * @param options Similar content options
   * @returns Fallback recommendations
   */
  private async getFallbackSimilarContent(
    options: SimilarContentOptions
  ): Promise<RecommendationResult[]> {
    try {
      const { sourceContentId, limit = 6 } = options;
      
      // Get source content metadata
      const sourceMetadata = await metadataService.getMetadata(sourceContentId);
      
      if (!sourceMetadata) {
        // No metadata available, return trending content
        return this.getTrendingContent(options);
      }
      
      // Extract genres and content type for searching
      const genres = sourceMetadata.genre || [];
      const contentType = sourceMetadata.contentType;
      
      if (genres.length === 0) {
        // No genres available, return trending within same content type
        return this.getTrendingContent({
          ...options,
          contentType
        });
      }
      
      // Search for content with similar genres
      const searchOptions: any = {
        filters: [
          {
            field: 'genre',
            operator: 'in',
            value: genres
          }
        ],
        limit: limit * 2, // Get more to filter out excluded IDs
        sort: {
          field: 'releaseYear',
          direction: 'desc'
        }
      };
      
      // Exclude the source content
      const excludeIds = [...(options.excludeIds || []), sourceContentId];
      
      const result = await metadataService.searchMetadata(contentType, '', searchOptions);
      
      // Filter out excluded IDs
      let filteredMetadata = result.metadata.filter(
        item => !excludeIds.includes(item.contentId || '')
      );
      
      // Convert to recommendation results
      const recommendations = filteredMetadata.slice(0, limit).map(metadata => ({
        contentId: metadata.contentId || '',
        metadata,
        reason: `Similar to ${sourceMetadata.title} based on genre`,
        score: 0.7 // Default similarity score
      }));
      
      return recommendations;
    } catch (error) {
      console.error('RecommendationService: Error generating fallback similar content', error);
      return [];
    }
  }
  
  /**
   * Record content view for improving recommendations
   * 
   * @param contentId Content ID that was viewed
   * @param duration View duration in seconds (optional)
   */
  public async recordContentView(contentId: string, duration?: number): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/api/recommendations/record-view`, {
        contentId,
        duration
      });
    } catch (error) {
      console.error('RecommendationService: Error recording content view', error);
      // Silently fail - this is non-critical functionality
    }
  }
  
  /**
   * Clear recommendation caches
   */
  public clearCache(): void {
    this.cachedTrendingContent.clear();
    this.cachedNewReleases.clear();
    this.cacheTimestamps.clear();
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService; 