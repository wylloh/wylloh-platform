import { BigNumber } from 'ethers';

export interface BlockchainConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  tokenStandards: string[];
  startBlock?: number;
  confirmations: number;
}

export interface CrawlerConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };
  elasticsearch: {
    node: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  blockchains: BlockchainConfig[];
  workerCount: number;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface BlockEvent {
  blockchain: string;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  transactions: TransactionEvent[];
}

export interface TransactionEvent {
  txHash: string;
  from: string;
  to: string;
  value: BigNumber;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  contractEvents: ContractEvent[];
}

export interface ContractEvent {
  address: string;
  event: string;
  args: any[];
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

export interface CrawlerJob {
  blockchain: string;
  fromBlock: number;
  toBlock: number;
  attempt: number;
}

export interface CrawlerWorker {
  id: string;
  blockchain: string;
  status: 'idle' | 'processing';
  currentBlock?: number;
  lastProcessedBlock?: number;
  errors: Error[];
}

export interface IndexedContent {
  id: string;
  blockchain: string;
  contractAddress: string;
  tokenId: string;
  owner: string;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  transactions: {
    hash: string;
    type: 'mint' | 'transfer' | 'sale';
    from: string;
    to: string;
    value?: BigNumber;
    timestamp: number;
  }[];
} 