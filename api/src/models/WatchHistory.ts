import mongoose, { Document, Schema } from 'mongoose';

export interface IWatchHistory extends Document {
  userId: mongoose.Types.ObjectId;
  contentId: mongoose.Types.ObjectId;
  watchedAt: Date;
  watchDuration: number; // in seconds
  totalDuration: number; // in seconds
  completed: boolean;
  progress: number; // percentage (0-100)
  deviceType?: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WatchHistorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  watchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  watchDuration: {
    type: Number,
    required: true,
    min: 0
  },
  totalDuration: {
    type: Number,
    required: true,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'tv', 'other'],
    default: 'other'
  },
  sessionId: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
WatchHistorySchema.index({ userId: 1, contentId: 1 });
WatchHistorySchema.index({ userId: 1, watchedAt: -1 });
WatchHistorySchema.index({ contentId: 1, watchedAt: -1 });

export default mongoose.model<IWatchHistory>('WatchHistory', WatchHistorySchema); 