import express from 'express';
import * as metadataController from '../controllers/metadataController';
import authMiddleware from '../middleware/authMiddleware';
import asyncHandler from '../middleware/asyncHandler';

const router = express.Router();

/**
 * @route   GET /api/metadata/schema
 * @desc    Get metadata schema
 * @access  Public
 */
router.get('/schema', asyncHandler(metadataController.getMetadataSchema));

/**
 * @route   GET /api/metadata/search
 * @desc    Search content metadata
 * @access  Public
 */
router.get('/search', asyncHandler(metadataController.searchMetadata));

/**
 * @route   POST /api/metadata/index
 * @desc    Index content metadata for search
 * @access  Private
 */
router.post('/index', authMiddleware, asyncHandler(metadataController.indexMetadata));

/**
 * @route   POST /api/metadata/bulk
 * @desc    Get metadata for multiple content items
 * @access  Public
 */
router.post('/bulk', asyncHandler(metadataController.getBulkMetadata));

/**
 * @route   POST /api/metadata/generate
 * @desc    Generate metadata from external sources
 * @access  Private
 */
router.post('/generate', authMiddleware, asyncHandler(metadataController.generateMetadata));

/**
 * @route   POST /api/metadata/validate
 * @desc    Validate metadata against schema
 * @access  Public
 */
router.post('/validate', asyncHandler(metadataController.validateMetadata));

export default router; 