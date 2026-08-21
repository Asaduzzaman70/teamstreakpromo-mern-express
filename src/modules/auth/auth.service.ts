import jwt from 'jsonwebtoken';
import { User } from './auth.model.js';
import { BusinessProfile } from '../businessProfile/businessProfile.model.js';
import type { IBusinessProfile } from '../businessProfile/businessProfile.interface.js';
import config from '../../config/config.js';
import { AppError } from '../../utils/AppError.js';
import { uploadToS3 } from '../../utils/s3.js';
import { createOtpService, verifyOtpService as verifyOtpFromService } from '../otp/otp.service.js';
import { sendOtpEmail } from '../../utils/sendEmail.js';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
  RefreshTokenInput,
  UpdateProfileInput,
  ChangePasswordInput,
  RegisterResponse,
  AuthResponse,
  RefreshTokenResponse,
  ForgotPasswordResponse,
  VerifyOtpResponse,
  ResetPasswordResponse,
  UserProfileResponse,
  LogoutResponse,
  ChangePasswordResponse,
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
  data: RegisterInput,
  files?: { [fieldname: string]: Express.Multer.File[] }
): Promise<RegisterResponse> => {
  const { name, email, password, role, isAgeOver18, agreesToTerms, businessProfile } = data;

  const userExists = await User.findOne({ email });

  if (userExists) {
    if (userExists.isActive) {
      throw new AppError('User already exists with this email', 400);
    }
    throw new AppError('An account with this email already exists but is not activated. Please verify your email using the OTP or request a new activation OTP.', 400);
  }

  let finalBusinessProfile: any = businessProfile ? { ...businessProfile } : null;

  if (!finalBusinessProfile && (data.businessName || data.businessDescription || data.location)) {
    finalBusinessProfile = {
      businessName: data.businessName,
      businessDescription: data.businessDescription,
      location: data.location,
      einNumber: data.einNumber,
    };
  }

  if ((role === 'HOST' || role === 'BUSINESS') && !finalBusinessProfile) {
    throw new AppError('Business profile details (businessName, businessDescription, location) are required for HOST and BUSINESS roles', 400);
  }

  if (role === 'HOST' || role === 'BUSINESS') {
    const requiredImageFields = [
      { name: 'govtIdFrontImage', label: 'Govt ID front image' },
      { name: 'govtIdBackImage', label: 'Govt ID back image' },
      { name: 'businessLicenseFrontImage', label: 'Business license front image' },
      { name: 'businessLicenseBackImage', label: 'Business license back image' },
    ];

    for (const field of requiredImageFields) {
      const fileObj = files?.[field.name]?.[0];
      const existingUrl = finalBusinessProfile?.[field.name];

      if (fileObj) {
        // Upload image buffer from RAM memory to AWS S3 inside service layer
        const s3Url = await uploadToS3(fileObj, 'business-documents');
        finalBusinessProfile[field.name] = s3Url;
      } else if (!existingUrl) {
        throw new AppError(`${field.label} is required`, 400);
      }
    }
  }

  const user = new User({
    name,
    email,
    password,
    role,
    isAgeOver18,
    agreesToTerms,
    isActive: false,
  });

  await user.save();

  if ((user.role === 'HOST' || user.role === 'BUSINESS') && finalBusinessProfile) {
    await BusinessProfile.create({
      userId: user._id as any,
      businessName: finalBusinessProfile.businessName,
      businessDescription: finalBusinessProfile.businessDescription,
      einNumber: finalBusinessProfile.einNumber || '',
      location: finalBusinessProfile.location,
      govtIdFrontImage: finalBusinessProfile.govtIdFrontImage,
      govtIdBackImage: finalBusinessProfile.govtIdBackImage,
      businessLicenseFrontImage: finalBusinessProfile.businessLicenseFrontImage,
      businessLicenseBackImage: finalBusinessProfile.businessLicenseBackImage,
      submittedAt: new Date(),
      verificationStatus: 'PENDING',
    });
  }

  // Generate 6-digit activation OTP and send to user's email
  const otp = await createOtpService({
    email: user.email,
    purpose: 'EMAIL_VERIFICATION',
    expirationMinutes: 10,
  });

  await sendOtpEmail({
    to: user.email,
    otp,
    purposeTitle: 'Account Activation',
  });

  return {
    message: 'User registered successfully. Please verify your email with the activation OTP sent to your inbox.',
    email: user.email,
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
    throw new AppError('Your account is not active', 400);
  }

  if (user.isSuspend) {
    throw new AppError('Your account is suspend please contact support', 400);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 400);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  let businessProfileData = null;
  if (user.role === 'HOST' || user.role === 'BUSINESS') {
    const profile = await BusinessProfile.findOne({ userId: user._id });
    if (profile) {
      businessProfileData = profile.toObject() as IBusinessProfile;
    }
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
    businessProfile: businessProfileData,
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

export const verifyRegisterOtpService = async (
  data: VerifyOtpInput
): Promise<AuthResponse> => {
  const { email, otp } = data;

  // Verify OTP using OTP service for EMAIL_VERIFICATION
  await verifyOtpFromService({
    email,
    otp,
    purpose: 'EMAIL_VERIFICATION',
  });

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isSuspend) {
    throw new AppError('Your account is suspend please contact support', 400);
  }

  user.isActive = true;

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  let businessProfileData: IBusinessProfile | null = null;
  if (user.role === 'HOST' || user.role === 'BUSINESS') {
    const profile = await BusinessProfile.findOne({ userId: user._id });
    if (profile) {
      businessProfileData = profile.toObject() as IBusinessProfile;
    }
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
    businessProfile: businessProfileData,
  };
};

export const resendForgotPasswordOtpService = async (
  data: ForgotPasswordInput
): Promise<ForgotPasswordResponse> => {
  const { email } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No account found with this email address', 404);
  }

  if (user.isSuspend) {
    throw new AppError('Your account is suspend please contact support', 400);
  }

  const otp = await createOtpService({
    email: user.email,
    purpose: 'FORGOT_PASSWORD',
    expirationMinutes: 10,
  });

  await sendOtpEmail({
    to: user.email,
    otp,
    purposeTitle: 'Password Reset',
  });

  return {
    message: 'Forgot password OTP has been resent to your email address.',
  };
};

