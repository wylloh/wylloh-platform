import { Schema, model, Document } from 'mongoose';

export interface IToken extends Document {
  tokenId: string;
  tokenAddress: string;
  chainId: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Record<string, any>[];
  };
  owners: {
    address: string;
    balance: number;
  }[];
  totalSupply: number;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema = new Schema({
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
  metadata: {
    name: String,
    description: String,
    image: String,
    attributes: [{
      type: Schema.Types.Mixed,
    }],
  },
  owners: [{
    address: String,
    balance: Number,
  }],
  totalSupply: {
    type: Number,
    default: 0,
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

// Create a compound index for quick lookups
TokenSchema.index({ tokenId: 1, tokenAddress: 1, chainId: 1 }, { unique: true });
// Index for searching by owner
TokenSchema.index({ 'owners.address': 1 });

export const Token = model<IToken>('Token', TokenSchema); 