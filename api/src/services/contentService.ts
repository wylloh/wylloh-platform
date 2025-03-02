import axios from 'axios';
import mongoose from 'mongoose';
import { createError } from '../middleware/errorHandler';
import Content from '../models/Content';
import User from '../models/User';
import ipfsService from './ipfsService';
import tokenService from './tokenService';

/**
 * Service for managing content
 */
class ContentService {
  /**
   * Create new content
   * @param contentData Content data object
   * @param userId Creator ID
   */
  async createContent(contentData: any, userId: string) {
    try {
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Validate content data
      if (!contentData.title || !contentData.contentType) {
        throw createError('Title and content type are required', 400);
      }

      // Process IPFS storage data
      let ipfsCid = '';
      if (contentData.ipfsCid) {
        ipfsCid = contentData.ipfsCid;
        
        // Verify the CID exists on IPFS
        const exists = await ipfsService.checkContentExists(ipfsCid);
        if (!exists) {
          throw createError('Content not found on IPFS', 404);
        }
      }

      // Create content record
      const content = new Content({
        title: contentData.title,
        description: contentData.description || '',
        contentType: contentData.contentType,
        ipfsCid: ipfsCid,
        previewCid: contentData.previewCid || '',
        thumbnailCid: contentData.thumbnailCid || '',
        metadataCid: contentData.metadataCid || '',
        creator: userId,
        status: contentData.status || 'draft',
        visibility: contentData.visibility || 'private',
        metadata: contentData.metadata || {},
        tokenId: contentData.tokenId || null,
        contractAddress: contentData.contractAddress || null,
        rightsThresholds: contentData.rightsThresholds || []
      });

      // Save content
      const savedContent = await content.save();
      
      return savedContent;
    } catch (error) {
      // Re-throw mongoose validation errors
      if (error instanceof mongoose.Error.ValidationError) {
        throw createError(error.message, 400);
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get content by ID
   * @param contentId Content ID
   * @param userId User ID (for visibility check)
   */
  async getContentById(contentId: string, userId?: string) {
    try {
      const content = await Content.findById(contentId).populate('creator', 'username email walletAddress');
      
      if (!content) {
        throw createError('Content not found', 404);
      }

      // Check visibility permissions
      if (content.visibility === 'private' && (!userId || content.creator._id.toString() !== userId)) {
        throw createError('You do not have permission to view this content', 403);
      }

      return content;
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid content ID', 400);
      }
      throw error;
    }
  }

  /**
   * Get all content with filters and pagination
   * @param filters Filter options
   * @param page Page number
   * @param limit Items per page
   * @param userId User ID (for visibility filtering)
   */
  async getAllContent(filters: any = {}, page: number = 1, limit: number = 10, userId?: string) {
    try {
      const queryFilters: any = { ...filters };
      
      // Apply visibility filters based on user
      if (userId) {
        // If user is provided, show public content and user's private content
        queryFilters.$or = [
          { visibility: 'public' },
          { visibility: 'private', creator: userId }
        ];
      } else {
        // If no user, show only public content
        queryFilters.visibility = 'public';
      }

      // Apply status filter
      if (!queryFilters.status) {
        queryFilters.status = 'active';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const content = await Content.find(queryFilters)
        .populate('creator', 'username email walletAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const totalCount = await Content.countDocuments(queryFilters);

      return {
        content,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update content
   * @param contentId Content ID
   * @param updateData Update data
   * @param userId User ID (for authorization)
   */
  async updateContent(contentId: string, updateData: any, userId: string) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        throw createError('Content not found', 404);
      }

      // Check if user is authorized to update
      if (content.creator.toString() !== userId) {
        throw createError('You do not have permission to update this content', 403);
      }

      // Don't allow updating certain fields
      const sanitizedUpdateData = { ...updateData };
      delete sanitizedUpdateData.creator;
      delete sanitizedUpdateData.createdAt;
      delete sanitizedUpdateData.tokenId; // Token ID should be updated by tokenization process
      delete sanitizedUpdateData.contractAddress; // Contract address should be updated by tokenization process

      // Update content
      const updatedContent = await Content.findByIdAndUpdate(
        contentId,
        { $set: sanitizedUpdateData },
        { new: true, runValidators: true }
      ).populate('creator', 'username email walletAddress');

      return updatedContent;
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid content ID', 400);
      }
      if (error instanceof mongoose.Error.ValidationError) {
        throw createError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Delete content
   * @param contentId Content ID
   * @param userId User ID (for authorization)
   */
  async deleteContent(contentId: string, userId: string) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        throw createError('Content not found', 404);
      }

      // Check if user is authorized to delete
      if (content.creator.toString() !== userId) {
        throw createError('You do not have permission to delete this content', 403);
      }

      // If content is tokenized, check if it can be deleted
      if (content.tokenId) {
        // In a real implementation, we would check if there are any tokens owned by others
        // For now, we'll just throw an error if it's tokenized
        throw createError('Cannot delete tokenized content', 400);
      }

      // Delete the content
      await Content.findByIdAndDelete(contentId);

      // In a production system, we might want to:
      // 1. Mark content as deleted instead of actually deleting
      // 2. Schedule IPFS content for unpinning (if no other content uses it)
      // 3. Notify relevant services about the deletion

      return { message: 'Content deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid content ID', 400);
      }
      throw error;
    }
  }

  /**
   * Get content by creator
   * @param creatorId Creator user ID
   * @param page Page number
   * @param limit Items per page
   * @param userId Requesting user ID (for visibility check)
   */
  async getContentByCreator(creatorId: string, page: number = 1, limit: number = 10, userId?: string) {
    try {
      // Verify creator exists
      const creator = await User.findById(creatorId);
      if (!creator) {
        throw createError('Creator not found', 404);
      }

      // Build filter
      const filters: any = { creator: creatorId };
      
      // Apply visibility filters
      if (userId && userId === creatorId) {
        // If requesting user is the creator, show all their content
        // No additional filters needed
      } else {
        // Otherwise, show only public content
        filters.visibility = 'public';
        filters.status = 'active';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const content = await Content.find(filters)
        .populate('creator', 'username email walletAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const totalCount = await Content.countDocuments(filters);

      return {
        content,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid creator ID', 400);
      }
      throw error;
    }
  }

  /**
   * Search content
   * @param query Search query string
   * @param filters Additional filters
   * @param page Page number
   * @param limit Items per page
   * @param userId Requesting user ID (for visibility check)
   */
  async searchContent(query: string, filters: any = {}, page: number = 1, limit: number = 10, userId?: string) {
    try {
      // Build search query
      const searchFilters: any = { ...filters };
      
      if (query) {
        searchFilters.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'metadata.tags': { $regex: query, $options: 'i' } }
        ];
      }

      // Apply visibility filters
      if (userId) {
        // If user is provided, show public content and user's private content
        searchFilters.$and = [
          {
            $or: [
              { visibility: 'public' },
              { visibility: 'private', creator: userId }
            ]
          }
        ];
      } else {
        // If no user, show only public content
        searchFilters.visibility = 'public';
      }

      // Apply status filter
      if (!searchFilters.status) {
        searchFilters.status = 'active';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute search query
      const content = await Content.find(searchFilters)
        .populate('creator', 'username email walletAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const totalCount = await Content.countDocuments(searchFilters);

      return {
        content,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update content metadata
   * @param contentId Content ID
   * @param metadata Metadata object to update
   * @param userId User ID (for authorization)
   */
  async updateMetadata(contentId: string, metadata: any, userId: string) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        throw createError('Content not found', 404);
      }

      // Check if user is authorized
      if (content.creator.toString() !== userId) {
        throw createError('You do not have permission to update this content', 403);
      }

      // Update metadata by merging with existing metadata
      const updatedContent = await Content.findByIdAndUpdate(
        contentId,
        { $set: { metadata: { ...content.metadata, ...metadata } } },
        { new: true, runValidators: true }
      ).populate('creator', 'username email walletAddress');

      return updatedContent;
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid content ID', 400);
      }
      throw error;
    }
  }

  /**
   * Tokenize content
   * @param contentId Content ID
   * @param tokenData Token configuration data
   * @param userId User ID (for authorization)
   */
  async tokenizeContent(contentId: string, tokenData: any, userId: string) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        throw createError('Content not found', 404);
      }

      // Check if user is authorized
      if (content.creator.toString() !== userId) {
        throw createError('You do not have permission to tokenize this content', 403);
      }

      // Check if content is already tokenized
      if (content.tokenId) {
        throw createError('Content is already tokenized', 400);
      }

      // Ensure IPFS content exists
      if (!content.ipfsCid) {
        throw createError('Content must be uploaded to IPFS before tokenization', 400);
      }

      // Call token service to create token
      const tokenResult = await tokenService.createToken({
        contentId: content._id.toString(),
        contentCid: content.ipfsCid,
        metadataCid: content.metadataCid,
        title: content.title,
        description: content.description,
        contentType: content.contentType,
        creator: userId,
        rightsThresholds: tokenData.rightsThresholds || [],
        totalSupply: tokenData.totalSupply || 1,
        royaltyPercentage: tokenData.royaltyPercentage || 1000 // 10% default
      });

      // Update content with token information
      const updatedContent = await Content.findByIdAndUpdate(
        contentId,
        {
          $set: {
            tokenId: tokenResult.tokenId,
            contractAddress: tokenResult.contractAddress,
            status: 'active', // Once tokenized, set to active
            rightsThresholds: tokenData.rightsThresholds || []
          }
        },
        { new: true, runValidators: true }
      ).populate('creator', 'username email walletAddress');

      return {
        content: updatedContent,
        token: tokenResult
      };
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid content ID', 400);
      }
      throw error;
    }
  }
}

export default new ContentService();