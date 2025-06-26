import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import createError from '../utils/createError';

/**
 * Middleware to verify user has verified Pro status
 * Required for content upload and creator features
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Express next function
 */
export const proStatusMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from authenticated request
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw createError('Authentication required', 401);
    }

    // Fetch fresh user data from database
    const user = await User.findById(userId);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    // Check Pro status
    if (user.proStatus !== 'verified') {
      console.log(`🚫 Pro status check failed for user ${user.username} (${user.walletAddress}): ${user.proStatus}`);
      
      const message = user.proStatus === 'pending' 
        ? 'Pro status verification is pending. Please wait for admin approval.'
        : user.proStatus === 'rejected'
        ? 'Pro status verification was rejected. Please contact support.'
        : 'Pro status verification required. Please submit your Pro application.';
        
      throw createError(message, 403);
    }

    // Log successful verification
    console.log(`✅ Pro status verified for user ${user.username} (${user.walletAddress})`);
    
    // Add user to request for downstream middleware
    (req as any).user = user;
    
    next();
  } catch (error: any) {
    console.error('❌ Pro status middleware error:', error.message);
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Pro status verification failed',
      code: 'PRO_STATUS_REQUIRED'
    });
  }
};

/**
 * Middleware to verify user has specific role (with Pro status requirement)
 * @param roles - Array of required roles
 */
export const proRoleMiddleware = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First check Pro status
      await new Promise<void>((resolve, reject) => {
        proStatusMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Then check roles
      const user = (req as any).user;
      
      if (!user.roles || !roles.some(role => user.roles.includes(role))) {
        throw createError(`Insufficient permissions. Required roles: ${roles.join(', ')}`, 403);
      }

      next();
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Role verification failed'
      });
    }
  };
}; 