import express from 'express';
import * as metadataController from '../controllers/metadataController';
import authMiddleware from '../middleware/authMiddleware';

const router: express.Router = express.Router();

/**
 * @route   GET /api/metadata/schema
 * @desc    Get metadata schema
 * @access  Public
 */
router.get('/schema', metadataController.getMetadataSchema as any);

/**
 * @route   GET /api/metadata/search
 * @desc    Search content metadata
 * @access  Public
 */
router.get('/search', metadataController.searchMetadata as any);

/**
 * @route   POST /api/metadata/index
 * @desc    Index content metadata for search
 * @access  Private
 */
router.post('/index', authMiddleware, metadataController.indexMetadata as any);

/**
 * @route   POST /api/metadata/bulk
 * @desc    Get metadata for multiple content items
 * @access  Public
 */
router.post('/bulk', metadataController.getBulkMetadata as any);

/**
 * @route   POST /api/metadata/generate
 * @desc    Generate metadata from external sources
 * @access  Private
 */
router.post('/generate', authMiddleware, metadataController.generateMetadata as any);

/**
 * @route   POST /api/metadata/validate
 * @desc    Validate metadata against schema
 * @access  Public
 */
router.post('/validate', metadataController.validateMetadata as any);

export default router; 