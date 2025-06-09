import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validation';
import { libraryController } from '../controllers/library.controller';
import { libraryValidation } from '../validations/library.validation';

const router: express.Router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get library details
router.get(
  '/:libraryId',
  validateRequest({ params: libraryValidation.getLibrary }),
  libraryController.getLibrary
);

// Get library content
router.get(
  '/:libraryId/content',
  validateRequest({ params: libraryValidation.getLibraryContent }),
  libraryController.getLibraryContent
);

// Add content to library
router.post(
  '/:libraryId/content',
  validateRequest({ body: libraryValidation.addContent }),
  libraryController.addContent
);

// Lend content
router.post(
  '/:libraryId/content/:contentId/lend',
  validateRequest({ body: libraryValidation.lendContent }),
  libraryController.lendContent
);

// Return lent content
router.post(
  '/:libraryId/content/:contentId/return',
  validateRequest({ params: libraryValidation.returnContent }),
  libraryController.returnContent
);

// Update content value
router.put(
  '/:libraryId/content/:contentId/value',
  validateRequest({ body: libraryValidation.updateContentValue }),
  libraryController.updateContentValue
);

export default router; 