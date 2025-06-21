import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createError, asyncHandler } from '../middleware/errorHandler';
import User from '../models/User';

// Note: This is a placeholder implementation
// In a real implementation, you would use a database model for users

// Temporary storage for demo purposes
const users: any[] = [];

/**
 * Register a new user
 * @route POST /api/users/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    throw createError('Please provide username, email and password', 400);
  }

  // Check if user already exists
  const userExists = users.find(user => user.email === email);
  if (userExists) {
    throw createError('User already exists', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password: hashedPassword,
    roles: ['user'],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  // Generate token
  const token = generateToken(newUser.id);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roles: newUser.roles
    },
    token
  });
});

/**
 * Authenticate user & get token
 * @route POST /api/users/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw createError('Please provide email and password', 400);
  }

  // Find user
  const user = users.find(user => user.email === email);
  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user.id);

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles
    },
    token
  });
});

/**
 * Get user profile
 * @route GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // User is already attached to request by authMiddleware
  const userId = req.user?.id;

  // Find user
  const user = users.find(user => user.id === userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    message: 'User profile retrieved',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles
    }
  });
});

/**
 * Update user profile - MONGODB VERSION
 * @route PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { username, email } = req.body;

  // Validate input
  if (!username && !email) {
    throw createError('Please provide username or email to update', 400);
  }

  if (username && username.trim().length < 3) {
    throw createError('Username must be at least 3 characters long', 400);
  }

  // Find user in MongoDB
  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Check if username is already taken (if updating username)
  if (username && username.trim() !== user.username) {
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      throw createError('Username already taken', 400);
    }
  }

  // Update user in MongoDB
  if (username) user.username = username.trim();
  if (email) user.email = email.trim();
  
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified,
      proStatus: user.proStatus
    }
  });
});

/**
 * Connect wallet address to user
 * @route POST /api/users/wallet
 */
export const connectWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { walletAddress, signature } = req.body;

  // Validate input
  if (!walletAddress || !signature) {
    throw createError('Please provide wallet address and signature', 400);
  }

  // Find user
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    throw createError('User not found', 404);
  }

  // Verify signature (in a real implementation)
  // This would validate that the user actually controls the wallet

  // Update user with wallet address
  users[userIndex].walletAddress = walletAddress;

  res.status(200).json({
    message: 'Wallet connected successfully',
    walletAddress
  });
});

/**
 * Get all users (admin only)
 * @route GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  // This endpoint would be protected by roleAuthorization middleware

  const userList = users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles
  }));

  res.status(200).json({
    message: 'Users retrieved successfully',
    count: userList.length,
    users: userList
  });
});

/**
 * Generate JWT token
 */
const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET || 'defaultsecret';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

/**
 * @desc    Request Pro status verification
 * @route   POST /api/users/pro-status/request
 * @access  Private
 */
export const requestProStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { fullName, biography, professionalLinks, filmographyHighlights } = req.body;

    // Validate required fields
    if (!fullName || !biography || !filmographyHighlights) {
      throw createError('Full name, biography, and filmography highlights are required', 400);
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if user already has a pending or approved request
    if (user.proStatus === 'pending') {
      throw createError('You already have a pending Pro status request', 400);
    }
    if (user.proStatus === 'verified') {
      throw createError('You already have verified Pro status', 400);
    }

    // Update user with Pro request data
    user.proStatus = 'pending';
    user.proVerificationData = {
      fullName,
      biography,
      professionalLinks: professionalLinks || {},
      filmographyHighlights
    };
    user.dateProRequested = new Date();
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Pro status request submitted successfully',
      data: {
        proStatus: user.proStatus,
        dateRequested: user.dateProRequested
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Get all pending Pro status requests (admin only)
 * @route   GET /api/users/pro-status/pending
 * @access  Private/Admin
 */
export const getPendingProRequests = async (req: Request, res: Response) => {
  try {
    const pendingRequests = await User.find(
      { proStatus: 'pending' },
      { 
        password: 0, // Exclude password field
        resetPasswordToken: 0,
        resetPasswordExpire: 0,
        emailVerificationToken: 0
      }
    ).sort({ dateProRequested: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      data: pendingRequests
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Approve Pro status request (admin only)
 * @route   PUT /api/users/pro-status/:userId/approve
 * @access  Private/Admin
 */
export const approveProStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.proStatus !== 'pending') {
      throw createError('User does not have a pending Pro status request', 400);
    }

    // Update user status
    user.proStatus = 'verified';
    user.dateProApproved = new Date();
    user.roles = [...new Set([...user.roles, 'creator'])]; // Add creator role if not present
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Pro status approved successfully',
      data: {
        userId: user._id,
        username: user.username,
        proStatus: user.proStatus,
        dateApproved: user.dateProApproved
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Reject Pro status request (admin only)
 * @route   PUT /api/users/pro-status/:userId/reject
 * @access  Private/Admin
 */
export const rejectProStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.proStatus !== 'pending') {
      throw createError('User does not have a pending Pro status request', 400);
    }

    // Update user status
    user.proStatus = 'rejected';
    user.proRejectionReason = reason || 'No reason provided';
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Pro status request rejected',
      data: {
        userId: user._id,
        username: user.username,
        proStatus: user.proStatus,
        rejectionReason: user.proRejectionReason
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};