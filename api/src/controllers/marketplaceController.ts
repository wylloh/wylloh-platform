import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import marketplaceService from '../services/marketplaceService';

/**
 * Get all marketplace listings
 * @route GET /api/marketplace/listings
 */
export const getListings = asyncHandler(async (req: Request, res: Response) => {
  // Get pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  // Extract filter parameters
  const { contentType, minPrice, maxPrice, currency } = req.query;
  const filters: any = {};
  
  if (contentType) {
    // This would require a join with the content model in a real implementation
    // For demonstration, we'll just pass it through
    filters.contentType = contentType;
  }
  
  if (minPrice) {
    filters.price = { $gte: parseFloat(minPrice as string) };
  }
  
  if (maxPrice) {
    if (!filters.price) filters.price = {};
    filters.price.$lte = parseFloat(maxPrice as string);
  }
  
  if (currency) {
    filters.currency = currency;
  }

  const result = await marketplaceService.getListings(filters, page, limit);

  res.status(200).json({
    message: 'Listings retrieved successfully',
    count: result.pagination.totalCount,
    pagination: result.pagination,
    listings: result.listings
  });
});

/**
 * Create a new listing
 * @route POST /api/marketplace/list
 */
export const createListing = asyncHandler(async (req: Request, res: Response) => {
  const listingData = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!listingData.contentId || !listingData.quantity || !listingData.price) {
    return res.status(400).json({
      error: {
        message: 'Content ID, quantity, and price are required'
      }
    });
  }

  const listing = await marketplaceService.createListing(listingData, userId);

  res.status(201).json({
    message: 'Listing created successfully',
    listing
  });
});

/**
 * Remove a listing
 * @route DELETE /api/marketplace/listings/:listingId
 */
export const removeListing = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.listingId;
  const userId = req.user.id;

  const result = await marketplaceService.cancelListing(listingId, userId);

  res.status(200).json({
    message: result.message
  });
});

/**
 * Purchase a listed token
 * @route POST /api/marketplace/purchase
 */
export const purchaseListing = asyncHandler(async (req: Request, res: Response) => {
  const { listingId, quantity } = req.body;
  const userId = req.user.id;

  if (!listingId) {
    return res.status(400).json({
      error: {
        message: 'Listing ID is required'
      }
    });
  }

  const result = await marketplaceService.purchaseListing(
    listingId,
    userId,
    quantity || 1
  );

  res.status(200).json({
    message: 'Purchase completed successfully',
    transaction: result
  });
});

/**
 * Get listings for a specific token
 * @route GET /api/marketplace/listings/:tokenId
 */
export const getListingsByToken = asyncHandler(async (req: Request, res: Response) => {
  const tokenId = req.params.tokenId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await marketplaceService.getListingsByToken(tokenId, page, limit);

  res.status(200).json({
    message: 'Token listings retrieved successfully',
    count: result.pagination.totalCount,
    pagination: result.pagination,
    listings: result.listings
  });
});

/**
 * Get listings by seller address
 * @route GET /api/marketplace/seller/:address
 */
export const getListingsBySeller = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.params.address;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const showAll = req.query.showAll === 'true';

  const result = await marketplaceService.getListingsBySeller(sellerId, page, limit, showAll);

  res.status(200).json({
    message: 'Seller listings retrieved successfully',
    count: result.pagination.totalCount,
    pagination: result.pagination,
    listings: result.listings
  });
});

/**
 * Make an offer on a token
 * @route POST /api/marketplace/offer
 */
export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  // This would be implemented in a production environment
  // For now, we'll return a placeholder response
  
  res.status(200).json({
    message: 'Offer creation feature coming soon',
    status: 'not implemented'
  });
});

/**
 * Respond to an offer (accept/reject)
 * @route PUT /api/marketplace/offer/:offerId
 */
export const respondToOffer = asyncHandler(async (req: Request, res: Response) => {
  // This would be implemented in a production environment
  // For now, we'll return a placeholder response
  
  res.status(200).json({
    message: 'Offer response feature coming soon',
    status: 'not implemented'
  });
});

/**
 * Get marketplace analytics
 * @route GET /api/marketplace/analytics
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await marketplaceService.getAnalytics();

  res.status(200).json({
    message: 'Marketplace analytics retrieved successfully',
    analytics
  });
});

/**
 * Update listing price
 * @route PUT /api/marketplace/listings/:listingId/price
 */
export const updateListingPrice = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.listingId;
  const { price } = req.body;
  const userId = req.user.id;

  if (!price || isNaN(parseFloat(price))) {
    return res.status(400).json({
      error: {
        message: 'Valid price is required'
      }
    });
  }

  const result = await marketplaceService.updateListingPrice(listingId, userId, parseFloat(price));

  res.status(200).json({
    message: result.message,
    listing: {
      id: result.listingId,
      price: result.newPrice
    }
  });
});