import type { z } from 'zod';
import type {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from './auth.validation.js';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface AuthResponse {
  _id: unknown;
  name: string;
  email: string;
  role: string;
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

export interface UserProfileResponse {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  totalPoints: number;
  walletBalance: number;
  isAgeOver18: boolean;
  agreesToTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
}
