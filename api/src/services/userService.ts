import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { createError } from '../middleware/errorHandler';
import User, { IUser } from '../models/User';
import authService from './authService';

/**
 * Service for user management
 */
class UserService {
  /**
   * Create a new user
   * @param userData User data object
   */
  async createUser(userData: any) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw createError('Email already in use', 400);
        } else {
          throw createError('Username already taken', 400);
        }
      }

      // Create user (password will be hashed by pre-save hook)
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        roles: userData.roles || ['user']
      });

      // Save user
      const savedUser = await user.save();
      
      // Generate JWT token
      const token = authService.generateToken(savedUser.id);

      return { user: savedUser, token };
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw createError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param userId User ID
   */
  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw createError('User not found', 404);
      }

      return user;
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid user ID', 400);
      }
      throw error;
    }
  }

  /**
   * Get user by email
   * @param email User email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by wallet address
   * @param walletAddress Wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<IUser | null> {
    try {
      return await User.findOne({ walletAddress });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user data
   * @param userId User ID
   * @param updateData Update data object
   */
  async updateUser(userId: string, updateData: any): Promise<IUser> {
    try {
      // Check if username or email is being updated and already exists
      if (updateData.username) {
        const existingUsername = await User.findOne({ 
          username: updateData.username,
          _id: { $ne: userId }
        });
        
        if (existingUsername) {
          throw createError('Username already taken', 400);
        }
      }

      if (updateData.email) {
        const existingEmail = await User.findOne({ 
          email: updateData.email,
          _id: { $ne: userId }
        });
        
        if (existingEmail) {
          throw createError('Email already in use', 400);
        }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw createError('User not found', 404);
      }

      return updatedUser;
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid user ID', 400);
      }
      if (error instanceof mongoose.Error.ValidationError) {
        throw createError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Connect wallet address to user
   * @param userId User ID
   * @param walletAddress Wallet address
   */
  async connectWallet(userId: string, walletAddress: string): Promise<IUser> {
    try {
      // Check if wallet address is already connected to another account
      const existingWallet = await User.findOne({ 
        walletAddress,
        _id: { $ne: userId }
      });
      
      if (existingWallet) {
        throw createError('Wallet address is already connected to another account', 400);
      }

      // Update user with wallet address
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { walletAddress } },
        { new: true }
      );

      if (!updatedUser) {
        throw createError('User not found', 404);
      }

      return updatedUser;
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid user ID', 400);
      }
      throw error;
    }
  }

  /**
   * Change user password
   * @param userId User ID
   * @param currentPassword Current password
   * @param newPassword New password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw createError('User not found', 404);
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw createError('Current password is incorrect', 401);
      }

      // Update password
      user.password = newPassword;
      await user.save();
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid user ID', 400);
      }
      throw error;
    }
  }

  /**
   * Update last login timestamp
   * @param userId User ID
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        { $set: { lastLogin: new Date() } }
      );
    } catch (error) {
      // Don't throw an error for this operation
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Get all users with pagination
   * @param page Page number
   * @param limit Items per page
   */
  async getAllUsers(page: number = 1, limit: number = 10) {
    try {
      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const totalCount = await User.countDocuments();

      return {
        users,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user roles (admin only)
   * @param userId User ID
   * @param roles Array of roles
   */
  async updateUserRoles(userId: string, roles: string[]): Promise<IUser> {
    try {
      // Validate roles
      const validRoles = ['user', 'creator', 'admin'];
      const invalidRoles = roles.filter(role => !validRoles.includes(role));
      
      if (invalidRoles.length > 0) {
        throw createError(`Invalid roles: ${invalidRoles.join(', ')}`, 400);
      }

      // Update user roles
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { roles } },
        { new: true }
      );

      if (!updatedUser) {
        throw createError('User not found', 404);
      }

      return updatedUser;
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid user ID', 400);
      }
      throw error;
    }
  }

  /**
   * Delete user account
   * @param userId User ID
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const result = await User.findByIdAndDelete(userId);
      
      if (!result) {
        throw createError('User not found', 404);
      }
      
      // In a production system, we would:
      // 1. Handle related data (content, listings, etc.)
      // 2. Consider soft deletion instead of hard deletion
      // 3. Implement additional cleanup operations
    } catch (error) {
      if (error.name === 'CastError') {
        throw createError('Invalid user ID', 400);
      }
      throw error;
    }
  }
}

export default new UserService();