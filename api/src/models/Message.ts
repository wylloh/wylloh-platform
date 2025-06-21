import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  messageType: 'text' | 'image' | 'video' | 'document' | 'system';
  content: string;
  attachments?: {
    filename: string;
    url: string;
    fileType: string;
    fileSize: number;
  }[];
  metadata?: {
    // Pro application context
    relatedProApplication?: mongoose.Types.ObjectId;
    isAdminMessage?: boolean;
    requiresResponse?: boolean;
    // Social networking context
    projectId?: mongoose.Types.ObjectId;
    castingCall?: mongoose.Types.ObjectId;
    collaborationRequest?: boolean;
  };
  status: 'sent' | 'delivered' | 'read';
  readAt?: Date;
  editedAt?: Date;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  conversationType: 'direct' | 'group' | 'pro_application' | 'project_discussion';
  title?: string;
  description?: string;
  metadata?: {
    // Pro application conversation
    relatedProApplication?: mongoose.Types.ObjectId;
    adminParticipants?: mongoose.Types.ObjectId[];
    // Social networking conversation
    projectId?: mongoose.Types.ObjectId;
    isPublic?: boolean;
    tags?: string[];
  };
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'document', 'system'],
      default: 'text'
    },
    content: {
      type: String,
      required: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    attachments: [{
      filename: String,
      url: String,
      fileType: String,
      fileSize: Number
    }],
    metadata: {
      relatedProApplication: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      isAdminMessage: {
        type: Boolean,
        default: false
      },
      requiresResponse: {
        type: Boolean,
        default: false
      },
      projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
      },
      castingCall: {
        type: Schema.Types.ObjectId,
        ref: 'CastingCall'
      },
      collaborationRequest: {
        type: Boolean,
        default: false
      }
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    readAt: Date,
    editedAt: Date,
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const ConversationSchema: Schema = new Schema(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    conversationType: {
      type: String,
      enum: ['direct', 'group', 'pro_application', 'project_discussion'],
      required: true
    },
    title: {
      type: String,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    metadata: {
      relatedProApplication: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      adminParticipants: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
      },
      isPublic: {
        type: Boolean,
        default: false
      },
      tags: [String]
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, recipientId: 1 });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema); 