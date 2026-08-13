import { Schema, model, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'USER' | 'HOST' | 'BUSINESS';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  totalPoints: number;
  walletBalance: number;
  refreshToken?: string;
  isAgeOver18: boolean;
  agreesToTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: Boolean;
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
    role: {
      type: String,
      enum: ['USER', 'HOST', 'BUSINESS'],
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
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

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
