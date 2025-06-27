import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import Content from '../models/Content';
import User from '../models/User';
import WatchHistory from '../models/WatchHistory';
import UserPreference from '../models/UserPreference';

/**
 * Recommendation Controller
 * Handles all recommendation-related API endpoints
 */
export class RecommendationController {
  /**
   * Get personalized recommendations for a user
   * Uses user watch history, preferences, and behavior
   */
  static async getPersonalizedRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { contentType, limit = 10, offset = 0 } = req.query;
      
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Get user watch history
      const watchHistory = await WatchHistory.find({ userId })
        .sort({ lastWatched: -1 })
        .limit(50)
        .populate('contentId');
      
      // Get user preferences
      const userPreferences = await UserPreference.findOne({ userId });
      
      // Extract genres from watch history and preferences
      const watchedContentIds = watchHistory.map(entry => entry.contentId._id);
      const preferredGenres = userPreferences?.preferences?.genres || [];
      
      // Get watched content genres
      const watchedContent = await Content.find({ _id: { $in: watchedContentIds } });
      const watchedGenres = Array.from(
        new Set(
          watchedContent
            .flatMap(content => content.metadata?.genre || [])
            .filter(genre => genre)
        )
      );
      
      // Combine preferred and watched genres
      const combinedGenres = Array.from(new Set([...preferredGenres, ...watchedGenres]));
      
      // Base query
      const query: any = {
        _id: { $nin: watchedContentIds }, // Exclude watched content
        status: 'active',
        visibility: 'public'
      };
      
      // Add content type filter if provided
      if (contentType) {
        query.contentType = contentType;
      }
      
      // Add genre filter if we have genres
      if (combinedGenres.length > 0) {
        query['metadata.genre'] = { $in: combinedGenres };
      }
      
      // Get recommendations
      const recommendations = await Content.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
      
      // Add reasoning for recommendations
      const recommendationsWithReason = recommendations.map(content => {
        let reason = 'Based on your preferences';
        
        // Check if recommended based on genre
        const contentGenres = content.metadata?.genre || [];
        const matchingPreferredGenres = contentGenres.filter(genre => 
          preferredGenres.includes(genre)
        );
        const matchingWatchedGenres = contentGenres.filter(genre => 
          watchedGenres.includes(genre)
        );
        
        if (matchingPreferredGenres.length > 0) {
          reason = `Matches your preferred genres: ${matchingPreferredGenres.join(', ')}`;
        } else if (matchingWatchedGenres.length > 0) {
          reason = `Similar to content you've watched before`;
        }
        
        return {
          ...content.toObject(),
          reason,
          score: (matchingPreferredGenres.length * 2) + matchingWatchedGenres.length
        };
      });
      
      // Sort by score
      recommendationsWithReason.sort((a, b) => b.score - a.score);
      
      res.json(recommendationsWithReason);
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  /**
   * Get similar content based on a specific content item
   */
  static async getSimilarContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const { limit = 10, offset = 0 } = req.query;
      
      if (!contentId || !isValidObjectId(contentId)) {
        res.status(400).json({ message: 'Invalid content ID' });
        return;
      }
      
      // Get the source content
      const sourceContent = await Content.findById(contentId);
      if (!sourceContent) {
        res.status(404).json({ message: 'Content not found' });
        return;
      }
      
      // Extract metadata for matching
      const { contentType, metadata, creator } = sourceContent;
      const genres = metadata?.genre || [];
      const cast = metadata?.cast || [];
      const director = metadata?.director;
      
      // Build query for similar content
      const query: any = {
        _id: { $ne: contentId }, // Exclude the source content
        status: 'active',
        visibility: 'public'
      };
      
      // Find content with same type
      query.contentType = contentType;
      
      // Find content with matching genres, cast, or director
      const orConditions = [];
      
      if (genres.length > 0) {
        orConditions.push({ 'metadata.genre': { $in: genres } });
      }
      
      if (cast.length > 0) {
        orConditions.push({ 'metadata.cast': { $in: cast } });
      }
      
      if (director) {
        orConditions.push({ 'metadata.director': director });
      }
      
      if (creator) {
        orConditions.push({ creator });
      }
      
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
      
      // Get similar content
      const similarContent = await Content.find(query)
        .skip(Number(offset))
        .limit(Number(limit));
      
      // Calculate similarity score and add reason
      const similarContentWithScore = similarContent.map(content => {
        let score = 0;
        let matchingFeatures = [];
        
        // Calculate genre similarity
        const contentGenres = content.metadata?.genre || [];
        const matchingGenres = contentGenres.filter(genre => genres.includes(genre));
        if (matchingGenres.length > 0) {
          score += matchingGenres.length * 2;
          matchingFeatures.push(`matching genres (${matchingGenres.join(', ')})`);
        }
        
        // Calculate cast similarity
        const contentCast = content.metadata?.cast || [];
        const matchingCast = contentCast.filter(actor => cast.includes(actor));
        if (matchingCast.length > 0) {
          score += matchingCast.length * 1.5;
          matchingFeatures.push('cast members');
        }
        
        // Calculate director similarity
        if (director && content.metadata?.director === director) {
          score += 3;
          matchingFeatures.push(`director (${director})`);
        }
        
        // Calculate creator similarity
        if (creator && content.creator === creator) {
          score += 2;
          matchingFeatures.push('creator');
        }
        
        // Create reason text
        let reason = 'Similar content you might enjoy';
        if (matchingFeatures.length > 0) {
          reason = `Similar ${matchingFeatures.join(' and ')} to "${sourceContent.title}"`;
        }
        
        return {
          ...content.toObject(),
          reason,
          score
        };
      });
      
