import { JsonRpcProvider, Block, TransactionResponse } from 'ethers';

export interface ChainConfig {
  rpcUrl: string;
  startBlock: number;
  confirmations: number;
  chainId: string;
}

export interface TokenEvent {
  tokenId: string;
  from: string;
  to: string;
  amount: number;
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface ListingEvent {
  tokenId: string;
  seller: string;
  price: string;
  quantity: number;
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface PurchaseEvent {
  tokenId: string;
  buyer: string;
  seller: string;
  quantity: number;
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface ChainAdapter {
  readonly provider: JsonRpcProvider;
  readonly config: ChainConfig;
  readonly wyllohAbi: readonly string[];

  // Core blockchain methods
  getLatestBlock(): Promise<number>;
  getBlock(blockNumber: number): Promise<Block | null>;
  getTransaction(txHash: string): Promise<TransactionResponse | null>;
  
  // Event processing methods
  processTransferEvent(event: any): Promise<TokenEvent>;
  processListingEvent(event: any): Promise<ListingEvent>;
  processPurchaseEvent(event: any): Promise<PurchaseEvent>;
  
  // Chain-specific utilities
  isContractAddress(address: string): Promise<boolean>;
  getTokenMetadata(tokenAddress: string, tokenId: string): Promise<Record<string, any>>;
  
  // Health check methods
  isConnected(): Promise<boolean>;
  getChainStatus(): Promise<{
    latestBlock: number;
    syncStatus: boolean;
    peerCount: number;
  }>;
} 