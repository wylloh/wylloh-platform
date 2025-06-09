import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, roleAuthorization } from '../middleware/authMiddleware';
import * as contentController from '../controllers/contentController';

// Note: Controllers will be implemented later
// This sets up the structure for routes

const router: express.Router = express.Router();

/**
 * @route   POST /api/content
 * @desc    Create new content entry
 * @access  Private/Creator
 */
router.post('/', authMiddleware, roleAuthorization(['creator', 'admin']), asyncHandler(contentController.createContent));

/**
 * @route   GET /api/content
 * @desc    Get all content with pagination
 * @access  Public
 */
router.get('/', asyncHandler(contentController.getAllContent));

/**
 * @route   GET /api/content/:id
 * @desc    Get content by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(contentController.getContentById));

/**
 * @route   PUT /api/content/:id
 * @desc    Update content
 * @access  Private/Creator
 */
router.put('/:id', authMiddleware, asyncHandler(contentController.updateContent));

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete content
 * @access  Private/Creator
 */
router.delete('/:id', authMiddleware, asyncHandler(contentController.deleteContent));

/**
 * @route   GET /api/content/creator
 * @desc    Get content by the authenticated creator
 * @access  Private/Creator
 */
router.get('/creator', authMiddleware, roleAuthorization(['creator', 'admin']), asyncHandler(contentController.getMyContent));

/**
 * @route   GET /api/content/creator/:creatorId
 * @desc    Get content by creator ID
 * @access  Public
 */
router.get('/creator/:creatorId', asyncHandler(contentController.getContentByCreator));

/**
 * @route   GET /api/content/marketplace
 * @desc    Get all public content for marketplace
 * @access  Public
 */
router.get('/marketplace', asyncHandler(contentController.getMarketplaceContent));

/**
 * @route   POST /api/content/:id/metadata
 * @desc    Update content metadata
 * @access  Private/Creator
 */
router.post('/:id/metadata', authMiddleware, asyncHandler(contentController.updateMetadata));

/**
 * @route   POST /api/content/:id/tokenize
 * @desc    Tokenize content
 * @access  Private/Creator
 */
router.post('/:id/tokenize', authMiddleware, asyncHandler(contentController.tokenizeContent));

/**
 * @route   GET /api/content/search
 * @desc    Search content
 * @access  Public
 */
router.get('/search', asyncHandler(contentController.searchContent));

export default router;