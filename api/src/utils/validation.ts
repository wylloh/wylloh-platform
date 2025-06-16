import validator from 'validator';

/**
 * Validate Ethereum wallet address format
 */
export const validateWalletAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check if it's a valid Ethereum address format (0x + 40 hex characters)
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
};

/**
 * Sanitize and validate username
 */
export const validateAndSanitizeUsername = (username: string): { isValid: boolean; sanitized?: string; error?: string } => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();
  
  // Check length
  if (!validator.isLength(trimmed, { min: 3, max: 30 })) {
    return { isValid: false, error: 'Username must be between 3 and 30 characters' };
  }

  // Check for valid characters (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // Sanitize for XSS protection
  const sanitized = validator.escape(trimmed);
  
  return { isValid: true, sanitized };
};

/**
 * Validate and sanitize email
 */
export const validateAndSanitizeEmail = (email?: string): { isValid: boolean; sanitized?: string; error?: string } => {
  if (!email) {
    return { isValid: true }; // Email is optional for wallet accounts
  }

  if (typeof email !== 'string') {
    return { isValid: false, error: 'Invalid email format' };
  }

  const trimmed = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Sanitize for XSS protection
  const sanitized = validator.escape(trimmed);
  
  return { isValid: true, sanitized };
};

/**
 * Rate limiting helper - simple in-memory store for development
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  current.count++;
  return true;
}; 