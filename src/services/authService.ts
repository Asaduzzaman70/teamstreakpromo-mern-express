import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import config from '../config/config.js';
import { AppError } from '../utils/AppError.js';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  AuthResponse,
  ForgotPasswordResponse,
  UserProfileResponse,
} from '../interfaces/authInterface.js';

const generateAccessToken = (id: string): string => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
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

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

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

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 400);
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

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
    throw new AppError('No account found with this email', 404);
  }

  return {
    message: 'Password reset link sent to your email address.',
    instructionToken: generateAccessToken(user.id),
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
