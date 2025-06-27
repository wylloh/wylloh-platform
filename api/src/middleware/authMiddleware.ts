import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token from Authorization header
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Unauthorized - No token provided', 401);
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw createError('Unauthorized - Invalid token format', 401);
    }
    
    try {
      // Verify token
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        throw new Error('JWT secret is not defined in environment variables');
      }
      
      const decoded = jwt.verify(token, secret);
      
      // Add user info to request
      req.user = decoded;
      
      next();
    } catch (error) {
      throw createError('Unauthorized - Invalid token', 401);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Verifies JWT token if present but doesn't require it
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    try {
      // Verify token
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        throw new Error('JWT secret is not defined in environment variables');
      }
      
      const decoded = jwt.verify(token, secret);
      
      // Add user info to request
      req.user = decoded;
    } catch (error) {
      // Just continue if token is invalid
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware - ENTERPRISE SECURITY
 * Fetches fresh user roles from database for each request
 */
export const roleAuthorization = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(createError('Unauthorized - Login required', 401));
      }
      
      // SECURITY: Fetch fresh user data from database
      // This ensures roles are always current and cannot be tampered with
      const User = require('../models/User').default;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return next(createError('User not found', 404));
      }
      
      // Check if user has any of the required roles
      const hasRole = roles.some(role => user.roles && user.roles.includes(role));
      
      if (!hasRole) {
        return next(createError('Forbidden - Insufficient permissions', 403));
      }
      
      // Add fresh user data to request for use in controllers
      req.user.roles = user.roles;
      req.user.username = user.username;
      
      next();
    } catch (error) {
      next(createError('Authorization check failed', 500));
    }
  };
};

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Admin role authorization middleware
 */
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// Default export for legacy imports
export default authMiddleware;