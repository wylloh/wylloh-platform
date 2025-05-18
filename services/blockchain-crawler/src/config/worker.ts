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
      rpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      startBlock: parseInt(process.env.ETH_START_BLOCK || '0'),
      confirmations: parseInt(process.env.ETH_CONFIRMATIONS || '12'),
      contracts: {
        wylloh: process.env.ETH_WYLLOH_CONTRACT || '0x...'
      }
    },
    polygon: {
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
      startBlock: parseInt(process.env.POLYGON_START_BLOCK || '0'),
      confirmations: parseInt(process.env.POLYGON_CONFIRMATIONS || '64'),
      contracts: {
        wylloh: process.env.POLYGON_WYLLOH_CONTRACT || '0x...'
      }
    },
    bsc: {
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
      startBlock: parseInt(process.env.BSC_START_BLOCK || '0'),
      confirmations: parseInt(process.env.BSC_CONFIRMATIONS || '15'),
      contracts: {
        wylloh: process.env.BSC_WYLLOH_CONTRACT || '0x...'
      }
    },
  },
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    errorThreshold: parseInt(process.env.ERROR_THRESHOLD || '5'),
    syncInterval: parseInt(process.env.SYNC_INTERVAL || '900000') // 15 minutes
  },
} as const; 