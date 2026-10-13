import type { z } from 'zod';
import type {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validation.js';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

import type { IBusinessProfile } from '../businessProfile/businessProfile.interface.js';

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface AuthResponse {
  _id: unknown;
  name: string;
  email: string;
  phoneNumber?: string | undefined;
  profileImage?: string | undefined;
  role: string;
  accessToken: string;
  refreshToken: string;
  businessProfile?: IBusinessProfile | null | undefined;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyOtpResponse {
  message: string;
  resetToken: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface DeleteAccountInput {
  hardDelete?: boolean | string | undefined;
  reason?: string | undefined;
}

export interface DeleteAccountResponse {
  message: string;
  deletedType: 'soft' | 'hard';
}

export interface UserProfileResponse {
  _id: unknown;
  name: string;
  email: string;
  phoneNumber?: string | undefined;
  profileImage?: string | undefined;
  role: string;
  totalPoints: number;
  walletBalance: number;
  isAgeOver18: boolean;
  agreesToTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
  businessProfile?: IBusinessProfile | null | undefined;
}


