import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { libraryController } from '../controllers/library.controller';
import { libraryValidation } from '../validations/library.validation';

const router = express.Router();

// All library routes require authentication
router.use(authenticateToken);

// Get all libraries for the current user
router.get(
  '/',
  libraryController.getAllLibraries
);

// Get a single library by ID
router.get(
  '/:libraryId',
  validateRequest(libraryValidation.getLibrary),
  libraryController.getLibraryById
);

// Create a new library
router.post(
  '/',
  validateRequest(libraryValidation.createLibrary),
  libraryController.createLibrary
);

// Update a library
router.put(
  '/:libraryId',
  validateRequest(libraryValidation.updateLibrary),
  libraryController.updateLibrary
);

// Delete a library
router.delete(
  '/:libraryId',
  validateRequest(libraryValidation.deleteLibrary),
  libraryController.deleteLibrary
);

// Get all items in a library
router.get(
  '/:libraryId/items',
  validateRequest(libraryValidation.getLibraryItems),
  libraryController.getLibraryItems
);

// Add an item to a library
router.post(
  '/:libraryId/items',
  validateRequest(libraryValidation.addItemToLibrary),
  libraryController.addItemToLibrary
);

// Remove an item from a library
router.delete(
  '/:libraryId/items/:contentId',
  validateRequest(libraryValidation.removeItemFromLibrary),
  libraryController.removeItemFromLibrary
);

// Update an item in a library
router.put(
  '/:libraryId/items/:contentId',
  validateRequest(libraryValidation.updateItemInLibrary),
  libraryController.updateItemInLibrary
);

// Lending management
router.post('/items/:itemId/lend',
  validateRequest(libraryValidation.lendItem),
  libraryController.lendItem
);
router.post('/items/:itemId/return',
  validateRequest(libraryValidation.returnItem),
  libraryController.returnItem
);
router.get('/items/:itemId/lending-history',
  validateRequest(libraryValidation.getLendingHistory),
  libraryController.getLendingHistory
);

// Selling management
router.post('/items/:itemId/sell',
  validateRequest(libraryValidation.sellItem),
  libraryController.sellItem
);
router.post('/items/:itemId/cancel-sale',
  validateRequest(libraryValidation.cancelSale),
  libraryController.cancelSale
);
router.get('/items/:itemId/sale-history',
  validateRequest(libraryValidation.getSaleHistory),
  libraryController.getSaleHistory
);

// Get library details
router.get(
  '/:libraryId',
  validateRequest(libraryValidation.getLibrary),
  libraryController.getLibrary
);

// Get library content
router.get(
  '/:libraryId/content',
  validateRequest(libraryValidation.getLibraryContent),
  libraryController.getLibraryContent
);

// Add content to library
router.post(
  '/:libraryId/content',
  validateRequest(libraryValidation.addContent),
  libraryController.addContent
);

// Lend content
router.post(
  '/:libraryId/content/:contentId/lend',
  validateRequest(libraryValidation.lendContent),
  libraryController.lendContent
);

// Return lent content
router.post(
  '/:libraryId/content/:contentId/return',
  validateRequest(libraryValidation.returnContent),
  libraryController.returnContent
);

// Update content value
router.put(
  '/:libraryId/content/:contentId/value',
  validateRequest(libraryValidation.updateContentValue),
  libraryController.updateContentValue
);

export default router; 