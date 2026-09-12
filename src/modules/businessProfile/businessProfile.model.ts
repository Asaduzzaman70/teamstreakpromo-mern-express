import { Schema, model } from 'mongoose';
import type { IBusinessProfile } from './businessProfile.interface.js';

const BusinessProfileSchema = new Schema<IBusinessProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    businessDescription: {
      type: String,
      required: [true, 'Business description is required'],
      trim: true,
    },
    einNumber: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    govtIdFrontImage: {
      type: String,
      required: [true, 'Govt ID front image is required'],
      trim: true,
    },
    govtIdBackImage: {
      type: String,
      required: [true, 'Govt ID back image is required'],
      trim: true,
    },
    businessLicenseFrontImage: {
      type: String,
      default: '',
      trim: true,
    },
    businessLicenseBackImage: {
      type: String,
      default: '',
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    stripeAccountId: {
      type: String,
      default: '',
      trim: true,
    },
    stripeAccountStatus: {
      type: String,
      enum: ['UNLINKED', 'PENDING', 'ACTIVE', 'RESTRICTED', 'INACTIVE'],
      default: 'UNLINKED',
    },
    isStripeConnected: {
      type: Boolean,
      default: false,
    },
    isStripeVerified: {
      type: Boolean,
      default: false,
    },
    stripePayoutsEnabled: {
      type: Boolean,
      default: false,
    },
    stripeChargesEnabled: {
      type: Boolean,
      default: false,
    },
    stripeDetailsSubmitted: {
      type: Boolean,
      default: false,
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
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

BusinessProfileSchema.methods.updateProfile = async function (
  profileData: Partial<IBusinessProfile>
): Promise<IBusinessProfile> {
  Object.assign(this, profileData);
  return this.save();
};

BusinessProfileSchema.methods.submitForVerification = async function (): Promise<IBusinessProfile> {
  this.verificationStatus = 'PENDING';
  this.submittedAt = new Date();
  return this.save();
};

export const BusinessProfile = model<IBusinessProfile>(
  'BusinessProfile',
  BusinessProfileSchema
);
