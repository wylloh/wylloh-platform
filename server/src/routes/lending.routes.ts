import express from 'express';
import { lendingController } from '../controllers/lending.controller';
import { validateRequest } from '../middleware/validate';
import { lendingValidation } from '../validations/lending.validation';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/lending/register
 * @desc    Register a new lending request (first step of blockchain lending)
 * @access  Private
 */
router.post(
  '/register',
  authenticate,
  validateRequest(lendingValidation.registerLending),
  lendingController.registerLending
);

/**
 * @route   POST /api/lending/confirm
 * @desc    Confirm a lending transaction (after blockchain transaction)
 * @access  Private
 */
router.post(
  '/confirm',
  authenticate,
  validateRequest(lendingValidation.confirmLending),
  lendingController.confirmLending
);

/**
 * @route   POST /api/lending/return
 * @desc    Register a content return transaction
 * @access  Private
 */
router.post(
  '/return',
  authenticate,
  validateRequest(lendingValidation.returnContent),
  lendingController.returnContent
);

/**
 * @route   POST /api/lending/cancel
 * @desc    Cancel a lending agreement
 * @access  Private
 */
router.post(
  '/cancel',
  authenticate,
  validateRequest(lendingValidation.cancelLending),
  lendingController.cancelLending
);

/**
 * @route   POST /api/lending/payment
 * @desc    Register a payment for lending
 * @access  Private
 */
router.post(
  '/payment',
  authenticate,
  validateRequest(lendingValidation.paymentForLending),
  lendingController.paymentForLending
);

/**
 * @route   GET /api/lending/history/:contentId
 * @desc    Get lending history for a content
 * @access  Private
 */
router.get(
  '/history/:contentId',
  authenticate,
  lendingController.getLendingHistory
);

/**
 * @route   GET /api/lending/my-active-lendings
 * @desc    Get active lendings for the current user
 * @access  Private
 */
router.get(
  '/my-active-lendings',
  authenticate,
  lendingController.getMyActiveLendings
);

/**
 * @route   GET /api/lending/my-active-borrowings
 * @desc    Get active borrowings for the current user
 * @access  Private
 */
router.get(
  '/my-active-borrowings',
  authenticate,
  lendingController.getMyActiveBorrowings
);

/**
 * @route   GET /api/lending/:lendingId
 * @desc    Get details for a specific lending
 * @access  Private
 */
router.get(
  '/:lendingId',
  authenticate,
  lendingController.getLendingById
);

export default router; 