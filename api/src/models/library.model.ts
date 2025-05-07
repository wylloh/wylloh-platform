import mongoose, { Document, Schema } from 'mongoose';

export interface ILibrary extends Document {
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  items: Array<{
    contentId: string;
    purchaseDate: Date;
    purchasePrice: number;
    currentValue: number;
    licenseType: 'personal' | 'commercial';
    licenseExpiry?: Date;
    isLent: boolean;
    lentTo?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LibrarySchema = new Schema<ILibrary>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    items: [
      {
        contentId: {
          type: String,
          required: true,
          index: true,
        },
        purchaseDate: {
          type: Date,
          required: true,
        },
        purchasePrice: {
          type: Number,
          required: true,
        },
        currentValue: {
          type: Number,
          required: true,
        },
        licenseType: {
          type: String,
          enum: ['personal', 'commercial'],
          required: true,
        },
        licenseExpiry: {
          type: Date,
        },
        isLent: {
          type: Boolean,
          default: false,
        },
        lentTo: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Library = mongoose.model<ILibrary>('Library', LibrarySchema); 