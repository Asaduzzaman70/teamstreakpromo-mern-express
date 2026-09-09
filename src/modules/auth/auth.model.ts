import { Schema, model, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'USER' | 'HOST' | 'BUSINESS';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profileImage?: string;
  role: UserRole;
  totalPoints: number;
  walletBalance: number;
  rating: number;
  sold: number;
  refreshToken?: string;
  isAgeOver18: boolean;
  agreesToTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: Boolean;
  isSuspend: Boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['USER', 'HOST', 'BUSINESS', 'ADMIN'],
      default: 'USER',
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, 'Sold count cannot be negative'],
    },
    refreshToken: {
      type: String,
      default: '',
    },
    isAgeOver18: {
      type: Boolean,
      required: [true, 'Age confirmation is required'],
    },
    agreesToTerms: {
      type: Boolean,
      required: [true, 'Terms and conditions agreement is required'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isSuspend: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Virtual field to populate BusinessProfile
UserSchema.virtual('businessProfile', {
  ref: 'BusinessProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Pre-save hook to hash password
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', UserSchema);
