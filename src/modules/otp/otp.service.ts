import crypto from 'crypto';
import { Otp } from './otp.model.js';
import type { CreateOtpParams, VerifyOtpParams } from './otp.interface.js';
import { AppError } from '../../utils/AppError.js';

const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Helper to generate a cryptographically secure random N-digit numeric OTP string.
 */
export const generateNumericOtp = (digits = 6): string => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits);
  return crypto.randomInt(min, max).toString();
};

/**
 * Creates and stores a new OTP for a given email and purpose.
 * Enforces a 60-second cooldown and automatically invalidates previous unused OTPs for the same email & purpose.
 */
export const createOtpService = async (params: CreateOtpParams): Promise<string> => {
  const { email, purpose, expirationMinutes = 10 } = params;
  const normalizedEmail = email.toLowerCase().trim();

  // Enforce 60-second cooldown between consecutive OTP generation requests
  const recentOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (recentOtp && Date.now() - new Date(recentOtp.createdAt).getTime() < OTP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil(
      (OTP_COOLDOWN_MS - (Date.now() - new Date(recentOtp.createdAt).getTime())) / 1000
    );
    throw new AppError(
      `Please wait ${remainingSeconds} second(s) before requesting a new OTP code.`,
      429
    );
  }

  // Invalidate previous unused OTPs for the same email and purpose
  await Otp.deleteMany({ email: normalizedEmail, purpose, isUsed: false });

  const otp = generateNumericOtp(6);
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  await Otp.create({
    email: normalizedEmail,
    otp,
    purpose,
    expiresAt,
    isUsed: false,
    attempts: 0,
  });

  return otp;
};

/**
 * Verifies an incoming OTP code against stored records.
 * Tracks failed attempts (max 5) and marks the OTP as used upon successful verification.
 */
export const verifyOtpService = async (params: VerifyOtpParams): Promise<boolean> => {
  const { email, otp, purpose } = params;
  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new AppError('Invalid or expired OTP code', 400);
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new AppError('OTP has expired. Please request a new code', 400);
  }

  if (otpRecord.otp !== otp) {
    const currentAttempts = (otpRecord.attempts || 0) + 1;
    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new AppError(
        'Maximum OTP verification attempts exceeded. Please request a new OTP code.',
        429
      );
    }

    otpRecord.attempts = currentAttempts;
    await otpRecord.save();
    throw new AppError('Invalid OTP code', 400);
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  return true;
};
