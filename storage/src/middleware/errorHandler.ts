import { Request, Response, NextFunction } from 'express';
import { isDevelopment } from '../config/env.js';

// Interface for API errors
interface ApiError extends Error {
  statusCode?: number;
  data?: any;
}

/**
 * Global error handling middleware
 * Manages all uncaught errors in the application and returns structured responses
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Default to 500 internal server error if status code is not defined
  const statusCode = err.statusCode || 500;
  
  // Format the error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      ...(isDevelopment() && { 
        stack: err.stack,
        details: err.data 
      })
    }
  };

  // Send the error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Utility function to create an error with status code and optional data
 */
export const createError = (message: string, statusCode: number, data?: any): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.data = data;
  return error;
};

/**
 * Wrapper for async route handlers to catch errors
 * Eliminates the need for try/catch blocks in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};