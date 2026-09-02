import { Otp } from './otp.model.js';
import type { CreateOtpParams, VerifyOtpParams } from './otp.interface.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Helper to generate a random N-digit numeric OTP string.
 */
export const generateNumericOtp = (digits = 6): string => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/**
 * Creates and stores a new OTP for a given email and purpose.
 * Automatically invalidates previous unused OTPs for the same email & purpose.
 */
export const createOtpService = async (params: CreateOtpParams): Promise<string> => {
  const { email, purpose, expirationMinutes = 10 } = params;
  const normalizedEmail = email.toLowerCase().trim();

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
  });

  return otp;
};

/**
 * Verifies an incoming OTP code against stored records.
 * Marks the OTP as used upon successful verification.
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
    throw new AppError('Invalid OTP code', 400);
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  return true;
};
