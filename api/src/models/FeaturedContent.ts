import mongoose, { Document, Schema } from 'mongoose';

export interface IFeaturedContent extends Document {
  contentId: string;
  title: string;
  description: string;
  imageUrl: string;
  creator: string;
  price: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const FeaturedContentSchema = new Schema<IFeaturedContent>({
  contentId: {
    type: String,
    required: true,
    ref: 'Content'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  creator: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying of active featured content
FeaturedContentSchema.index({ isActive: 1, startDate: 1, endDate: 1, priority: -1 });

export const FeaturedContent = mongoose.model<IFeaturedContent>('FeaturedContent', FeaturedContentSchema); 