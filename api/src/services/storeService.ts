import mongoose from 'mongoose';
import { ethers } from 'ethers';
import { createError } from '../middleware/errorHandler';
import Listing from '../models/Listing';
import Content from '../models/Content';
import User from '../models/User';
import tokenService from './tokenService';

/**
 * Service for store operations
 */
class StoreService {
  /**
   * Create a new listing
   * @param listingData Listing data
   * @param userId User ID of the seller
   */
  async createListing(listingData: any, userId: string) {
    try {
      // Get the user to verify wallet address
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      if (!user.walletAddress) {
        throw createError('User does not have a connected wallet', 400);
      }

      // Check if content exists and is tokenized
      const content = await Content.findById(listingData.contentId);
      if (!content) {
        throw createError('Content not found', 404);
      }

      if (!content.tokenId) {
        throw createError('Content is not tokenized and cannot be listed', 400);
      }

      // Verify token ownership (in production, this would verify blockchain state)
      // This is a simplified version
      // Call to blockchain to verify token ownership should happen here
      
      // Create listing
      const listing = new Listing({
        tokenId: content.tokenId,
        contractAddress: content.contractAddress,
        contentId: content._id,
        seller: userId,
        quantity: listingData.quantity,
        price: listingData.price,
        currency: listingData.currency || 'MATIC',
        status: 'active',
        expiresAt: listingData.expiresAt || undefined
      });

      // Save listing
      const savedListing = await listing.save();

      // Call token service to update the listing on blockchain
      // This would be implemented in a production environment
      // const blockchainListing = await tokenService.listToken(
      //   content.tokenId,
      //   user.walletAddress,
      //   listingData.quantity,
      //   listingData.price,
      //   listingData.currency || 'MATIC'
      // );

      // Return listing with populated references
      const populatedListing = await Listing.findById(savedListing._id)
        .populate('seller', 'username email walletAddress')
        .populate('contentId', 'title description thumbnailCid');

      return populatedListing;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw createError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Get listing by ID
   * @param listingId Listing ID
   */
  async getListingById(listingId: string) {
    try {
      const listing = await Listing.findById(listingId)
        .populate('seller', 'username email walletAddress')
        .populate('contentId', 'title description thumbnailCid')
        .populate('buyer', 'username email walletAddress');

      if (!listing) {
        throw createError('Listing not found', 404);
      }

      return listing;
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw createError('Invalid listing ID', 400);
      }
      throw error;
    }
  }

  /**
   * Get all listings with filters and pagination
   * @param filters Filter options
   * @param page Page number
   * @param limit Items per page
   */
  async getListings(filters: any = {}, page: number = 1, limit: number = 10) {
    try {
      const queryFilters = { ...filters };
      
      // Default to active listings only
      if (!queryFilters.status) {
        queryFilters.status = 'active';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const listings = await Listing.find(queryFilters)
        .populate('seller', 'username email walletAddress')
        .populate('contentId', 'title description thumbnailCid')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const totalCount = await Listing.countDocuments(queryFilters);

      return {
        listings,
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
   * Get listings by token
   * @param tokenId Token ID
   * @param page Page number
   * @param limit Items per page
   */
  async getListingsByToken(tokenId: string, page: number = 1, limit: number = 10) {
    try {
      // Build filter
      const filters = { 
        tokenId, 
        status: 'active' 
      };

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const listings = await Listing.find(filters)
        .populate('seller', 'username email walletAddress')
        .populate('contentId', 'title description thumbnailCid')
        .sort({ price: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const totalCount = await Listing.countDocuments(filters);

      return {
        listings,
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
   * Get listings by seller
   * @param sellerId Seller user ID
   * @param page Page number
   * @param limit Items per page
   * @param showAll If true, include all listings (active, sold, etc.)
   */
  async getListingsBySeller(sellerId: string, page: number = 1, limit: number = 10, showAll: boolean = false) {
    try {
      // Build filter
      const filters: any = { seller: sellerId };
      
      if (!showAll) {
        filters.status = 'active';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const listings = await Listing.find(filters)
        .populate('contentId', 'title description thumbnailCid')
        .populate('buyer', 'username email walletAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const totalCount = await Listing.countDocuments(filters);

      return {
        listings,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw createError('Invalid seller ID', 400);
      }
      throw error;
    }
  }

  /**
   * Purchase a listed token
   * @param listingId Listing ID
   * @param buyerId Buyer user ID
   * @param quantity Quantity to purchase
   */
  async purchaseListing(listingId: string, buyerId: string, quantity: number = 1) {
    try {
      // Get the listing
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw createError('Listing not found', 404);
      }

      // Check if the listing is active
      if (listing.status !== 'active') {
        throw createError('Listing is no longer active', 400);
      }

      // Check if there's enough quantity available
      if (listing.quantity < quantity) {
        throw createError('Not enough tokens available in this listing', 400);
      }

      // Get the buyer and seller
      const buyer = await User.findById(buyerId);
      if (!buyer) {
        throw createError('Buyer not found', 404);
      }

      if (!buyer.walletAddress) {
        throw createError('Buyer does not have a connected wallet', 400);
      }

      // In a production app, at this point we would:
      // 1. Call a blockchain service to initiate the token transfer
      // 2. Wait for transaction confirmation
      // 3. Update the listing status once confirmed

      // For this demo, we'll just update the database
      
      // Calculate remaining quantity
      const remainingQuantity = listing.quantity - quantity;
      
      // Update listing status if all tokens sold
      if (remainingQuantity === 0) {
        listing.status = 'sold';
      }
      
      // Update listing
      listing.quantity = remainingQuantity;
      listing.buyer = buyerId;
      
      // These properties might not be in the Listing interface yet
      // Add them as any type casting to avoid TypeScript errors
      (listing as any).soldAt = new Date();
      (listing as any).soldPrice = listing.price;
      
      await listing.save();

      // Create a transaction record (would be implemented in a real app)
      const transaction = {
        listingId: listing._id,
        tokenId: listing.tokenId,
        contractAddress: listing.contractAddress,
        seller: listing.seller,
        buyer: buyerId,
        quantity: quantity,
        price: listing.price,
        currency: listing.currency,
        timestamp: new Date(),
        status: 'completed',
        transactionHash: '0x' + Math.random().toString(16).substring(2, 34) // Mock transaction hash
      };
      
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel a listing
   * @param listingId Listing ID
   * @param userId User ID of the seller (for verification)
   */
  async cancelListing(listingId: string, userId: string) {
    try {
      // Get the listing
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw createError('Listing not found', 404);
      }
      
      // Verify the seller
      if (listing.seller.toString() !== userId) {
        throw createError('Only the seller can cancel this listing', 403);
      }
      
      // Check if the listing is active
      if (listing.status !== 'active') {
        throw createError('Can only cancel active listings', 400);
      }
      
      // Update listing status
      listing.status = 'cancelled';
      await listing.save();
      
      return {
        message: 'Listing cancelled successfully',
        listingId: listing._id
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update listing price
   * @param listingId Listing ID
   * @param userId User ID of the seller (for verification)
   * @param newPrice New price for the listing
   */
  async updateListingPrice(listingId: string, userId: string, newPrice: number) {
    try {
      // Get the listing
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw createError('Listing not found', 404);
      }
      
      // Verify the seller
      if (listing.seller.toString() !== userId) {
        throw createError('Only the seller can update this listing', 403);
      }
      
      // Check if the listing is active
      if (listing.status !== 'active') {
        throw createError('Can only update active listings', 400);
      }
      
      // Validate price
      if (newPrice <= 0) {
        throw createError('Price must be greater than zero', 400);
      }
      
      // Update listing price
      listing.price = newPrice;
      await listing.save();
      
      return {
        message: 'Listing price updated successfully',
        listingId: listing._id,
        newPrice: newPrice
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get store analytics data
   */
  async getAnalytics() {
    try {
      // Get total listings
      const totalListings = await Listing.countDocuments();
      
      // Get active listings
      const activeListings = await Listing.countDocuments({ status: 'active' });
      
      // Get sold listings
      const soldListings = await Listing.countDocuments({ status: 'sold' });
      
      // Get total sales volume (would involve more complex aggregation in a real app)
      const salesVolume = await Listing.aggregate([
        { $match: { status: 'sold' } },
        { $group: { 
          _id: null, 
          total: { $sum: '$soldPrice' } 
        }}
      ]);
      
      // Get most popular tokens (would involve more complex joins in a real app)
      const popularTokens = await Listing.aggregate([
        { $match: { status: 'sold' } },
        { $group: { 
          _id: '$tokenId', 
          count: { $sum: 1 },
          averagePrice: { $avg: '$soldPrice' }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      // Get sales by currency
      const salesByCurrency = await Listing.aggregate([
        { $match: { status: 'sold' } },
        { $group: { 
          _id: '$currency', 
          count: { $sum: 1 },
          volume: { $sum: '$soldPrice' }
        }},
        { $sort: { volume: -1 } }
      ]);
      
      // Format results
      return {
        listingStats: {
          total: totalListings,
          active: activeListings,
          sold: soldListings
        },
        salesVolume: salesVolume.length > 0 ? salesVolume[0].total : 0,
        popularTokens: popularTokens,
        salesByCurrency: salesByCurrency
      };
    } catch (error) {
      throw error;
    }
  }
}

const storeService = new StoreService();
export default storeService; 