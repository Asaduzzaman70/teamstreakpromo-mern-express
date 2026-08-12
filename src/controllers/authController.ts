import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendResponse } from '../utils/sendResponse.js';
import { AppError } from '../utils/AppError.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
} from '../validations/authValidation.js';
import {
  registerUserService,
  loginUserService,
  forgotPasswordService,
  getMeService,
} from '../services/authService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    throw new AppError(firstIssue?.message || 'Validation error', 400);
  }

  const result = await registerUserService(parseResult.data);
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
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    throw new AppError(firstIssue?.message || 'Validation error', 400);
  }

  const result = await loginUserService(parseResult.data);
  sendResponse(res, {
    statusCode: 200,
    message: 'User authenticated successfully',
    data: result,
  });
});

// @desc    Forgot Password request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const parseResult = forgotPasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    throw new AppError(firstIssue?.message || 'Validation error', 400);
  }

  const result = await forgotPasswordService(parseResult.data);
  sendResponse(res, {
    statusCode: 200,
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
