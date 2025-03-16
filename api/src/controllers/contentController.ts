import { Request, Response } from 'express';
import { createError, asyncHandler } from '../middleware/errorHandler';

// Note: This is a placeholder implementation
// In a real implementation, you would use a database model for content

// Temporary storage for demo purposes
const contentItems: any[] = [];

/**
 * Create new content
 * @route POST /api/content
 */
export const createContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { title, description, contentType, ipfsCid } = req.body;

  // Validate input
  if (!title || !contentType || !ipfsCid) {
    throw createError('Please provide title, contentType and ipfsCid', 400);
  }

  // Create content
  const newContent = {
    id: Date.now().toString(),
    title,
    description,
    contentType,
    ipfsCid,
    creator: userId,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  contentItems.push(newContent);

  res.status(201).json({
    message: 'Content created successfully',
    content: newContent
  });
});

/**
 * Get all content with pagination
 * @route GET /api/content
 */
export const getAllContent = asyncHandler(async (req: Request, res: Response) => {
  // Get pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Filter by content type
  const contentType = req.query.contentType as string;
  let filteredContent = [...contentItems];
  
  if (contentType) {
    filteredContent = filteredContent.filter(item => item.contentType === contentType);
  }

  // Pagination result
  const paginatedContent = filteredContent.slice(startIndex, endIndex);

  res.status(200).json({
    message: 'Content retrieved successfully',
    count: filteredContent.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(filteredContent.length / limit)
    },
    content: paginatedContent
  });
});

/**
 * Get content by ID
 * @route GET /api/content/:id
 */
export const getContentById = asyncHandler(async (req: Request, res: Response) => {
  const contentId = req.params.id;

  // Find content
  const content = contentItems.find(item => item.id === contentId);
  if (!content) {
    throw createError('Content not found', 404);
  }

  res.status(200).json({
    message: 'Content retrieved successfully',
    content
  });
});

/**
 * Update content
 * @route PUT /api/content/:id
 */
export const updateContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const contentId = req.params.id;
  const { title, description, status } = req.body;

  // Find content
  const contentIndex = contentItems.findIndex(item => item.id === contentId);
  if (contentIndex === -1) {
    throw createError('Content not found', 404);
  }

  // Check ownership
  if (contentItems[contentIndex].creator !== userId) {
    throw createError('Not authorized to update this content', 403);
  }

  // Update content
  if (title) contentItems[contentIndex].title = title;
  if (description) contentItems[contentIndex].description = description;
  if (status) contentItems[contentIndex].status = status;
  
  contentItems[contentIndex].updatedAt = new Date().toISOString();

  res.status(200).json({
    message: 'Content updated successfully',
    content: contentItems[contentIndex]
  });
});

/**
 * Delete content
 * @route DELETE /api/content/:id
 */
export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const contentId = req.params.id;

  // Find content
  const contentIndex = contentItems.findIndex(item => item.id === contentId);
  if (contentIndex === -1) {
    throw createError('Content not found', 404);
  }

  // Check ownership
  if (contentItems[contentIndex].creator !== userId) {
    throw createError('Not authorized to delete this content', 403);
  }

  // Remove content
  const deletedContent = contentItems.splice(contentIndex, 1)[0];

  res.status(200).json({
    message: 'Content deleted successfully',
    content: deletedContent
  });
});

/**
 * Get content by creator ID
 * @route GET /api/content/creator/:creatorId
 */
export const getContentByCreator = asyncHandler(async (req: Request, res: Response) => {
  const creatorId = req.params.creatorId;

  // Filter content by creator
  const creatorContent = contentItems.filter(item => item.creator === creatorId);

  res.status(200).json({
    message: 'Creator content retrieved successfully',
    count: creatorContent.length,
    content: creatorContent
  });
});

/**
 * Update content metadata
 * @route POST /api/content/:id/metadata
 */
export const updateMetadata = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const contentId = req.params.id;
  const { metadata } = req.body;

  // Validate input
  if (!metadata) {
    throw createError('Please provide metadata', 400);
  }

  // Find content
  const contentIndex = contentItems.findIndex(item => item.id === contentId);
  if (contentIndex === -1) {
    throw createError('Content not found', 404);
  }

  // Check ownership
  if (contentItems[contentIndex].creator !== userId) {
    throw createError('Not authorized to update this content', 403);
  }

  // Update metadata
  contentItems[contentIndex].metadata = {
    ...contentItems[contentIndex].metadata,
    ...metadata
  };
  
  contentItems[contentIndex].updatedAt = new Date().toISOString();

  res.status(200).json({
    message: 'Content metadata updated successfully',
    content: contentItems[contentIndex]
  });
});

/**
 * Search content
 * @route GET /api/content/search
 */
export const searchContent = asyncHandler(async (req: Request, res: Response) => {
  const { query, contentType } = req.query;

  // Filter content
  let searchResults = [...contentItems];
  
  if (query) {
    const searchQuery = (query as string).toLowerCase();
    searchResults = searchResults.filter(
      item => item.title.toLowerCase().includes(searchQuery) || 
             (item.description && item.description.toLowerCase().includes(searchQuery))
    );
  }
  
  if (contentType) {
    searchResults = searchResults.filter(item => item.contentType === contentType);
  }

  res.status(200).json({
    message: 'Search results retrieved successfully',
    count: searchResults.length,
    content: searchResults
  });
});

/**
 * Get content by the authenticated creator
 * @route GET /api/content/creator
 */
export const getMyContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // Filter content by authenticated creator
  const creatorContent = contentItems.filter(item => item.creator === userId);

  res.status(200).json({
    message: 'Your content retrieved successfully',
    count: creatorContent.length,
    data: creatorContent
  });
});

/**
 * Get all public content for marketplace
 * @route GET /api/content/marketplace
 */
export const getMarketplaceContent = asyncHandler(async (req: Request, res: Response) => {
  // Filter for public and active content that is tokenized
  const marketplaceContent = contentItems.filter(
    item => item.status === 'active' && 
            item.visibility === 'public'
  );

  res.status(200).json({
    message: 'Marketplace content retrieved successfully',
    count: marketplaceContent.length,
    data: marketplaceContent
  });
});

/**
 * Tokenize content
 * @route POST /api/content/:id/tokenize
 */
export const tokenizeContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const contentId = req.params.id;
  const { initialSupply, royaltyPercentage, initialPrice, rightsThresholds } = req.body;

  // Validate input
  if (!initialSupply || !initialPrice) {
    throw createError('Please provide initialSupply and initialPrice', 400);
  }

  // Find content
  const contentIndex = contentItems.findIndex(item => item.id === contentId);
  if (contentIndex === -1) {
    throw createError('Content not found', 404);
  }

  // Check ownership
  if (contentItems[contentIndex].creator !== userId) {
    throw createError('Not authorized to tokenize this content', 403);
  }

  // In a real implementation, this would interact with a blockchain
  // Mock tokenization process
  const tokenId = `0x${Math.random().toString(16).substring(2, 10)}`;
  
  // Update content with tokenization info
  contentItems[contentIndex] = {
    ...contentItems[contentIndex],
    tokenized: true,
    tokenId,
    initialSupply,
    availableSupply: initialSupply,
    price: parseFloat(initialPrice),
    royaltyPercentage,
    rightsThresholds,
    status: 'active', // Automatically activate tokenized content
    visibility: 'public', // Make tokenized content public
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    message: 'Content tokenized successfully',
    content: contentItems[contentIndex]
  });
});