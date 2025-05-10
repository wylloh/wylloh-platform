import mongoose, { Schema, Document } from 'mongoose';

export interface LendingDocument extends Document {
  contentId: mongoose.Types.ObjectId;
  contentTitle?: string;
  thumbnailUrl?: string;
  lenderId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  borrowerEmail: string;
  duration: number;
  price: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date;
  isPaid: boolean;
  paymentDate?: Date;
  paymentAmount?: number;
  blockchainTransactionHash?: string;
  blockchainBlockNumber?: number;
  returnTransactionHash?: string;
  returnBlockNumber?: number;
  cancelTransactionHash?: string;
  cancelBlockNumber?: number;
  paymentTransactionHash?: string;
  paymentBlockNumber?: number;
}

const LendingSchema = new Schema({
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  contentTitle: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },
  lenderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowerEmail: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date
  },
  paymentAmount: {
    type: Number
  },
  blockchainTransactionHash: {
    type: String
  },
  blockchainBlockNumber: {
    type: Number
  },
  returnTransactionHash: {
    type: String
  },
  returnBlockNumber: {
    type: Number
  },
  cancelTransactionHash: {
    type: String
  },
  cancelBlockNumber: {
    type: Number
  },
  paymentTransactionHash: {
    type: String
  },
  paymentBlockNumber: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
LendingSchema.index({ contentId: 1 });
LendingSchema.index({ lenderId: 1 });
LendingSchema.index({ borrowerId: 1 });
LendingSchema.index({ status: 1 });

export const Lending = mongoose.model<LendingDocument>('Lending', LendingSchema); 