import mongoose, { Schema, Document } from 'mongoose';

export interface ILibrary extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  isPublic: boolean;
  items: {
    contentId: mongoose.Types.ObjectId;
    purchaseDate: Date;
    purchasePrice: number;
    currentValue: number;
    licenseType: 'personal' | 'commercial';
    licenseExpiry?: Date;
    isLent: boolean;
    lentTo?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const LibrarySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  items: [{
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      required: true
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    purchasePrice: {
      type: Number,
      required: true
    },
    currentValue: {
      type: Number,
      required: true
    },
    licenseType: {
      type: String,
      enum: ['personal', 'commercial'],
      required: true
    },
    licenseExpiry: {
      type: Date
    },
    isLent: {
      type: Boolean,
      default: false
    },
    lentTo: {
      type: String
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
LibrarySchema.index({ userId: 1 });
LibrarySchema.index({ isPublic: 1 });
LibrarySchema.index({ 'items.contentId': 1 });

export const Library = mongoose.model<ILibrary>('Library', LibrarySchema); 