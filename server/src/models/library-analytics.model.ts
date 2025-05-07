import mongoose, { Schema, Document } from 'mongoose';

export interface ILibraryAnalytics extends Document {
  libraryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  totalValue: number;
  valueHistory: {
    date: Date;
    value: number;
    change: number;
    changePercentage: number;
  }[];
  lendingMetrics: {
    totalLends: number;
    activeLends: number;
    averageLendDuration: number;
    lendingRevenue: number;
  };
  engagementMetrics: {
    views: number;
    shares: number;
    uniqueViewers: number;
    averageWatchTime: number;
  };
  lastUpdated: Date;
}

const LibraryAnalyticsSchema = new Schema({
  libraryId: {
    type: Schema.Types.ObjectId,
    ref: 'Library',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalValue: {
    type: Number,
    required: true,
    default: 0
  },
  valueHistory: [{
    date: {
      type: Date,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    change: {
      type: Number,
      required: true
    },
    changePercentage: {
      type: Number,
      required: true
    }
  }],
  lendingMetrics: {
    totalLends: {
      type: Number,
      default: 0
    },
    activeLends: {
      type: Number,
      default: 0
    },
    averageLendDuration: {
      type: Number,
      default: 0
    },
    lendingRevenue: {
      type: Number,
      default: 0
    }
  },
  engagementMetrics: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    uniqueViewers: {
      type: Number,
      default: 0
    },
    averageWatchTime: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
LibraryAnalyticsSchema.index({ libraryId: 1, userId: 1 });
LibraryAnalyticsSchema.index({ 'valueHistory.date': -1 });

export const LibraryAnalytics = mongoose.model<ILibraryAnalytics>('LibraryAnalytics', LibraryAnalyticsSchema); 