import { Schema, model, Document } from 'mongoose';

/**
 * Interface for the WalletActivity document
 */
export interface IWalletActivity extends Document {
  walletAddress: string;
  userId?: string;
  chain: string;
  activityType: 'send' | 'receive' | 'mint' | 'burn' | 'approval' | 'listing' | 'purchase';
  timestamp: number;
  transactionHash: string;
  tokenId?: string;
  tokenAddress?: string;
  value?: string;
  counterpartyAddress?: string;
  relatedTokens?: string[];
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for the WalletActivity collection
 */
const WalletActivitySchema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  chain: {
    type: String,
    required: true,
    index: true
  },
  activityType: {
    type: String,
    enum: ['send', 'receive', 'mint', 'burn', 'approval', 'listing', 'purchase'],
    required: true,
    index: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    index: true
  },
  tokenId: {
    type: String,
    index: true
  },
  tokenAddress: {
    type: String,
    index: true
  },
  value: {
    type: String
  },
  counterpartyAddress: {
    type: String,
    index: true
  },
  relatedTokens: [String],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create compound indices for efficient queries
WalletActivitySchema.index({ walletAddress: 1, timestamp: -1 });
WalletActivitySchema.index({ walletAddress: 1, activityType: 1 });
WalletActivitySchema.index({ walletAddress: 1, chain: 1 });
WalletActivitySchema.index({ userId: 1, timestamp: -1 });
WalletActivitySchema.index({ transactionHash: 1, chain: 1 });

/**
 * Model for the WalletActivity collection
 */
export const WalletActivity = model<IWalletActivity>('WalletActivity', WalletActivitySchema); 