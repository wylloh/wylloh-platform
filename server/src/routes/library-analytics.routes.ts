import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { libraryAnalyticsController } from '../controllers/library-analytics.controller';
import { libraryAnalyticsValidation } from '../validations/library-analytics.validation';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get library analytics
router.get('/:libraryId', 
  validateRequest(libraryAnalyticsValidation.getAnalytics),
  libraryAnalyticsController.getLibraryAnalytics
);

// Update library value
router.post('/:libraryId/value',
  validateRequest(libraryAnalyticsValidation.updateValue),
  libraryAnalyticsController.updateLibraryValue
);

// Track lending activity
router.post('/:libraryId/lending',
  validateRequest(libraryAnalyticsValidation.trackLending),
  libraryAnalyticsController.trackLending
);

// Track engagement metrics
router.post('/:libraryId/engagement',
  validateRequest(libraryAnalyticsValidation.trackEngagement),
  libraryAnalyticsController.trackEngagement
);

// Get value trends
router.get('/:libraryId/trends',
  validateRequest(libraryAnalyticsValidation.getValueTrends),
  libraryAnalyticsController.getValueTrends
);

export default router; 