import { CrawlerConfig } from '../types';

export const config: CrawlerConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'wylloh-blockchain-crawler',
    groupId: 'blockchain-crawler-group'
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: process.env.ELASTICSEARCH_USER && process.env.ELASTICSEARCH_PASSWORD ? {
      username: process.env.ELASTICSEARCH_USER,
      password: process.env.ELASTICSEARCH_PASSWORD
    } : undefined
  },
  blockchains: [
    {
      id: 'polygon',
      name: 'Polygon',
      chainId: 137,
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      blockExplorer: 'https://polygonscan.com',
      tokenStandards: ['ERC-721', 'ERC-1155'],
      startBlock: parseInt(process.env.POLYGON_START_BLOCK || '0'),
      confirmations: 12
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      chainId: 1,
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key',
      blockExplorer: 'https://etherscan.io',
      tokenStandards: ['ERC-721', 'ERC-1155'],
      startBlock: parseInt(process.env.ETHEREUM_START_BLOCK || '0'),
      confirmations: 12
    },
    {
      id: 'binance',
      name: 'Binance Smart Chain',
      chainId: 56,
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
      blockExplorer: 'https://bscscan.com',
      tokenStandards: ['BEP-721', 'BEP-1155'],
      startBlock: parseInt(process.env.BSC_START_BLOCK || '0'),
      confirmations: 12
    }
  ],
  workerCount: parseInt(process.env.WORKER_COUNT || '4'),
  batchSize: parseInt(process.env.BATCH_SIZE || '10'),
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.RETRY_DELAY || '5000')
}; 