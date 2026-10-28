import { Schema, model } from 'mongoose';
import type { IOtp } from './otp.interface.js';

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['FORGOT_PASSWORD', 'EMAIL_VERIFICATION', 'TWO_FACTOR_AUTH'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index to automatically delete document at expiresAt
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, purpose: 1 });

export const Otp = model<IOtp>('Otp', otpSchema);
