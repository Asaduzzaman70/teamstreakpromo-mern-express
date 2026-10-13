import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import {
  registerUserService,
  loginUserService,
  forgotPasswordService,
  verifyOtpService,
  verifyRegisterOtpService,
  resendForgotPasswordOtpService,
  resendActivationOtpService,
  resetPasswordService,
  getMeService,
  updateProfileService,
  changePasswordService,
  refreshTokenService,
  logoutUserService,
  deleteAccountService,
} from './auth.service.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await registerUserService(req.body, req.files as any);
  sendResponse(res, {
    statusCode: 201,
    message: result.message,
    data: result,
  });
});

// @desc    Verify registration / account activation OTP - Activates account & returns access/refresh tokens
// @route   POST /api/auth/verify-register-otp (or /api/auth/verify-account)
// @access  Public
export const verifyRegisterOtp = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await verifyRegisterOtpService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: 'Account verified & activated successfully',
    data: result,
  });
});

// @desc    Resend Forgot Password OTP
// @route   POST /api/auth/resend-forgot-password-otp
// @access  Public
export const resendForgotPasswordOtp = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await resendForgotPasswordOtpService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

// @desc    Resend Account Activation OTP
// @route   POST /api/auth/resend-activation-otp
// @access  Public
export const resendActivationOtp = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await resendActivationOtpService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await loginUserService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: 'User authenticated successfully',
    data: result,
  });
});

// @desc    Forgot Password request - Sends OTP to user email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await forgotPasswordService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

// @desc    Verify OTP code - Generates password reset token
// @route   POST /api/auth/verify-forgot-password-otp
// @access  Public
export const verifyOtp = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await verifyOtpService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await resetPasswordService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const { userProfile, meta } = await getMeService(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    meta,
    data: userProfile,
  });
});

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await refreshTokenService(req.body);
  sendResponse(res, {
    statusCode: 200,
    message: 'Token refreshed successfully',
    data: result,
  });
});

// @desc    Logout user & clear refresh token
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const result = await logoutUserService(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

// @desc    Update logged in user profile (name, email, phone number, profileImage)
// @route   PATCH /api/auth/profile or PATCH /api/auth/me
// @access  Private
export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const updatedProfile = await updateProfileService(
    req.user.id,
    req.body,
    req.file || (req.files as any)
  );
  sendResponse(res, {
    statusCode: 200,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

// @desc    Change logged in user password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const result = await changePasswordService(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

// @desc    Delete logged in user account (Soft delete by default, hard delete if specified)
// @route   DELETE /api/auth/delete-account or DELETE /api/auth/me
// @access  Private
export const deleteAccount = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const options = {
    hardDelete: req.query.hardDelete ?? req.body?.hardDelete,
    reason: req.body?.reason,
  };

  const result = await deleteAccountService(req.user.id, options);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});
