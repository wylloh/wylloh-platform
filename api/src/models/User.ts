import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  walletAddress?: string;
  roles: string[];
  profileImageUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  emailVerificationToken?: string;
  // 🚀 PRO STATUS FIELDS - Database-backed Pro authorization system
  proStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  proVerificationData?: {
    fullName: string;
    biography: string;
    professionalLinks: {
      imdb?: string;
      website?: string;
      vimeo?: string;
      linkedin?: string;
    };
    filmographyHighlights: string;
  };
  dateProRequested?: Date;
  dateProApproved?: Date;
  proRejectionReason?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters']
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
      lowercase: true,
      trim: true
    },
    roles: {
      type: [String],
      default: ['user'],
      enum: ['user', 'creator', 'admin']
    },
    profileImageUrl: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpire: {
      type: Date
    },
    emailVerificationToken: {
      type: String
    },
    proStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected']
    },
    proVerificationData: {
      type: {
        fullName: String,
        biography: String,
        professionalLinks: {
          imdb: String,
          website: String,
          vimeo: String,
          linkedin: String
        },
        filmographyHighlights: String
      }
    },
    dateProRequested: {
      type: Date
    },
    dateProApproved: {
      type: Date
    },
    proRejectionReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create and export the model
const User = mongoose.model<IUser>('User', UserSchema);
export default User;