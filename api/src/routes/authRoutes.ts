import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import authService from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

const router: ExpressRouter = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  try {
    const result = await authService.loginUser(email, password);
    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @route   POST /api/auth/register
 * @desc    Register user
 * @access  Public
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide username, email and password'
    });
  }

  try {
    const result = await authService.registerUser({ username, email, password });
    res.status(201).json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @route   POST /api/auth/wallet/connect
 * @desc    Connect wallet and authenticate or check for existing profile - SECURE VERSION
 * @access  Public
 */
router.post('/wallet/connect', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  // 🔒 SECURITY: Enhanced input validation
  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid wallet address is required'
    });
  }

  try {
    // 🔒 SECURITY: Pass client IP for rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const result = await authService.walletAuth(walletAddress, undefined, clientIP);
    
    // 🔒 SECURITY: Only return safe user data
    res.status(200).json({
      success: true,
      token: result.token,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        roles: result.user.roles,
        walletAddress: result.user.walletAddress,
        isVerified: result.user.isVerified,
        lastLogin: result.user.lastLogin
      }
    });
  } catch (error: any) {
    console.error('❌ Wallet connect error:', error);
    
    // 🔒 SECURITY: Return appropriate status codes
    const statusCode = error.statusCode || (error.message.includes('rate limit') ? 429 : 400);
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Wallet authentication failed'
    });
  }
}));

/**
 * @route   POST /api/auth/wallet/create-profile
 * @desc    Create new profile for connected wallet - SECURE VERSION
 * @access  Public
 */
router.post('/wallet/create-profile', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress, username, email } = req.body;

  // 🔒 SECURITY: Enhanced input validation
  if (!walletAddress || typeof walletAddress !== 'string' || !username || typeof username !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid wallet address and username are required'
    });
  }

  // 🔒 SECURITY: Validate email if provided
  if (email && typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email must be a valid string'
    });
  }

  try {
    // 🔒 SECURITY: Pass client IP for rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const result = await authService.createWalletProfile(walletAddress, { username, email }, clientIP);
    
    // 🔒 SECURITY: Only return safe user data
    res.status(201).json({
      success: true,
      token: result.token,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        roles: result.user.roles,
        walletAddress: result.user.walletAddress,
        isVerified: result.user.isVerified,
        createdAt: result.user.createdAt
      }
    });
  } catch (error: any) {
    console.error('❌ Wallet profile creation error:', error);
    
    // 🔒 SECURITY: Return appropriate status codes
    const statusCode = error.statusCode || (error.message.includes('rate limit') ? 429 : 400);
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create wallet profile'
    });
  }
}));

export default router; 