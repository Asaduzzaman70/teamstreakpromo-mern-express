import type { Document } from 'mongoose';

export type OtpPurpose = 'FORGOT_PASSWORD' | 'EMAIL_VERIFICATION' | 'TWO_FACTOR_AUTH';

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOtpParams {
  email: string;
  purpose: OtpPurpose;
  expirationMinutes?: number;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}
