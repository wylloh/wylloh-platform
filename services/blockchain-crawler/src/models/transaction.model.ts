import { Schema, model, Document } from 'mongoose';

/**
 * Interface for the TransactionHistory document
 */
export interface ITransaction extends Document {
  transactionHash: string;
  chain: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  tokenId?: string;
  tokenAddress?: string;
  value?: string;
  eventType: 'transfer' | 'approval' | 'mint' | 'burn' | 'list' | 'purchase' | 'other';
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  processingStatus: 'new' | 'processing' | 'processed' | 'failed' | 'retrying';
  processingAttempts: number;
  processingError?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for the TransactionHistory collection
 */
const TransactionSchema = new Schema({
  transactionHash: {
    type: String,
    required: true,
    index: true
  },
  chain: {
    type: String,
    required: true,
    index: true
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
  },
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
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
  eventType: {
    type: String,
    enum: ['transfer', 'approval', 'mint', 'burn', 'list', 'purchase', 'other'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },
  gasUsed: {
    type: String
  },
  gasPrice: {
    type: String
  },
  processingStatus: {
    type: String,
    enum: ['new', 'processing', 'processed', 'failed', 'retrying'],
    default: 'new',
    index: true
  },
  processingAttempts: {
    type: Number,
    default: 0
  },
  processingError: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create compound indices for efficient queries
TransactionSchema.index({ transactionHash: 1, chain: 1 }, { unique: true });
TransactionSchema.index({ from: 1, timestamp: -1 });
TransactionSchema.index({ to: 1, timestamp: -1 });
TransactionSchema.index({ tokenAddress: 1, tokenId: 1 });
TransactionSchema.index({ processingStatus: 1, processingAttempts: 1 });

/**
 * Model for the TransactionHistory collection
 */
export const Transaction = model<ITransaction>('Transaction', TransactionSchema); 