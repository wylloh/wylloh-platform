import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Centralized environment configuration for ES module compatibility
 * Handles all process.env access in a single location to avoid ES module issues
 */
interface StorageEnvironment {
  // Node.js environment
  NODE_ENV: string;
  
  // Server configuration
  STORAGE_PORT: number;
  STORAGE_HOST: string;
  
  // IPFS configuration
  IPFS_API_URL: string;
  IPFS_GATEWAY_URL: string;
  IPFS_CUSTOM_GATEWAYS: string[];
  IPFS_NODES: any[];
  IPFS_CHUNK_SIZE: number;
  IPFS_PIN_TIMEOUT: number;
  TEMP_UPLOAD_DIR: string;
  
  // Filecoin configuration
  FILECOIN_API_URL: string;
  FILECOIN_TOKEN: string;
  FILECOIN_WALLET_ADDRESS: string;
  FILECOIN_STORAGE_DAYS: number;
  FILECOIN_DATA_DIR: string;
  
  // External pinning services
  PINATA_API_KEY?: string;
  PINATA_API_SECRET?: string;
  INFURA_IPFS_PROJECT_ID?: string;
  INFURA_IPFS_PROJECT_SECRET?: string;
  
  // Content delivery
  CDN_ENABLED: boolean;
  CDN_PROVIDER: string;
  CDN_CACHE_TIMEOUT: number;
  CDN_EDGE_LOCATIONS: string[];
  
  // Security configuration
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  CORS_ORIGINS: string[];
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  
  // Monitoring and logging
  LOG_LEVEL: string;
  METRICS_ENABLED: boolean;
  HEALTH_CHECK_INTERVAL: number;
  ALERT_WEBHOOK_URL?: string;
  
  // Database configuration
  DATABASE_URL: string;
  DB_MAX_CONNECTIONS: number;
  
  // Content availability monitoring
  AVAILABILITY_SCAN_INTERVAL: number;
  REPLICATION_INTERVAL: number;
  MIN_REPLICAS: number;
  MAX_REPLICAS: number;
  PRIORITY_THRESHOLD: number;
}

/**
 * Parse IPFS nodes configuration safely
 */
const parseIPFSNodes = (): any[] => {
  if (!process.env.IPFS_NODES) {
    return [];
  }
  
  try {
    return JSON.parse(process.env.IPFS_NODES);
  } catch (error) {
    console.warn('Invalid IPFS_NODES configuration, using empty array:', error);
    return [];
  }
};

/**
 * Centralized environment configuration object
 * All process.env access happens here to ensure ES module compatibility
 */
const env: StorageEnvironment = {
  // Node.js environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server configuration
  STORAGE_PORT: parseInt(process.env.STORAGE_PORT || '4001', 10),
  STORAGE_HOST: process.env.STORAGE_HOST || 'localhost',
  
  // IPFS configuration
  IPFS_API_URL: process.env.IPFS_API_URL || 'http://localhost:5001',
  IPFS_GATEWAY_URL: process.env.IPFS_GATEWAY_URL || 'http://localhost:8080',
  IPFS_CUSTOM_GATEWAYS: process.env.IPFS_CUSTOM_GATEWAYS ? process.env.IPFS_CUSTOM_GATEWAYS.split(',') : [],
  IPFS_NODES: parseIPFSNodes(),
  IPFS_CHUNK_SIZE: parseInt(process.env.IPFS_CHUNK_SIZE || '262144', 10), // 256KB
  IPFS_PIN_TIMEOUT: parseInt(process.env.IPFS_PIN_TIMEOUT || '120000', 10), // 2 minutes
  TEMP_UPLOAD_DIR: process.env.TEMP_UPLOAD_DIR || './temp',
  
  // Filecoin configuration
  FILECOIN_API_URL: process.env.FILECOIN_API_URL || 'http://127.0.0.1:1234/rpc/v0',
  FILECOIN_TOKEN: process.env.FILECOIN_TOKEN || '',
  FILECOIN_WALLET_ADDRESS: process.env.FILECOIN_WALLET_ADDRESS || '',
  FILECOIN_STORAGE_DAYS: parseInt(process.env.FILECOIN_STORAGE_DAYS || '180', 10),
  FILECOIN_DATA_DIR: process.env.FILECOIN_DATA_DIR || './data',
  
  // External pinning services
  PINATA_API_KEY: process.env.PINATA_API_KEY,
  PINATA_API_SECRET: process.env.PINATA_API_SECRET,
  INFURA_IPFS_PROJECT_ID: process.env.INFURA_IPFS_PROJECT_ID,
  INFURA_IPFS_PROJECT_SECRET: process.env.INFURA_IPFS_PROJECT_SECRET,
  
  // Content delivery
  CDN_ENABLED: process.env.CDN_ENABLED === 'true',
  CDN_PROVIDER: process.env.CDN_PROVIDER || 'cloudflare',
  CDN_CACHE_TIMEOUT: parseInt(process.env.CDN_CACHE_TIMEOUT || '3600', 10), // 1 hour
  CDN_EDGE_LOCATIONS: process.env.CDN_EDGE_LOCATIONS ? process.env.CDN_EDGE_LOCATIONS.split(',') : [],
  
  // Security configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-encryption-key',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  
  // Monitoring and logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  METRICS_ENABLED: process.env.METRICS_ENABLED === 'true',
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10), // 1 minute
  ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/wylloh-storage',
  DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  
  // Content availability monitoring
  AVAILABILITY_SCAN_INTERVAL: parseInt(process.env.AVAILABILITY_SCAN_INTERVAL || '300000', 10), // 5 minutes
  REPLICATION_INTERVAL: parseInt(process.env.REPLICATION_INTERVAL || '30000', 10), // 30 seconds
  MIN_REPLICAS: parseInt(process.env.MIN_REPLICAS || '3', 10),
  MAX_REPLICAS: parseInt(process.env.MAX_REPLICAS || '5', 10),
  PRIORITY_THRESHOLD: parseInt(process.env.PRIORITY_THRESHOLD || '80', 10)
};

/**
 * Validate required environment variables
 */
export const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'IPFS_API_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

/**
 * Helper functions for common environment checks
 */
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';

export default env; 