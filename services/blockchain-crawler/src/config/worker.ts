import dotenv from 'dotenv';

dotenv.config();

export const workerConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
    retryLimit: parseInt(process.env.WORKER_RETRY_LIMIT || '5', 10),
    stalledTimeout: parseInt(process.env.WORKER_STALLED_TIMEOUT || '30000', 10), // 30 seconds
    backoffDelay: parseInt(process.env.WORKER_BACKOFF_DELAY || '1000', 10), // 1 second
  },
  queues: {
    blockProcessing: 'block-processing',
    eventProcessing: 'event-processing',
    metadataProcessing: 'metadata-processing',
  },
  chains: {
    ethereum: {
      rpcUrl: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      startBlock: parseInt(process.env.ETH_START_BLOCK || '0', 10),
      confirmations: parseInt(process.env.ETH_CONFIRMATIONS || '12', 10),
    },
    polygon: {
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      startBlock: parseInt(process.env.POLYGON_START_BLOCK || '0', 10),
      confirmations: parseInt(process.env.POLYGON_CONFIRMATIONS || '256', 10),
    },
    bsc: {
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
      startBlock: parseInt(process.env.BSC_START_BLOCK || '0', 10),
      confirmations: parseInt(process.env.BSC_CONFIRMATIONS || '12', 10),
    },
  },
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10), // 1 minute
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  },
} as const; 