import { type Document, type Types } from 'mongoose';
import type { z } from 'zod';
import type { businessProfileSchema } from './businessProfile.validation.js';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export interface IBusinessProfile extends Document {
  userId: Types.ObjectId;
  businessName: string;
  businessDescription: string;
  einNumber?: string;
  location: string;
  govtIdFrontImage: string;
  govtIdBackImage: string;
  businessLicenseFrontImage?: string;
  businessLicenseBackImage?: string;
  verificationStatus: VerificationStatus;
  rating: number;
  sold: number;
  submittedAt: Date;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  updateProfile(profileData: Partial<IBusinessProfile>): Promise<IBusinessProfile>;
  submitForVerification(): Promise<IBusinessProfile>;
}
