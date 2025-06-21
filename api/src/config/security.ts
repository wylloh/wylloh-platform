/**
 * Security configuration for the Wylloh platform
 * All sensitive values should be loaded from environment variables
 */

/**
 * Get admin wallet addresses from environment
 * Supports multiple admin wallets for security
 */
export const getAdminWallets = (): string[] => {
  const adminWalletsEnv = process.env.ADMIN_WALLETS;
  
  if (!adminWalletsEnv) {
    // Fallback to platform founder wallet for development
    console.warn('⚠️  ADMIN_WALLETS not set in environment, using fallback');
    return ['0x7FA50da5a8f998c9184E344279b205DE699Aa672'];
  }
  
  return adminWalletsEnv
    .split(',')
    .map(wallet => wallet.trim().toLowerCase())
    .filter(wallet => wallet.length > 0);
};

/**
 * Check if wallet address has admin privileges
 */
export const isAdminWallet = (walletAddress: string): boolean => {
  const adminWallets = getAdminWallets();
  const normalizedAddress = walletAddress.toLowerCase();
  
  return adminWallets.includes(normalizedAddress);
};

/**
 * Security settings
 */
export const SECURITY_CONFIG = {
  // JWT settings
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Rate limiting
  WALLET_CONNECT_RATE_LIMIT: parseInt(process.env.WALLET_CONNECT_RATE_LIMIT || '50'),
  PROFILE_CREATE_RATE_LIMIT: parseInt(process.env.PROFILE_CREATE_RATE_LIMIT || '20'),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_SPECIAL_CHARS: true,
  
  // Session security
  SECURE_COOKIES: process.env.NODE_ENV === 'production',
  SAME_SITE_COOKIES: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  
  // CORS settings
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Database security
  USE_TRANSACTIONS: true,
  ENABLE_QUERY_LOGGING: process.env.NODE_ENV === 'development'
} as const;

/**
 * Validate security configuration on startup
 */
export const validateSecurityConfig = (): void => {
  const adminWallets = getAdminWallets();
  
  if (adminWallets.length === 0) {
    throw new Error('❌ No admin wallets configured - platform security compromised');
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set in production - using fallback (less secure)');
    } else if (process.env.JWT_SECRET.length < 32) {
      console.warn('⚠️  JWT_SECRET should be at least 32 characters for optimal security');
    }
    
    if (!process.env.ADMIN_WALLETS) {
      console.warn('⚠️  ADMIN_WALLETS not explicitly set - using fallback founder wallet');
    }
  }
  
  console.log(`✅ Security config validated - ${adminWallets.length} admin wallet(s) configured`);
}; 