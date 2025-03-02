import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createError, asyncHandler } from '../middleware/errorHandler';

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
 * Update user profile
 * @route PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { username, email } = req.body;

  // Find user
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    throw createError('User not found', 404);
  }

  // Update user
  if (username) users[userIndex].username = username;
  if (email) users[userIndex].email = email;

  res.status(200).json({
    message: 'User profile updated',
    user: {
      id: users[userIndex].id,
      username: users[userIndex].username,
      email: users[userIndex].email,
      roles: users[userIndex].roles
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