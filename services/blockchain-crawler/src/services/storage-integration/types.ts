import { BigNumber } from '@ethersproject/bignumber';

export interface StorageConfig {
  ipfs: {
    apiUrl: string;
    gatewayUrl: string;
    pinningServices: {
      name: string;
      endpoint: string;
      token: string;
    }[];
  };
  filecoin: {
    apiUrl: string;
    token: string;
    walletAddress: string;
    storageDays: number;
  };
}

export interface ContentMetadata {
  title: string;
  description: string;
  contentType: string;
  creator: string;
  creatorAddress: string;
  license: string;
  rights: string[];
  tags: string[];
  blockchain: string;
  contractAddress: string;
  tokenId: string;
  createdAt: number;
  updatedAt: number;
}

export interface StorageStatus {
  cid: string;
  size: number;
  ipfsStatus: {
    isAvailable: boolean;
    pinningServices: {
      name: string;
      status: 'pinned' | 'pinning' | 'failed';
      timestamp: number;
    }[];
  };
  filecoinStatus: {
    isArchived: boolean;
    deals: {
      dealId: number;
      minerAddress: string;
      status: 'active' | 'pending' | 'failed';
      expiresAt: number;
    }[];
  };
}

export interface StorageEvent {
  type: 'pin' | 'unpin' | 'archive' | 'retrieve';
  cid: string;
  timestamp: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface ContentLocation {
  cid: string;
  gateway?: string;
  ipfsPath?: string;
  filecoinDeal?: {
    dealId: number;
    minerAddress: string;
  };
}

export interface StorageMetrics {
  totalSize: number;
  ipfsPinCount: number;
  filecoinDealCount: number;
  activeDeals: number;
  averageReplication: number;
  costPerDay: BigNumber;
} 