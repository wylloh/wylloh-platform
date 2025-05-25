import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.STORAGE_PORT || '4001', 10),
    host: process.env.STORAGE_HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // IPFS configuration
  ipfs: {
    apiUrl: process.env.IPFS_API_URL || 'http://localhost:5001',
    gatewayUrl: process.env.IPFS_GATEWAY_URL || 'http://localhost:8080',
    customGateways: process.env.IPFS_CUSTOM_GATEWAYS ? process.env.IPFS_CUSTOM_GATEWAYS.split(',') : [],
    nodes: process.env.IPFS_NODES ? JSON.parse(process.env.IPFS_NODES) : [],
    chunkSize: parseInt(process.env.IPFS_CHUNK_SIZE || '262144', 10), // 256KB
    pinTimeout: parseInt(process.env.IPFS_PIN_TIMEOUT || '120000', 10), // 2 minutes
    tempDir: process.env.TEMP_UPLOAD_DIR || './temp'
  },

  // Filecoin configuration
  filecoin: {
    apiUrl: process.env.FILECOIN_API_URL || 'http://127.0.0.1:1234/rpc/v0',
    token: process.env.FILECOIN_TOKEN || '',
    walletAddress: process.env.FILECOIN_WALLET_ADDRESS || '',
    storageDays: parseInt(process.env.FILECOIN_STORAGE_DAYS || '180', 10),
    dataDir: process.env.FILECOIN_DATA_DIR || './data'
  },

  // External pinning services
  pinning: {
    pinata: {
      apiKey: process.env.PINATA_API_KEY,
      apiSecret: process.env.PINATA_API_SECRET
    },
    infura: {
      projectId: process.env.INFURA_IPFS_PROJECT_ID,
      projectSecret: process.env.INFURA_IPFS_PROJECT_SECRET
    }
  },

  // Content delivery
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    provider: process.env.CDN_PROVIDER || 'cloudflare',
    cacheTimeout: parseInt(process.env.CDN_CACHE_TIMEOUT || '3600', 10), // 1 hour
    edgeLocations: process.env.CDN_EDGE_LOCATIONS ? process.env.CDN_EDGE_LOCATIONS.split(',') : []
  },

  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },

  // Monitoring and logging
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10), // 1 minute
    alertWebhook: process.env.ALERT_WEBHOOK_URL
  },

  // Database configuration (if needed for metadata)
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/wylloh-storage',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10)
  },

  // Content availability monitoring
  availability: {
    scanInterval: parseInt(process.env.AVAILABILITY_SCAN_INTERVAL || '300000', 10), // 5 minutes
    replicationInterval: parseInt(process.env.REPLICATION_INTERVAL || '30000', 10), // 30 seconds
    minReplicas: parseInt(process.env.MIN_REPLICAS || '3', 10),
    maxReplicas: parseInt(process.env.MAX_REPLICAS || '5', 10),
    priorityThreshold: parseInt(process.env.PRIORITY_THRESHOLD || '80', 10)
  }
};

// Validate required configuration
export const validateConfig = (): void => {
  const requiredEnvVars = [
    'IPFS_API_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate IPFS nodes configuration if provided
  if (process.env.IPFS_NODES) {
    try {
      JSON.parse(process.env.IPFS_NODES);
    } catch (error) {
      throw new Error('Invalid IPFS_NODES configuration: must be valid JSON');
    }
  }
};

export default config; 