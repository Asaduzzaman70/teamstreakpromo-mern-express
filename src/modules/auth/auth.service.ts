import jwt from 'jsonwebtoken';
import { User } from './auth.model.js';
import config from '../../config/config.js';
import { AppError } from '../../utils/AppError.js';
import { createOtpService, verifyOtpService as verifyOtpFromService } from '../otp/otp.service.js';
import { sendOtpEmail } from '../../utils/sendEmail.js';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
  AuthResponse,
  ForgotPasswordResponse,
  VerifyOtpResponse,
  ResetPasswordResponse,
  UserProfileResponse,
} from './auth.interface.js';

const generateAccessToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

const generateRefreshToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
  });
};

const generateResetToken = (email: string): string => {
  return jwt.sign({ email, purpose: 'RESET_PASSWORD' }, config.resetTokenSecret, {
    expiresIn: config.resetTokenExpiresIn as any,
  });
};

export const registerUserService = async (
  data: RegisterInput
): Promise<AuthResponse> => {
  const { name, email, password, role, isAgeOver18, agreesToTerms } = data;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError('User already exists with this email', 400);
  }

  const user = new User({
    name,
    email,
    password,
    role,
    isAgeOver18,
    agreesToTerms,
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  };
};

export const loginUserService = async (
  data: LoginInput
): Promise<AuthResponse> => {
  const { email, password } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 400);
  }

  if (!user.isActive) {
    throw new AppError('Your account is not active (suspended or deleted)', 400);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 400);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  };
};

export const forgotPasswordService = async (
  data: ForgotPasswordInput
): Promise<ForgotPasswordResponse> => {
  const { email } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No account found with this email address', 404);
  }

  // Generate 6-digit OTP and store it in OTP collection
  const otp = await createOtpService({
    email: user.email,
    purpose: 'FORGOT_PASSWORD',
    expirationMinutes: 10,
  });

  // Send OTP to user's email via Nodemailer
  await sendOtpEmail({
    to: user.email,
    otp,
    purposeTitle: 'Password Reset',
  });

  return {
    message: 'OTP has been sent to your email address.',
  };
};

export const verifyOtpService = async (
  data: VerifyOtpInput
): Promise<VerifyOtpResponse> => {
  const { email, otp } = data;

  // Verify OTP using OTP service
  await verifyOtpFromService({
    email,
    otp,
    purpose: 'FORGOT_PASSWORD',
  });

  // Generate reset token valid for reset password step
  const resetToken = generateResetToken(email);

  return {
    message: 'OTP verified successfully.',
    resetToken,
  };
};

export const resetPasswordService = async (
  data: ResetPasswordInput
): Promise<ResetPasswordResponse> => {
  const { resetToken, newPassword } = data;

  let decodedPayload: any;
  try {
    decodedPayload = jwt.verify(resetToken, config.resetTokenSecret);
  } catch (error) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  if (!decodedPayload || decodedPayload.purpose !== 'RESET_PASSWORD' || !decodedPayload.email) {
    throw new AppError('Invalid reset token', 400);
  }

  const user = await User.findOne({ email: decodedPayload.email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = newPassword;
  await user.save();

  return {
    message: 'Password reset successfully. You can now log in with your new password.',
  };
};

export const getMeService = async (
  userId: string
): Promise<UserProfileResponse> => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.toObject() as UserProfileResponse;
};
