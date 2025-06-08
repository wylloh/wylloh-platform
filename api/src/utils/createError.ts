/**
 * Creates a standardized error object
 * @param message Error message
 * @param statusCode HTTP status code
 * @param code Optional error code
 * @returns Error object with status code
 */
class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates an application error
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 * @param code Optional error code
 * @returns AppError instance
 */
export default function createError(message: string, statusCode: number = 500, code?: string): AppError {
  return new AppError(message, statusCode, code);
}

export { AppError }; 