export const resendActivationOtpService = async (
  data: ForgotPasswordInput
): Promise<ForgotPasswordResponse> => {
  const { email } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No account found with this email address', 404);
  }

  if (user.isActive) {
    throw new AppError('Account is already active. You can log in.', 400);
  }

  if (user.isSuspend) {
    throw new AppError('Your account is suspend please contact support', 400);
  }

  const otp = await createOtpService({
    email: user.email,
    purpose: 'EMAIL_VERIFICATION',
    expirationMinutes: 10,
  });

  await sendOtpEmail({
    to: user.email,
    otp,
    purposeTitle: 'Account Activation',
  });

  return {
    message: 'Account activation OTP has been resent to your email address.',
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

  const userObj = user.toObject() as UserProfileResponse;

  if (user.role === 'HOST' || user.role === 'BUSINESS') {
    const businessProfile = await BusinessProfile.findOne({ userId: user._id });
    userObj.businessProfile = businessProfile ? (businessProfile.toObject() as IBusinessProfile) : null;
  }

  return userObj;
};

export const refreshTokenService = async (
  data: RefreshTokenInput
): Promise<RefreshTokenResponse> => {
  const { refreshToken } = data;

  let decodedPayload: any;
  try {
    decodedPayload = jwt.verify(refreshToken, config.jwtRefreshSecret);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (!decodedPayload || !decodedPayload.id) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(decodedPayload.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('Your account is not active (suspended or deleted)', 400);
  }

  if (user.refreshToken !== refreshToken) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id, user.role);

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUserService = async (
  userId: string
): Promise<LogoutResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.refreshToken = '';
  await user.save();

  return {
    message: 'User logged out successfully',
  };
};

export const updateProfileService = async (
  userId: string,
  data: UpdateProfileInput
): Promise<UserProfileResponse> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { name, email, phoneNumber, businessName, businessDescription, location } = data;

  const hasBusinessFields =
    businessName !== undefined || businessDescription !== undefined || location !== undefined;

  if (user.role !== 'HOST' && user.role !== 'BUSINESS' && hasBusinessFields) {
    throw new AppError('Regular users cannot update business profile fields', 400);
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: userId },
    });
    if (existingUser) {
      throw new AppError('Email is already in use by another account', 400);
    }
    user.email = email.toLowerCase().trim();
  }

  if (name !== undefined) {
    user.name = name.trim();
  }

  if (phoneNumber !== undefined) {
    user.phoneNumber = phoneNumber.trim();
  }

  await user.save();

  if ((user.role === 'HOST' || user.role === 'BUSINESS') && hasBusinessFields) {
    let businessProfile = await BusinessProfile.findOne({ userId: user._id });

    if (businessProfile) {
      if (businessName !== undefined) businessProfile.businessName = businessName.trim();
      if (businessDescription !== undefined) businessProfile.businessDescription = businessDescription.trim();
      if (location !== undefined) businessProfile.location = location.trim();
      await businessProfile.save();
    } else {
      await BusinessProfile.create({
        userId: user._id as any,
        businessName: businessName?.trim() || '',
        businessDescription: businessDescription?.trim() || '',
        location: location?.trim() || '',
        govtIdFrontImage: '',
        govtIdBackImage: '',
        businessLicenseFrontImage: '',
        businessLicenseBackImage: '',
        submittedAt: new Date(),
        verificationStatus: 'PENDING',
      });
    }
  }

  return getMeService(userId);
};

export const changePasswordService = async (
  userId: string,
  data: ChangePasswordInput
): Promise<ChangePasswordResponse> => {
  const { oldPassword, currentPassword, newPassword } = data;
  const existingPassword = oldPassword || currentPassword;

  if (!existingPassword) {
    throw new AppError('Old password is required', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await user.comparePassword(existingPassword);
  if (!isMatch) {
    throw new AppError('Incorrect current password', 400);
  }

  user.password = newPassword;
  await user.save();

  return {
    message: 'Password changed successfully',
  };
};




