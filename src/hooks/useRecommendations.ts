import { useState, useEffect, useCallback } from 'react';
import recommendationService, {
  RecommendationResult,
  RecommendationOptions,
  SimilarContentOptions,
  PersonalizationSourceOptions,
  RecommendationType
} from '../services/recommendation.service';

/**
 * Recommendation hook result interface
 */
interface UseRecommendationsResult {
  // Recommendations data
  recommendations: RecommendationResult[];
  loading: boolean;
  error: string | null;
  
  // Recommendation fetch methods
  getPersonalizedRecommendations: (
    options?: RecommendationOptions,
    sourceOptions?: PersonalizationSourceOptions
  ) => Promise<void>;
  getSimilarContent: (options: SimilarContentOptions) => Promise<void>;
  getTrendingContent: (options?: RecommendationOptions) => Promise<void>;
  getNewReleases: (options?: RecommendationOptions) => Promise<void>;
  getGenreRecommendations: (
    genres: string[],
    options?: RecommendationOptions
  ) => Promise<void>;
  
  // Utility methods
  recordContentView: (contentId: string, duration?: number) => Promise<void>;
  clearRecommendations: () => void;
}

/**
 * Hook for fetching and managing content recommendations
 * 
 * @param initialType Optional initial recommendation type to load automatically
 * @param initialOptions Optional initial options for the recommendation type
 * @returns Object with recommendations and methods to fetch different types
 */
export function useRecommendations(
  initialType?: RecommendationType,
  initialOptions?: RecommendationOptions | SimilarContentOptions
): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get personalized recommendations
  const getPersonalizedRecommendations = useCallback(async (
    options: RecommendationOptions = {},
    sourceOptions: PersonalizationSourceOptions = {}
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await recommendationService.getPersonalizedRecommendations(
        options,
        sourceOptions
      );
      setRecommendations(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch personalized recommendations');
      console.error('Error fetching personalized recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Get similar content recommendations
  const getSimilarContent = useCallback(async (
    options: SimilarContentOptions
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await recommendationService.getSimilarContent(options);
      setRecommendations(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch similar content');
      console.error('Error fetching similar content:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Get trending content
  const getTrendingContent = useCallback(async (
    options: RecommendationOptions = {}
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await recommendationService.getTrendingContent(options);
      setRecommendations(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending content');
      console.error('Error fetching trending content:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Get new releases
  const getNewReleases = useCallback(async (
    options: RecommendationOptions = {}
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await recommendationService.getNewReleases(options);
      setRecommendations(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch new releases');
      console.error('Error fetching new releases:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Get genre recommendations
  const getGenreRecommendations = useCallback(async (
    genres: string[],
    options: RecommendationOptions = {}
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await recommendationService.getGenreRecommendations(genres, options);
      setRecommendations(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch genre recommendations');
      console.error('Error fetching genre recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Record content view
  const recordContentView = useCallback(async (
    contentId: string,
    duration?: number
  ): Promise<void> => {
    try {
      await recommendationService.recordContentView(contentId, duration);
    } catch (err) {
      console.error('Error recording content view:', err);
      // Silent fail - non-critical functionality
    }
  }, []);
  
  // Clear recommendations
  const clearRecommendations = useCallback((): void => {
    setRecommendations([]);
    setError(null);
  }, []);
  
  // Load initial recommendations if specified
  useEffect(() => {
    if (initialType && !loading && recommendations.length === 0) {
      switch (initialType) {
        case RecommendationType.PERSONALIZED:
          getPersonalizedRecommendations(initialOptions);
          break;
        case RecommendationType.SIMILAR:
          if ('sourceContentId' in (initialOptions || {})) {
            getSimilarContent(initialOptions as SimilarContentOptions);
          } else {
            setError('Source content ID is required for similar content recommendations');
          }
          break;
        case RecommendationType.TRENDING:
          getTrendingContent(initialOptions);
          break;
        case RecommendationType.NEW_RELEASES:
          getNewReleases(initialOptions);
          break;
        case RecommendationType.GENRE_BASED:
          if ('genres' in (initialOptions || {})) {
            getGenreRecommendations(
              (initialOptions as any).genres,
              initialOptions
            );
          } else {
            setError('Genres are required for genre-based recommendations');
          }
          break;
      }
    }
  }, [
    initialType,
    initialOptions,
    loading,
    recommendations.length,
    getPersonalizedRecommendations,
    getSimilarContent,
    getTrendingContent,
    getNewReleases,
    getGenreRecommendations
  ]);
  
  return {
    recommendations,
    loading,
    error,
    getPersonalizedRecommendations,
    getSimilarContent,
    getTrendingContent,
    getNewReleases,
    getGenreRecommendations,
    recordContentView,
    clearRecommendations
  };
}

export default useRecommendations; 