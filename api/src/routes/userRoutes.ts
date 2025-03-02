import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, roleAuthorization } from '../middleware/authMiddleware';

// Note: Controllers will be implemented later
// This sets up the structure for routes

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  // Will call userController.register
  res.status(201).json({
    message: 'User registration route - To be implemented'
  });
}));

/**
 * @route   POST /api/users/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  // Will call userController.login
  res.status(200).json({
    message: 'User login route - To be implemented'
  });
}));

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  // Will call userController.getProfile
  res.status(200).json({
    message: 'User profile route - To be implemented',
    user: req.user
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  // Will call userController.updateProfile
  res.status(200).json({
    message: 'Update user profile route - To be implemented'
  });
}));

/**
 * @route   GET /api/users/wallet
 * @desc    Get user wallet information
 * @access  Private
 */
router.get('/wallet', authMiddleware, asyncHandler(async (req, res) => {
  // Will call userController.getWalletInfo
  res.status(200).json({
    message: 'Get wallet info route - To be implemented'
  });
}));

/**
 * @route   POST /api/users/wallet
 * @desc    Connect user wallet
 * @access  Private
 */
router.post('/wallet', authMiddleware, asyncHandler(async (req, res) => {
  // Will call userController.connectWallet
  res.status(200).json({
    message: 'Connect wallet route - To be implemented'
  });
}));

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authMiddleware, roleAuthorization(['admin']), asyncHandler(async (req, res) => {
  // Will call userController.getAllUsers
  res.status(200).json({
    message: 'Get all users route (admin only) - To be implemented'
  });
}));

export default router;