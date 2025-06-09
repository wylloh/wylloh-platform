import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createError } from '../middleware/errorHandler';
import User, { IUser } from '../models/User';
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
   * Login or register with wallet
   * @param walletAddress Wallet address
   * @param signature Signature
   */
  async walletAuth(walletAddress: string, signature: string) {
    // Verify signature
    await this.verifyWalletSignature(walletAddress, signature);

    // Find user with this wallet address
    let user = await User.findOne({ walletAddress });

    if (!user) {
      // Create new user if this wallet is not associated with any account
      user = new User({
        username: `user_${walletAddress.substring(2, 8)}`,
        email: `wallet_${walletAddress.substring(2, 8)}@placeholder.com`,
        password: crypto.randomBytes(20).toString('hex'), // Random password
        walletAddress,
        roles: ['user']
      });

      await user.save();
    }

    // Generate token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Verify wallet signature
   * @param walletAddress Wallet address
   * @param signature Signature
   */
  async verifyWalletSignature(_walletAddress: string, _signature: string): Promise<boolean> {
    try {
      // In a real implementation, we would:
      // 1. Generate a nonce for the user to sign
      // 2. Verify the signature against the nonce
      // 3. Ensure the nonce is used only once
      
      // For demonstration, we'll return true
      return true;
    } catch (error) {
      throw createError('Signature verification failed', 401);
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