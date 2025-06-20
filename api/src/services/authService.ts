import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { createError } from '../middleware/errorHandler';
import User, { IUser } from '../models/User';
import { validateWalletAddress, validateAndSanitizeUsername, validateAndSanitizeEmail, checkRateLimit } from '../utils/validation';
import { isAdminWallet, SECURITY_CONFIG } from '../config/security';
// Import a proper email sending service in a real implementation
// import emailService from './emailService';

/**
 * Service for authentication operations
 */
class AuthService {
  /**
   * Register new user
   * @param userData User registration data
   */
  async registerUser(userData: any): Promise<{ user: IUser; token: string }> {
    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw createError('User already exists', 400);
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Login user
   * @param email User email
   * @param password User password
   */
  async loginUser(email: string, password: string) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError('Invalid credentials', 401);
    }

    // Generate token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Generate JWT token
   * @param userId User ID
   */
  generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'defaultsecret';
    return jwt.sign({ id: userId }, secret, {
      expiresIn: '30d'
    });
  }

  /**
   * Verify JWT token
   * @param token JWT token
   */
  verifyToken(token: string): jwt.JwtPayload | string {
    try {
      const secret = process.env.JWT_SECRET || 'defaultsecret';
      return jwt.verify(token, secret);
    } catch (error) {
      throw createError('Invalid token', 401);
    }
  }

  /**
   * Login or register with wallet (Web3-first approach) - SECURE VERSION
   * @param walletAddress Wallet address
   * @param userData Optional user data for profile creation
   * @param clientIP Client IP for rate limiting
   */
  async walletAuth(walletAddress: string, userData?: { username?: string, email?: string }, clientIP?: string) {
    // 🔒 SECURITY: Validate wallet address format
    if (!validateWalletAddress(walletAddress)) {
      throw createError('Invalid wallet address format', 400);
    }

    // 🔒 SECURITY: Rate limiting
    const rateLimitKey = `wallet_auth_${clientIP || 'unknown'}`;
    if (!checkRateLimit(rateLimitKey, SECURITY_CONFIG.WALLET_CONNECT_RATE_LIMIT, SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS)) {
      throw createError('Too many wallet connection attempts. Please try again later.', 429);
    }

    const normalizedAddress = walletAddress.toLowerCase();
    
    // 🔒 SECURITY: Use secure admin wallet checking
    const isAdmin = isAdminWallet(normalizedAddress);

    // 🏗️ ARCHITECTURE: Transaction setup (disabled for single MongoDB instance)
    // TODO: Enable when scaling to replica set (just uncomment these lines)
    // const session = await mongoose.startSession();
    
    try {
      let user: IUser | null = null;
      
      // 🏗️ ARCHITECTURE: Replica-set ready structure (transactions disabled for now)
      // When we scale to replica sets, just uncomment the session.withTransaction wrapper
      // await session.withTransaction(async () => {
        
        // Find user with this wallet address
        user = await User.findOne({ walletAddress: normalizedAddress });
        // For replica sets: add .session(session)

        if (!user) {
          // Create new user if this wallet is not associated with any account
          const username = userData?.username || `user_${walletAddress.substring(2, 8)}`;
          const email = userData?.email || `${walletAddress.substring(2, 8)}@wallet.local`;
          
          user = new User({
            username,
            email,
            password: crypto.randomBytes(32).toString('hex'), // Secure random password
            walletAddress: normalizedAddress,
            roles: isAdmin ? ['admin', 'user'] : ['user'],
            isVerified: true // Wallet connection serves as verification
          });

          await user.save();
          // For replica sets: add { session }
          console.log(`✅ Created new wallet user: ${username} (${walletAddress})${isAdmin ? ' - ADMIN' : ''}`);
        } else {
          // Update existing user with admin role if needed
          if (isAdmin && !user.roles.includes('admin')) {
            user.roles.push('admin');
            await user.save();
            // For replica sets: add { session }
            console.log(`✅ Granted admin role to: ${user.username}`);
          }
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();
        // For replica sets: add { session }
        
      // }); // Uncomment this closing brace when enabling transactions

      if (!user) {
        throw createError('Unable to authenticate wallet. Please try again.', 500);
      }

      // Generate secure token
      const token = this.generateToken(user.id);

      return { user, token };
    } catch (error) {
      console.error('❌ Wallet authentication error:', error);
      
      // 🎨 UX: Convert technical errors to user-friendly messages
      if (error.message && error.message.includes('duplicate key')) {
        throw createError('This wallet is already registered. Please try connecting again.', 400);
      }
      if (error.message && error.message.includes('validation')) {
        throw createError('Invalid wallet information. Please check your wallet and try again.', 400);
      }
      
      // Generic user-friendly error for any other database issues
      throw createError('Unable to authenticate wallet. Please try again.', 500);
    } finally {
      // 🏗️ ARCHITECTURE: Session cleanup (for replica sets)
      // await session.endSession(); // Uncomment when enabling transactions
    }
  }

  /**
   * Create wallet profile with custom data - SECURE VERSION
   * @param walletAddress Wallet address
   * @param profileData Profile data
   * @param clientIP Client IP for rate limiting
   */
  async createWalletProfile(walletAddress: string, profileData: { username: string, email?: string }, clientIP?: string) {
    // 🔒 SECURITY: Validate wallet address format
    if (!validateWalletAddress(walletAddress)) {
      throw createError('Invalid wallet address format', 400);
    }

    // 🔒 SECURITY: Rate limiting for profile creation
    const rateLimitKey = `profile_create_${clientIP || 'unknown'}`;
    if (!checkRateLimit(rateLimitKey, SECURITY_CONFIG.PROFILE_CREATE_RATE_LIMIT, SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS)) {
      throw createError('Too many profile creation attempts. Please try again later.', 429);
    }

    // 🔒 SECURITY: Validate and sanitize username
    const usernameValidation = validateAndSanitizeUsername(profileData.username);
    if (!usernameValidation.isValid) {
      throw createError(usernameValidation.error || 'Invalid username', 400);
    }

    // 🔒 SECURITY: Validate and sanitize email if provided
    const emailValidation = validateAndSanitizeEmail(profileData.email);
    if (!emailValidation.isValid) {
      throw createError(emailValidation.error || 'Invalid email', 400);
    }

    const normalizedAddress = walletAddress.toLowerCase();
    
    // 🔒 SECURITY: Use secure admin wallet checking
    const isAdmin = isAdminWallet(normalizedAddress);

    // 🏗️ ARCHITECTURE: Transaction setup (disabled for single MongoDB instance)
    // TODO: Enable when scaling to replica set (just uncomment these lines)
    // const session = await mongoose.startSession();
    
    try {
      let user: IUser | null = null;
      
      // 🏗️ ARCHITECTURE: Replica-set ready structure (transactions disabled for now)
      // When we scale to replica sets, just uncomment the session.withTransaction wrapper
      // await session.withTransaction(async () => {
        
        // Check if user already exists
        const existingUser = await User.findOne({ walletAddress: normalizedAddress });
        // For replica sets: add .session(session)
        if (existingUser) {
          throw createError('Wallet already has an associated profile', 400);
        }

        // Check if username is taken
        const existingUsername = await User.findOne({ username: usernameValidation.sanitized });
        // For replica sets: add .session(session)
        if (existingUsername) {
          throw createError('Username already taken', 400);
        }

        // Create new user with sanitized data
        user = new User({
          username: usernameValidation.sanitized!,
          email: emailValidation.sanitized || `${walletAddress.substring(2, 8)}@wallet.local`,
          password: crypto.randomBytes(32).toString('hex'), // Secure random password
          walletAddress: normalizedAddress,
          roles: isAdmin ? ['admin', 'user'] : ['user'],
          isVerified: true
        });

        await user.save();
        // For replica sets: add { session }
        
      // }); // Uncomment this closing brace when enabling transactions

      if (!user) {
        throw createError('Unable to create profile. Please try again.', 500);
      }

      // Generate secure token
      const token = this.generateToken(user.id);

      console.log(`✅ Created wallet profile: ${user.username} (${walletAddress})${isAdmin ? ' - ADMIN' : ''}`);
      return { user, token };
    } catch (error) {
      console.error('❌ Wallet profile creation error:', error);
      
      // 🎨 UX: Convert technical errors to user-friendly messages
      if (error.message && error.message.includes('duplicate key')) {
        if (error.message.includes('username')) {
          throw createError('Username already taken. Please choose a different username.', 400);
        }
        if (error.message.includes('walletAddress')) {
          throw createError('This wallet already has a profile. Please try connecting again.', 400);
        }
      }
      if (error.message && error.message.includes('validation')) {
        throw createError('Invalid profile information. Please check your details and try again.', 400);
      }
      
      // Pass through our custom error messages
      if (error.statusCode) {
        throw error;
      }
      
      // Generic user-friendly error for any other database issues
      throw createError('Unable to create profile. Please try again.', 500);
    } finally {
      // 🏗️ ARCHITECTURE: Session cleanup (for replica sets)
      // await session.endSession(); // Uncomment when enabling transactions
    }
  }

  /**
   * Request password reset
   * @param email User email
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Find user by email
    const user = await User.findOne({ email });
    
    // If no user found, return silently for security
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save reset token to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email (in a real implementation)
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    // await emailService.sendPasswordResetEmail(user.email, resetUrl);
    
    console.log(`Reset token generated for user ${user.id}: ${resetToken}`);
  }

  /**
   * Reset password with token
   * @param resetToken Reset token
   * @param newPassword New password
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    // Hash token for comparison
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with this token and valid expiration
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      throw createError('Invalid or expired reset token', 400);
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  }

  /**
   * Verify email address
   * @param verificationToken Email verification token
   */
  async verifyEmail(verificationToken: string): Promise<void> {
    // Hash token for comparison
    const tokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: tokenHash
    });

    if (!user) {
      throw createError('Invalid verification token', 400);
    }

    // Update user
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }

  /**
   * Send verification email
   * @param userId User ID
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    // Skip if already verified
    if (user.isVerified) {
      return;
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Save token to user
    user.emailVerificationToken = tokenHash;
    await user.save();

    // Send verification email (in a real implementation)
    // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    // await emailService.sendVerificationEmail(user.email, verificationUrl);
    
    console.log(`Verification token generated for user ${user.id}: ${verificationToken}`);
  }
}

export default new AuthService();