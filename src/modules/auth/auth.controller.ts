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
  resetPasswordService,
  getMeService,
  refreshTokenService,
} from './auth.service.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await registerUserService(req.body);
  sendResponse(res, {
    statusCode: 201,
    message: 'User registered successfully',
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
// @route   POST /api/auth/verify-otp
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

  const userProfile = await getMeService(req.user.id);
  sendResponse(res, {
    statusCode: 200,
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
