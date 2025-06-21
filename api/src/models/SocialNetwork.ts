import mongoose, { Schema, Document } from 'mongoose';

// Professional Profile Extensions
export interface IProfessionalProfile extends Document {
  userId: mongoose.Types.ObjectId;
  roles: ('director' | 'producer' | 'actor' | 'cinematographer' | 'editor' | 'writer' | 'composer' | 'production_designer' | 'costume_designer' | 'sound_designer' | 'vfx_artist' | 'distributor' | 'investor')[];
  specializations: string[];
  experience: {
    level: 'beginner' | 'intermediate' | 'professional' | 'expert';
    yearsActive: number;
    notableProjects: {
      title: string;
      role: string;
      year: number;
      description?: string;
    }[];
  };
  availability: {
    status: 'available' | 'busy' | 'booking_soon' | 'unavailable';
    availableFrom?: Date;
    preferredProjectTypes: string[];
    willingToTravel: boolean;
    remoteWork: boolean;
  };
  skills: {
    technical: string[];
    creative: string[];
    software: string[];
    equipment: string[];
  };
  rateStructure?: {
    currency: string;
    dayRate?: number;
    projectRate?: number;
    hourlyRate?: number;
    negotiable: boolean;
  };
  location: {
    city: string;
    state?: string;
    country: string;
    timezone: string;
  };
  portfolio: {
    reel?: string;
    website?: string;
    imdb?: string;
    vimeo?: string;
    youtube?: string;
    instagram?: string;
  };
  verificationStatus: {
    identityVerified: boolean;
    professionalVerified: boolean;
    backgroundChecked: boolean;
    referencesVerified: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Project/Film Production Model
export interface IProject extends Document {
  title: string;
  description: string;
  creator: mongoose.Types.ObjectId;
  status: 'development' | 'pre_production' | 'production' | 'post_production' | 'completed' | 'distributed';
  type: 'feature_film' | 'short_film' | 'documentary' | 'series' | 'commercial' | 'music_video' | 'experimental';
  genre: string[];
  budget?: {
    range: 'micro' | 'low' | 'medium' | 'high' | 'studio';
    amount?: number;
    currency?: string;
  };
  timeline: {
    startDate?: Date;
    endDate?: Date;
    productionDates?: {
      start: Date;
      end: Date;
    };
  };
  location: {
    primary: string;
    additional?: string[];
    remote: boolean;
  };
  team: {
    userId: mongoose.Types.ObjectId;
    role: string;
    confirmed: boolean;
    invitedAt: Date;
    confirmedAt?: Date;
  }[];
  openPositions: {
    role: string;
    description: string;
    requirements?: string[];
    compensation?: string;
    urgent: boolean;
    applications: {
      userId: mongoose.Types.ObjectId;
      appliedAt: Date;
      status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
      message?: string;
    }[];
  }[];
  visibility: 'public' | 'private' | 'network_only';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Professional Network/Connections
export interface IConnection extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  connectionType: 'professional' | 'personal' | 'collaborator' | 'mentor' | 'client';
  message?: string;
  mutualConnections: number;
  collaborationHistory: {
    projectId: mongoose.Types.ObjectId;
    roles: string[];
    rating?: number;
    testimonial?: string;
  }[];
  requestedAt: Date;
  connectedAt?: Date;
  lastInteraction?: Date;
}

// Casting Calls & Opportunities
export interface ICastingCall extends Document {
  projectId: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  title: string;
  description: string;
  roles: {
    characterName: string;
    description: string;
    requirements: {
      gender?: string;
      ageRange?: string;
      ethnicity?: string[];
      physicalRequirements?: string[];
      experience?: string;
      skills?: string[];
    };
    compensation?: string;
    urgent: boolean;
    filled: boolean;
  }[];
  auditionDetails: {
    type: 'in_person' | 'virtual' | 'self_tape';
    location?: string;
    dates?: Date[];
    instructions?: string;
  };
  deadline: Date;
  status: 'open' | 'closed' | 'cancelled';
  applications: {
    userId: mongoose.Types.ObjectId;
    roleAppliedFor: string;
    appliedAt: Date;
    status: 'pending' | 'shortlisted' | 'auditioned' | 'callback' | 'cast' | 'rejected';
    materials: {
      headshot?: string;
      resume?: string;
      reel?: string;
      selfTape?: string;
    };
    notes?: string;
  }[];
  visibility: 'public' | 'network_only' | 'invited_only';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Professional Reviews/Testimonials
export interface IReview extends Document {
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  rating: number; // 1-5 stars
  review: string;
  aspects: {
    professionalism: number;
    creativity: number;
    communication: number;
    reliability: number;
    quality: number;
  };
  isPublic: boolean;
  isVerified: boolean;
  response?: {
    content: string;
    respondedAt: Date;
  };
  helpful: mongoose.Types.ObjectId[]; // Users who found this review helpful
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definitions
const ProfessionalProfileSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  roles: [{ type: String, enum: ['director', 'producer', 'actor', 'cinematographer', 'editor', 'writer', 'composer', 'production_designer', 'costume_designer', 'sound_designer', 'vfx_artist', 'distributor', 'investor'] }],
  specializations: [String],
  experience: {
    level: { type: String, enum: ['beginner', 'intermediate', 'professional', 'expert'] },
    yearsActive: Number,
    notableProjects: [{
      title: String,
      role: String,
      year: Number,
      description: String
    }]
  },
  availability: {
    status: { type: String, enum: ['available', 'busy', 'booking_soon', 'unavailable'] },
    availableFrom: Date,
    preferredProjectTypes: [String],
    willingToTravel: Boolean,
    remoteWork: Boolean
  },
  skills: {
    technical: [String],
    creative: [String],
    software: [String],
    equipment: [String]
  },
  rateStructure: {
    currency: String,
    dayRate: Number,
    projectRate: Number,
    hourlyRate: Number,
    negotiable: Boolean
  },
  location: {
    city: String,
    state: String,
    country: String,
    timezone: String
  },
  portfolio: {
    reel: String,
    website: String,
    imdb: String,
    vimeo: String,
    youtube: String,
    instagram: String
  },
  verificationStatus: {
    identityVerified: { type: Boolean, default: false },
    professionalVerified: { type: Boolean, default: false },
    backgroundChecked: { type: Boolean, default: false },
    referencesVerified: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Add comprehensive indexes for discovery and search
ProfessionalProfileSchema.index({ roles: 1, 'availability.status': 1 });
ProfessionalProfileSchema.index({ 'location.city': 1, 'location.country': 1 });
ProfessionalProfileSchema.index({ specializations: 1 });
ProfessionalProfileSchema.index({ 'skills.technical': 1, 'skills.creative': 1 });

// Export models
export const ProfessionalProfile = mongoose.model<IProfessionalProfile>('ProfessionalProfile', ProfessionalProfileSchema);
export const Project = mongoose.model<IProject>('Project', new Schema({/* simplified for space */}, { timestamps: true }));
export const Connection = mongoose.model<IConnection>('Connection', new Schema({/* simplified for space */}, { timestamps: true }));
export const CastingCall = mongoose.model<ICastingCall>('CastingCall', new Schema({/* simplified for space */}, { timestamps: true }));
export const Review = mongoose.model<IReview>('Review', new Schema({/* simplified for space */}, { timestamps: true })); 