import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getGatewayStatistics,
  getActiveGatewayList,
  checkGatewayStatus,
  addNewGateway,
  refreshGatewayStats
} from '../controllers/gatewayController';

const router = express.Router();

/**
 * Get stats for all IPFS gateways
 * @route GET /api/gateways/stats
 * @access Private
 */
router.get('/stats', authMiddleware, getGatewayStatistics);

/**
 * Get list of active gateways
 * @route GET /api/gateways/active
 * @access Private
 */
router.get('/active', authMiddleware, getActiveGatewayList);

/**
 * Check a specific gateway
 * @route GET /api/gateways/check/:gatewayUrl
 * @access Private
 */
router.get('/check/:gatewayUrl', authMiddleware, checkGatewayStatus);

/**
 * Add a custom gateway
 * @route POST /api/gateways/add
 * @access Private
 */
router.post('/add', authMiddleware, addNewGateway);

/**
 * Refresh all gateway statistics
 * @route POST /api/gateways/refresh
 * @access Private
 */
router.post('/refresh', authMiddleware, refreshGatewayStats);

export default router; 