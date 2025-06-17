import { RecommendationItem } from '../components/recommendations/RecommendationsList';

export enum RecommendationType {
  FOR_YOU = 'for_you',
  TRENDING = 'trending',
  NEW_RELEASES = 'new_releases',
  WATCH_AGAIN = 'watch_again',
  SIMILAR = 'similar',
  GENRE_BASED = 'genre_based',
  DIRECTOR_BASED = 'director_based',
}

export interface RecommendationRequest {
  userId?: string;
  type: RecommendationType;
  limit?: number;
  offset?: number;
  contentId?: string; // For similar content recommendations
  genre?: string; // For genre-based recommendations
  director?: string; // For director-based recommendations
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  total: number;
  hasMore: boolean;
  type: RecommendationType;
}

export interface UserPreferences {
  favoriteGenres: string[];
  favoriteDirectors: string[];
  watchHistory: string[];
  ratings: Record<string, number>;
  watchLater: string[];
}

class RecommendationService {
  private baseUrl: string;
  private cache: Map<string, RecommendationResponse> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '/api';
  }

  /**
   * Get recommendations based on type and user preferences
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cacheKey)) {
      return cached;
    }

    try {
      // In production, this would make an API call
      // For now, return mock data based on type
      const response = await this.getMockRecommendations(request);
      
      this.cache.set(cacheKey, response);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      return response;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Failed to fetch recommendations');
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      userId,
      type: RecommendationType.FOR_YOU,
      limit,
    };

    const response = await this.getRecommendations(request);
    return response.recommendations;
  }

  /**
   * Get trending content
   */
  async getTrendingRecommendations(limit: number = 20): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      type: RecommendationType.TRENDING,
      limit,
    };

    const response = await this.getRecommendations(request);
    return response.recommendations;
  }

  /**
   * Get similar content recommendations
   */
  async getSimilarContent(
    contentId: string,
    limit: number = 10
  ): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      type: RecommendationType.SIMILAR,
      contentId,
      limit,
    };

    const response = await this.getRecommendations(request);
    return response.recommendations;
  }

  /**
   * Get recommendations by genre
   */
  async getGenreRecommendations(
    genre: string,
    limit: number = 20
  ): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      type: RecommendationType.GENRE_BASED,
      genre,
      limit,
    };

    const response = await this.getRecommendations(request);
    return response.recommendations;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      // In production, this would make an API call
      console.log('Updating user preferences:', { userId, preferences });
      
      // Clear cache for user-specific recommendations
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(userId)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  /**
   * Record user interaction (view, like, share, etc.)
   */
  async recordInteraction(
    userId: string,
    contentId: string,
    interactionType: 'view' | 'like' | 'share' | 'play' | 'purchase',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // In production, this would make an API call
      console.log('Recording interaction:', {
        userId,
        contentId,
        interactionType,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
      // Don't throw error for analytics - fail silently
    }
  }

  /**
   * Get mock recommendations based on request type
   */
  private async getMockRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const mockData = this.getMockData();
    const limit = request.limit || 20;
    const offset = request.offset || 0;

    let recommendations: RecommendationItem[] = [];

    switch (request.type) {
      case RecommendationType.FOR_YOU:
        recommendations = mockData.forYou;
        break;
      case RecommendationType.TRENDING:
        recommendations = mockData.trending;
        break;
      case RecommendationType.NEW_RELEASES:
        recommendations = mockData.newReleases;
        break;
      case RecommendationType.WATCH_AGAIN:
        recommendations = mockData.watchAgain;
        break;
      case RecommendationType.SIMILAR:
        recommendations = mockData.similar;
        break;
      case RecommendationType.GENRE_BASED:
        recommendations = mockData.genreBased;
        break;
      case RecommendationType.DIRECTOR_BASED:
        recommendations = mockData.directorBased;
        break;
      default:
        recommendations = mockData.forYou;
    }

    const paginatedResults = recommendations.slice(offset, offset + limit);

    return {
      recommendations: paginatedResults,
      total: recommendations.length,
      hasMore: offset + limit < recommendations.length,
      type: request.type,
    };
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(request: RecommendationRequest): string {
    return JSON.stringify(request);
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    // Simple cache validation - in production, you'd want more sophisticated logic
    return this.cache.has(cacheKey);
  }

  /**
   * Mock data for development and testing
   */
  private getMockData() {
    return {
      forYou: [
        {
          id: 'rec-1',
          title: 'The Filmmaker\'s Journey',
          description: 'An inspiring documentary about independent filmmakers breaking into Hollywood.',
          thumbnail: 'https://via.placeholder.com/300x400/1976d2/ffffff?text=Filmmaker%27s+Journey',
          genre: ['Documentary', 'Biography'],
          rating: 4.7,
          duration: '2h 15m',
          year: 2023,
          director: 'Sarah Chen',
          type: 'documentary' as const,
          price: 12.99,
        },
        {
          id: 'rec-2',
          title: 'Digital Dreams',
          description: 'A sci-fi thriller exploring the intersection of technology and creativity.',
          thumbnail: 'https://via.placeholder.com/300x400/7c3aed/ffffff?text=Digital+Dreams',
          genre: ['Sci-Fi', 'Thriller'],
          rating: 4.3,
          duration: '1h 58m',
          year: 2024,
          director: 'Marcus Rodriguez',
          type: 'movie' as const,
          price: 15.99,
        },
      ],
      trending: [
        {
          id: 'trend-1',
          title: 'Blockchain Chronicles',
          description: 'A deep dive into the world of decentralized technology and its impact on media.',
          thumbnail: 'https://via.placeholder.com/300x400/059669/ffffff?text=Blockchain+Chronicles',
          genre: ['Documentary', 'Technology'],
          rating: 4.5,
          duration: '1h 45m',
          year: 2024,
          director: 'Alex Thompson',
          type: 'documentary' as const,
          price: 9.99,
        },
        {
          id: 'trend-2',
          title: 'The Creator\'s Dilemma',
          description: 'A thought-provoking drama about artists navigating the digital age.',
          thumbnail: 'https://via.placeholder.com/300x400/dc2626/ffffff?text=Creator%27s+Dilemma',
          genre: ['Drama', 'Art'],
          rating: 4.2,
          duration: '2h 8m',
          year: 2023,
          director: 'Emma Wilson',
          type: 'movie' as const,
          price: 14.99,
        },
      ],
      newReleases: [
        {
          id: 'new-1',
          title: 'Future of Film',
          description: 'Exploring how emerging technologies are reshaping the film industry.',
          thumbnail: 'https://via.placeholder.com/300x400/ea580c/ffffff?text=Future+of+Film',
          genre: ['Documentary', 'Technology'],
          rating: 4.6,
          duration: '1h 52m',
          year: 2024,
          director: 'David Park',
          type: 'documentary' as const,
          price: 11.99,
        },
      ],
      watchAgain: [
        {
          id: 'watch-1',
          title: 'The Art of Storytelling',
          description: 'A masterclass in narrative techniques from legendary filmmakers.',
          thumbnail: 'https://via.placeholder.com/300x400/1e40af/ffffff?text=Art+of+Storytelling',
          genre: ['Documentary', 'Education'],
          rating: 4.8,
          duration: '3h 15m',
          year: 2022,
          director: 'Robert Martinez',
          type: 'documentary' as const,
          isOwned: true,
        },
      ],
      similar: [
        {
          id: 'sim-1',
          title: 'Similar Content Example',
          description: 'Content similar to what you\'re viewing.',
          thumbnail: 'https://via.placeholder.com/300x400/6366f1/ffffff?text=Similar+Content',
          genre: ['Documentary'],
          rating: 4.4,
          duration: '1h 30m',
          year: 2023,
          director: 'Jane Doe',
          type: 'documentary' as const,
          price: 10.99,
        },
      ],
      genreBased: [
        {
          id: 'genre-1',
          title: 'Genre-Based Recommendation',
          description: 'Content based on your favorite genres.',
          thumbnail: 'https://via.placeholder.com/300x400/8b5cf6/ffffff?text=Genre+Based',
          genre: ['Drama'],
          rating: 4.1,
          duration: '2h 5m',
          year: 2023,
          director: 'John Smith',
          type: 'movie' as const,
          price: 13.99,
        },
      ],
      directorBased: [
        {
          id: 'dir-1',
          title: 'Director-Based Recommendation',
          description: 'More content from directors you love.',
          thumbnail: 'https://via.placeholder.com/300x400/10b981/ffffff?text=Director+Based',
          genre: ['Thriller'],
          rating: 4.3,
          duration: '1h 45m',
          year: 2024,
          director: 'Famous Director',
          type: 'movie' as const,
          price: 16.99,
        },
      ],
    };
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService; 