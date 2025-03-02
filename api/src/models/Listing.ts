import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  tokenId: string;
  contractAddress: string;
  contentId: mongoose.Types.ObjectId | any;
  seller: mongoose.Types.ObjectId | any;
  quantity: number;
  price: number;
  currency: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  transactionHash?: string;
  buyer?: mongoose.Types.ObjectId | any;
  completedAt?: Date;
}

const ListingSchema: Schema = new Schema(
  {
    tokenId: {
      type: String,
      required: [true, 'Token ID is required']
    },
    contractAddress: {
      type: String,
      required: [true, 'Contract address is required'],
      lowercase: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: [true, 'Content ID is required']
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: ['MATIC', 'ETH', 'USDC', 'USDT'],
      default: 'MATIC'
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['active', 'sold', 'cancelled', 'expired'],
      default: 'active'
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Default expiration is 30 days from creation
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return thirtyDaysFromNow;
      }
    },
    transactionHash: {
      type: String,
      trim: true,
      sparse: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    completedAt: {
      type: Date,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for efficient queries
ListingSchema.index({ tokenId: 1, contractAddress: 1, status: 1 });
ListingSchema.index({ seller: 1, status: 1 });
ListingSchema.index({ contentId: 1, status: 1 });
ListingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic expiration
ListingSchema.index({ price: 1, createdAt: -1 });

// Create and export the model
const Listing = mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;