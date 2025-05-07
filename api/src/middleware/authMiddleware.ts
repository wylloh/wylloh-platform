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
 * Role-based authorization middleware
 * Requires user to have specified roles
 */
export const roleAuthorization = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Unauthorized - Login required', 401));
    }
    
    const hasRole = roles.some(role => req.user.roles.includes(role));
    
    if (!hasRole) {
      return next(createError('Forbidden - Insufficient permissions', 403));
    }
    
    next();
  };
};

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};