import mongoose from 'mongoose';
import { ethers } from 'ethers';
import { createError } from '../middleware/errorHandler';
import Listing from '../models/Listing';
import Content from '../models/Content';
import User from '../models/User';
import tokenService from './tokenService';

/**
 * Service for marketplace operations
 */
class MarketplaceService {
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
    } catch (error) {
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
    } catch (error) {
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

      // Check if listing is active
      if (listing.status !== 'active') {
        throw createError('Listing is not active', 400);
      }

      // Check if expiration date has passed
      if (listing.expiresAt && new Date() > listing.expiresAt) {
        // Update listing status to expired
        listing.status = 'expired';
        await listing.save();
        throw createError('Listing has expired', 400);
      }

      // Check if quantity is valid
      if (quantity <= 0 || quantity > listing.quantity) {
        throw createError('Invalid quantity', 400);
      }

      // Get buyer information
      const buyer = await User.findById(buyerId);
      if (!buyer) {
        throw createError('Buyer not found', 404);
      }

      if (!buyer.walletAddress) {
        throw createError('Buyer does not have a connected wallet', 400);
      }

      // Make sure buyer isn't the seller
      if (listing.seller.toString() === buyerId) {
        throw createError('Cannot purchase your own listing', 400);
      }

      // In a production environment, this would:
      // 1. Call smart contract to execute purchase
      // 2. Verify transaction success
      // 3. Update the listing based on blockchain state
      
      // For demonstration, we'll simulate a successful purchase
      const transactionHash = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');

      // Update the listing
      if (quantity === listing.quantity) {
        // If buying all tokens, mark as sold
        listing.status = 'sold';
      } else {
        // If buying partial quantity, reduce the listing quantity
        listing.quantity -= quantity;
      }

      listing.buyer = buyerId;
      listing.completedAt = new Date();
      listing.transactionHash = transactionHash;

      await listing.save();

      // Create a record of the purchase (in production, this would be a separate model)
      // Here we're simplifying for demonstration purposes

      // Return the purchase information
      return {
        listingId: listing._id,
        tokenId: listing.tokenId,
        contractAddress: listing.contractAddress,
        seller: listing.seller,
        buyer: buyerId,
        quantity,
        price: listing.price,
        currency: listing.currency,
        totalAmount: listing.price * quantity,
        transactionHash,
        purchasedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid listing ID', 400);
      }
      throw error;
    }
  }

  /**
   * Cancel a listing
   * @param listingId Listing ID
   * @param userId User ID (must be the seller)
   */
  async cancelListing(listingId: string, userId: string) {
    try {
      // Get the listing
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw createError('Listing not found', 404);
      }

      // Check if user is the seller
      if (listing.seller.toString() !== userId) {
        throw createError('You are not authorized to cancel this listing', 403);
      }

      // Check if listing can be cancelled
      if (listing.status !== 'active') {
        throw createError('Listing is not active and cannot be cancelled', 400);
      }

      // Update listing status
      listing.status = 'cancelled';
      await listing.save();

      // In a production environment, this would:
      // 1. Call smart contract to cancel listing
      // 2. Verify transaction success

      return {
        message: 'Listing cancelled successfully',
        listingId: listing._id
      };
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid listing ID', 400);
      }
      throw error;
    }
  }

  /**
   * Update listing price
   * @param listingId Listing ID
   * @param userId User ID (must be the seller)
   * @param newPrice New price
   */
  async updateListingPrice(listingId: string, userId: string, newPrice: number) {
    try {
      // Get the listing
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw createError('Listing not found', 404);
      }

      // Check if user is the seller
      if (listing.seller.toString() !== userId) {
        throw createError('You are not authorized to update this listing', 403);
      }

      // Check if listing can be updated
      if (listing.status !== 'active') {
        throw createError('Listing is not active and cannot be updated', 400);
      }

      // Validate price
      if (newPrice <= 0) {
        throw createError('Price must be greater than zero', 400);
      }

      // Update listing price
      listing.price = newPrice;
      await listing.save();

      // In a production environment, this would:
      // 1. Call smart contract to update listing price
      // 2. Verify transaction success

      return {
        message: 'Listing price updated successfully',
        listingId: listing._id,
        newPrice
      };
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid listing ID', 400);
      }
      throw error;
    }
  }

  /**
   * Get marketplace analytics
   */
  async getAnalytics() {
    try {
      // Total active listings
      const activeListingsCount = await Listing.countDocuments({ status: 'active' });
      
      // Total sold listings
      const soldListingsCount = await Listing.countDocuments({ status: 'sold' });
      
      // Average price of active listings
      const averagePriceAggregation = await Listing.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, averagePrice: { $avg: '$price' } } }
      ]);
      
      const averagePrice = averagePriceAggregation.length > 0 ? 
        averagePriceAggregation[0].averagePrice : 0;
      
      // Listings by content type
      const listingsByContentType = await Listing.aggregate([
        { $match: { status: 'active' } },
        { $lookup: { from: 'contents', localField: 'contentId', foreignField: '_id', as: 'content' } },
        { $unwind: '$content' },
        { $group: { _id: '$content.contentType', count: { $sum: 1 } } },
        { $project: { contentType: '$_id', count: 1, _id: 0 } }
      ]);
      
      // Recent sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSales = await Listing.countDocuments({
        status: 'sold',
        completedAt: { $gte: thirtyDaysAgo }
      });
      
      return {
        activeListings: activeListingsCount,
        soldListings: soldListingsCount,
        averagePrice,
        listingsByContentType,
        recentSales,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new MarketplaceService();