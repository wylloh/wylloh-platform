import mongoose, { Schema, Document } from 'mongoose';

// Define rights threshold interface
interface RightsThreshold {
  quantity: number;
  rightsType: number;
  description: string;
}

// Define content document interface
export interface IContent extends Document {
  title: string;
  description: string;
  contentType: string;
  ipfsCid: string;
  previewCid: string;
  thumbnailCid: string;
  metadataCid: string;
  creator: mongoose.Types.ObjectId | any;
  status: string;
  visibility: string;
  metadata: any;
  tokenId: string;
  contractAddress: string;
  rightsThresholds: RightsThreshold[];
  createdAt: Date;
  updatedAt: Date;
}

// Create content schema
const ContentSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    contentType: {
      type: String,
      required: [true, 'Content type is required'],
      enum: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    ipfsCid: {
      type: String,
      trim: true
    },
    previewCid: {
      type: String,
      trim: true
    },
    thumbnailCid: {
      type: String,
      trim: true
    },
    metadataCid: {
      type: String,
      trim: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'inactive', 'deleted'],
      default: 'draft'
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'private'
    },
    metadata: {
      type: Object,
      default: {}
    },
    tokenId: {
      type: String,
      default: null
    },
    contractAddress: {
      type: String,
      default: null
    },
    rightsThresholds: [
      {
        quantity: {
          type: Number,
          required: true
        },
        rightsType: {
          type: Number,
          required: true
        },
        description: {
          type: String,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Create text indexes for search functionality
ContentSchema.index(
  { 
    title: 'text', 
    description: 'text'
  }, 
  {
    weights: {
      title: 10,
      description: 5
    }
  }
);

// Create compound indexes
ContentSchema.index({ creator: 1, status: 1 });
ContentSchema.index({ contentType: 1, status: 1 });
ContentSchema.index({ visibility: 1, status: 1 });
ContentSchema.index({ tokenId: 1 }, { sparse: true });

// Create and export the model
const Content = mongoose.model<IContent>('Content', ContentSchema);
export default Content;