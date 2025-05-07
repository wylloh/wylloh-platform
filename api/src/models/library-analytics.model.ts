import mongoose, { Document, Schema } from 'mongoose';

export interface ILibraryAnalytics extends Document {
  libraryId: string;
  userId: string;
  totalValue: number;
  valueHistory: Array<{
    value: number;
    timestamp: Date;
  }>;
  lendingMetrics: {
    totalLends: number;
    totalRevenue: number;
    averageLendDuration: number;
  };
  engagementMetrics: {
    totalViews: number;
    uniqueViewers: number;
    averageWatchTime: number;
  };
  updatedAt: Date;
}

const LibraryAnalyticsSchema = new Schema<ILibraryAnalytics>(
  {
    libraryId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    valueHistory: [
      {
        value: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
      },
    ],
    lendingMetrics: {
      totalLends: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      averageLendDuration: {
        type: Number,
        default: 0,
      },
    },
    engagementMetrics: {
      totalViews: {
        type: Number,
        default: 0,
      },
      uniqueViewers: {
        type: Number,
        default: 0,
      },
      averageWatchTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const LibraryAnalytics = mongoose.model<ILibraryAnalytics>(
  'LibraryAnalytics',
  LibraryAnalyticsSchema
); 