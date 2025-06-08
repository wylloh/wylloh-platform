import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreference extends Document {
  userId: mongoose.Types.ObjectId;
  preferences: {
    genres: string[];
    contentTypes: string[];
    languages: string[];
    countries: string[];
    actors: string[];
    directors: string[];
    studios: string[];
    tags: string[];
  };
  recommendations: {
    enabled: boolean;
    frequency: string;
    types: string[];
  };
  notifications: {
    newContent: boolean;
    recommendations: boolean;
    updates: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: string;
    showWatchHistory: boolean;
    showRatings: boolean;
    showReviews: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferenceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  preferences: {
    genres: [{
      type: String,
      trim: true
    }],
    contentTypes: [{
      type: String,
      enum: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    }],
    languages: [{
      type: String,
      trim: true
    }],
    countries: [{
      type: String,
      trim: true
    }],
    actors: [{
      type: String,
      trim: true
    }],
    directors: [{
      type: String,
      trim: true
    }],
    studios: [{
      type: String,
      trim: true
    }],
    tags: [{
      type: String,
      trim: true
    }]
  },
  recommendations: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    },
    types: [{
      type: String,
      enum: ['content-based', 'collaborative', 'trending', 'new-releases']
    }]
  },
  notifications: {
    newContent: {
      type: Boolean,
      default: true
    },
    recommendations: {
      type: Boolean,
      default: true
    },
    updates: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    showWatchHistory: {
      type: Boolean,
      default: true
    },
    showRatings: {
      type: Boolean,
      default: true
    },
    showReviews: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

export default mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema); 