      // Sort by similarity score
      similarContentWithScore.sort((a, b) => b.score - a.score);
      
      res.json(similarContentWithScore);
    } catch (error) {
      console.error('Error in getSimilarContent:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  /**
   * Get trending content
   */
  static async getTrendingContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, limit = 10, offset = 0 } = req.query;
      
      // Build query
      const query: any = {
        status: 'active',
        visibility: 'public'
      };
      
      // Add content type filter if provided
      if (contentType) {
        query.contentType = contentType;
      }
      
      // Get trending content based on views and recent purchases
      const trendingContent = await Content.aggregate([
        { $match: query },
        { 
          $addFields: {
            trendingScore: {
              $add: [
                { $ifNull: ['$views', 0] },
                { $multiply: [{ $ifNull: ['$sales', 0] }, 5] }
              ]
            }
          }
        },
        { $sort: { trendingScore: -1, createdAt: -1 } },
        { $skip: Number(offset) },
        { $limit: Number(limit) }
      ]);
      
      // Add reason to each content item
      const trendingWithReason = trendingContent.map(content => ({
        ...content,
        reason: 'Popular with other users',
        score: content.trendingScore
      }));
      
      res.json(trendingWithReason);
    } catch (error) {
      console.error('Error in getTrendingContent:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  /**
   * Get new releases
   */
  static async getNewReleases(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, limit = 10, offset = 0 } = req.query;
      
      // Build query
      const query: any = {
        status: 'active',
        visibility: 'public'
      };
      
      // Add content type filter if provided
      if (contentType) {
        query.contentType = contentType;
      }
      
      // Get newest content
      const newReleases = await Content.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
      
      // Add reason and days since release
      const now = new Date();
      const newReleasesWithReason = newReleases.map(content => {
        const createdAt = new Date(content.createdAt);
        const daysSinceRelease = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        let reason = 'New release';
        if (daysSinceRelease === 0) {
          reason = 'Released today';
        } else if (daysSinceRelease === 1) {
          reason = 'Released yesterday';
        } else if (daysSinceRelease < 7) {
          reason = `Released ${daysSinceRelease} days ago`;
        } else if (daysSinceRelease < 30) {
          reason = `Released ${Math.floor(daysSinceRelease / 7)} weeks ago`;
        } else {
          reason = `Released ${Math.floor(daysSinceRelease / 30)} months ago`;
        }
        
        return {
          ...content.toObject(),
          reason,
          score: 1000 - daysSinceRelease // Higher score for newer content
        };
      });
      
      res.json(newReleasesWithReason);
    } catch (error) {
      console.error('Error in getNewReleases:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  /**
   * Get genre-based recommendations
   */
  static async getGenreRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { genre } = req.params;
      const { contentType, limit = 10, offset = 0 } = req.query;
      
      if (!genre) {
        res.status(400).json({ message: 'Genre is required' });
        return;
      }
      
      // Build query
      const query: any = {
        'metadata.genre': genre,
        status: 'active',
        visibility: 'public'
      };
      
      // Add content type filter if provided
      if (contentType) {
        query.contentType = contentType;
      }
      
      // Get content by genre
      const genreContent = await Content.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
      
      // Add reason
      const genreContentWithReason = genreContent.map(content => ({
        ...content.toObject(),
        reason: `${genre} content you might enjoy`,
        score: Math.random() * 10 // Random score for variety
      }));
      
      // Sort by score for some variety
      genreContentWithReason.sort((a, b) => b.score - a.score);
      
      res.json(genreContentWithReason);
    } catch (error) {
      console.error('Error in getGenreRecommendations:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  /**
   * Record content view for a user
   * Used to improve future recommendations
   */
  static async recordContentView(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { contentId } = req.params;
      
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      if (!contentId || !isValidObjectId(contentId)) {
        res.status(400).json({ message: 'Invalid content ID' });
        return;
      }
      
      // Check if content exists
      const content = await Content.findById(contentId);
      if (!content) {
        res.status(404).json({ message: 'Content not found' });
        return;
      }
      
      // Increment content views
      await Content.findByIdAndUpdate(contentId, { $inc: { views: 1 } });
      
      // Update or create watch history entry
      await WatchHistory.findOneAndUpdate(
        { userId, contentId },
        { 
          $set: { lastWatched: new Date() },
          $inc: { viewCount: 1 }
        },
        { upsert: true }
      );
      
      res.json({ message: 'Content view recorded successfully' });
    } catch (error) {
      console.error('Error in recordContentView:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default RecommendationController; 