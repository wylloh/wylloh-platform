import { Schema, model, Document } from 'mongoose';

export interface IListing extends Document {
  tokenId: string;
  tokenAddress: string;
  chainId: string;
  seller: string;
  price: string;
  quantity: number;
  availableQuantity: number;
  status: 'active' | 'sold' | 'cancelled';
  transactionHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema({
  tokenId: {
    type: String,
    required: true,
  },
  tokenAddress: {
    type: String,
    required: true,
  },
  chainId: {
    type: String,
    required: true,
  },
  seller: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active',
  },
  transactionHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create compound indices for quick lookups
ListingSchema.index({ tokenId: 1, tokenAddress: 1, chainId: 1, seller: 1 });
ListingSchema.index({ seller: 1, status: 1 });
ListingSchema.index({ status: 1, chainId: 1 });

export const Listing = model<IListing>('Listing', ListingSchema); 