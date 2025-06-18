/**
 * Production Environment Configuration for Wylloh Platform
 * Centralized configuration management for all environment variables
 */

export interface EnvironmentConfig {
  // Environment
  NODE_ENV: string;
  isDevelopment: boolean;
  isProduction: boolean;
  
  // API Configuration
  API_BASE_URL: string;
  STORAGE_URL: string;
  
  // Blockchain Configuration
  WEB3_PROVIDER: string;
  NETWORK_ID: number;
  CHAIN_NAME: string;
  
  // Contract Addresses
  CONTRACT_ADDRESS?: string;
  MARKETPLACE_ADDRESS?: string;
  FILM_FACTORY_ADDRESS?: string;
  
  // IPFS Configuration
  IPFS_GATEWAY: string;
  
  // Feature Flags
  ENABLE_DEMO_MODE: boolean;
  ENABLE_DEBUG_LOGGING: boolean;
}

/**
 * Load and validate environment configuration
 */
export const loadEnvironmentConfig = (): EnvironmentConfig => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isDevelopment = NODE_ENV === 'development';
  const isProduction = NODE_ENV === 'production';
  
  const config: EnvironmentConfig = {
    // Environment
    NODE_ENV,
    isDevelopment,
    isProduction,
    
    // API Configuration
    API_BASE_URL: process.env.REACT_APP_API_URL || (isProduction ? '/api' : 'http://localhost:3001'),
    STORAGE_URL: process.env.REACT_APP_STORAGE_URL || (isProduction ? '/storage' : 'http://localhost:4001'),
    
    // Blockchain Configuration
    WEB3_PROVIDER: process.env.REACT_APP_WEB3_PROVIDER || 'https://polygon-rpc.com',
    NETWORK_ID: parseInt(process.env.REACT_APP_NETWORK_ID || '137'),
    CHAIN_NAME: process.env.REACT_APP_CHAIN_NAME || 'Polygon',
    
    // Contract Addresses (loaded from configuration files)
    CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS,
    MARKETPLACE_ADDRESS: process.env.REACT_APP_MARKETPLACE_ADDRESS,
    FILM_FACTORY_ADDRESS: process.env.REACT_APP_FILM_FACTORY_ADDRESS,
    
    // IPFS Configuration
    IPFS_GATEWAY: process.env.REACT_APP_IPFS_GATEWAY || 'https://ipfs.io',
    
    // Feature Flags
    ENABLE_DEMO_MODE: !isProduction && (process.env.REACT_APP_ENABLE_DEMO_MODE === 'true'),
    ENABLE_DEBUG_LOGGING: isDevelopment || (process.env.REACT_APP_DEBUG_LOGGING === 'true'),
  };
  
  // Production validation
  if (isProduction) {
    validateProductionConfig(config);
  }
  
  return config;
};

/**
 * Validate production configuration
 */
const validateProductionConfig = (config: EnvironmentConfig): void => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check required production settings
  if (!config.API_BASE_URL || config.API_BASE_URL.includes('localhost')) {
    errors.push('API_BASE_URL must be set to production URL');
  }
  
  if (!config.WEB3_PROVIDER || config.WEB3_PROVIDER.includes('localhost')) {
    warnings.push('WEB3_PROVIDER should use production Polygon RPC');
  }
  
  if (config.NETWORK_ID !== 137) {
    warnings.push('NETWORK_ID should be 137 for Polygon mainnet');
  }
  
  if (config.ENABLE_DEMO_MODE) {
    errors.push('DEMO_MODE must be disabled in production');
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️ Production configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // Throw errors
  if (errors.length > 0) {
    console.error('❌ Production configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Production configuration validation failed');
  }
  
  console.log('✅ Production environment configuration validated');
};

/**
 * Get current environment configuration
 */
export const environment = loadEnvironmentConfig();

/**
 * Environment-specific logging
 */
export const logger = {
  debug: (...args: any[]) => {
    if (environment.ENABLE_DEBUG_LOGGING) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  }
};

export default environment; 