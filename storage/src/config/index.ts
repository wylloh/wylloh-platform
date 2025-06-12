import env, { validateEnvironment } from './env.js';

export const config = {
  // Server configuration
  server: {
    port: env.STORAGE_PORT,
    host: env.STORAGE_HOST,
    environment: env.NODE_ENV
  },

  // IPFS configuration
  ipfs: {
    apiUrl: env.IPFS_API_URL,
    gatewayUrl: env.IPFS_GATEWAY_URL,
    customGateways: env.IPFS_CUSTOM_GATEWAYS,
    nodes: env.IPFS_NODES,
    chunkSize: env.IPFS_CHUNK_SIZE,
    pinTimeout: env.IPFS_PIN_TIMEOUT,
    tempDir: env.TEMP_UPLOAD_DIR
  },

  // Filecoin configuration
  filecoin: {
    apiUrl: env.FILECOIN_API_URL,
    token: env.FILECOIN_TOKEN,
    walletAddress: env.FILECOIN_WALLET_ADDRESS,
    storageDays: env.FILECOIN_STORAGE_DAYS,
    dataDir: env.FILECOIN_DATA_DIR
  },

  // External pinning services
  pinning: {
    pinata: {
      apiKey: env.PINATA_API_KEY,
      apiSecret: env.PINATA_API_SECRET
    },
    infura: {
      projectId: env.INFURA_IPFS_PROJECT_ID,
      projectSecret: env.INFURA_IPFS_PROJECT_SECRET
    }
  },

  // Content delivery
  cdn: {
    enabled: env.CDN_ENABLED,
    provider: env.CDN_PROVIDER,
    cacheTimeout: env.CDN_CACHE_TIMEOUT,
    edgeLocations: env.CDN_EDGE_LOCATIONS
  },

  // Security configuration
  security: {
    jwtSecret: env.JWT_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
    corsOrigins: env.CORS_ORIGINS,
    rateLimitWindow: env.RATE_LIMIT_WINDOW,
    rateLimitMax: env.RATE_LIMIT_MAX
  },

  // Monitoring and logging
  monitoring: {
    logLevel: env.LOG_LEVEL,
    metricsEnabled: env.METRICS_ENABLED,
    healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
    alertWebhook: env.ALERT_WEBHOOK_URL
  },

  // Database configuration (if needed for metadata)
  database: {
    url: env.DATABASE_URL,
    maxConnections: env.DB_MAX_CONNECTIONS
  },

  // Content availability monitoring
  availability: {
    scanInterval: env.AVAILABILITY_SCAN_INTERVAL,
    replicationInterval: env.REPLICATION_INTERVAL,
    minReplicas: env.MIN_REPLICAS,
    maxReplicas: env.MAX_REPLICAS,
    priorityThreshold: env.PRIORITY_THRESHOLD
  }
};

// Validate required configuration
export const validateConfig = validateEnvironment;

export default config; 