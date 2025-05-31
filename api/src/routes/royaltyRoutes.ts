import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  addRoyaltyRecipient,
  updateRoyaltyRecipient,
  removeRoyaltyRecipient,
  batchUpdateRecipients,
  distributeRoyalties,
  withdrawRoyalties,
  getRoyaltyRecipients,
  getTotalRoyaltyShares,
  getRecipientBalance,
  getDistributionHistory,
  getRecipientAnalytics,
  getTokenAnalytics,
  getRoyaltyOverview,
  getRoyaltyHealth
} from '../controllers/royaltyController';

const router: ExpressRouter = Router();

// Health check
router.get('/health', getRoyaltyHealth);

// System overview
router.get('/overview', getRoyaltyOverview);

// Recipient management
router.post('/recipients', addRoyaltyRecipient);
router.put('/recipients/:index', updateRoyaltyRecipient);
router.delete('/recipients/:index', removeRoyaltyRecipient);
router.put('/recipients/batch', batchUpdateRecipients);

// Distribution operations
router.post('/distribute', distributeRoyalties);
router.post('/withdraw', withdrawRoyalties);

// Query operations
router.get('/recipients/:tokenContract/:tokenId', getRoyaltyRecipients);
router.get('/shares/:tokenContract/:tokenId', getTotalRoyaltyShares);
router.get('/balance/:address', getRecipientBalance);
router.get('/history/:tokenContract/:tokenId', getDistributionHistory);

// Analytics
router.get('/analytics/recipient/:address', getRecipientAnalytics);
router.get('/analytics/token/:tokenContract/:tokenId', getTokenAnalytics);

export default router; 