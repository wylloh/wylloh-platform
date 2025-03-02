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