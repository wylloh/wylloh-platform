import express, { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  archiveContent,
  getAllDeals,
  getDealByCid,
  checkContentOnFilecoin,
  processScheduledDeals,
  retrieveContent
} from '../controllers/filecoinController.js';

const router: Router = express.Router();

/**
 * Archive content to Filecoin
 * @route POST /api/filecoin/archive
 * @access Private
 */
router.post('/archive', authMiddleware, archiveContent);

/**
 * Get all Filecoin deals
 * @route GET /api/filecoin/deals
 * @access Private
 */
router.get('/deals', authMiddleware, getAllDeals);

/**
 * Get Filecoin deal by CID
 * @route GET /api/filecoin/deals/:cid
 * @access Private
 */
router.get('/deals/:cid', authMiddleware, getDealByCid);

/**
 * Check if content is stored on Filecoin
 * @route GET /api/filecoin/check/:cid
 * @access Private
 */
router.get('/check/:cid', authMiddleware, checkContentOnFilecoin);

/**
 * Process scheduled deals
 * @route POST /api/filecoin/process-deals
 * @access Private
 */
router.post('/process-deals', authMiddleware, processScheduledDeals);

/**
 * Retrieve content from Filecoin
 * @route POST /api/filecoin/retrieve
 * @access Private
 */
router.post('/retrieve', authMiddleware, retrieveContent);

export default router; 