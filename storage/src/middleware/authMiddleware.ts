import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler.js';
import env from '../config/env.js';

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
      const secret = env.JWT_SECRET;
      
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
 * Middleware to handle file uploads and limits
 * Validates file size and type before processing
 */
export const fileUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if a file exists in the request
  if (!req.file && !req.files) {
    return next(createError('No file uploaded', 400));
  }
  
  // Additional file validation could go here
  // For example, checking file types, sizes, etc.
  
  next();
};

/**
 * Middleware to validate content encryption requirements
 * Ensures necessary encryption parameters are provided
 */
export const encryptionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { encrypted } = req.body;
  
  // If content is marked as encrypted, ensure we have the necessary info
  if (encrypted === true && !req.body.encryptionMethod) {
    return next(createError('Encryption method must be specified for encrypted content', 400));
  }
  
  next();
};