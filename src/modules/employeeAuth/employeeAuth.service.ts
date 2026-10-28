import jwt from 'jsonwebtoken';
import config from '../../config/config.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { Employee } from './employeeAuth.model.js';
import { User } from '../auth/auth.model.js';
import { BusinessProfile } from '../businessProfile/businessProfile.model.js';
import type {
  IEmployeeLoginInput,
  IEmployeeRefreshTokenInput,
  IEmployeeChangePasswordInput,
  IEmployeeAuthResponse,
  IEmployeeRefreshTokenResponse,
  IEmployeeProfileResponse,
  IEmployeeEmployerSummary,
} from './employeeAuth.interface.js';

const generateEmployeeAccessToken = (
  id: string,
  employerId: string,
  employerType: string
): string => {
  return jwt.sign(
    { id, role: 'EMPLOYEE', employerId, employerType },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn as any,
    }
  );
};

const generateEmployeeRefreshToken = (
  id: string,
  employerId: string,
  employerType: string
): string => {
  return jwt.sign(
    { id, role: 'EMPLOYEE', employerId, employerType },
    config.jwtRefreshSecret,
    {
      expiresIn: config.jwtRefreshExpiresIn as any,
    }
  );
};

const buildEmployerSummary = async (
  employerId: any
): Promise<IEmployeeEmployerSummary | null> => {
  const employer = await User.findById(employerId)
    .select('_id name email role profileImage isActive isSuspend isDeleted')
    .lean();

  if (!employer) {
    return null;
  }

  const businessProfile = await BusinessProfile.findOne({ userId: employer._id })
    .select('businessName location')
    .lean();

  const summary: IEmployeeEmployerSummary = {
    _id: employer._id,
    name: employer.name,
    email: employer.email,
    role: employer.role,
  };

  if (employer.profileImage) {
    summary.profileImage = employer.profileImage;
  }
  if (businessProfile?.businessName) {
    summary.businessName = businessProfile.businessName;
  }
  if (businessProfile?.location) {
    summary.location = businessProfile.location;
  }

  return summary;
};

export const loginEmployeeService = async (
  payload: IEmployeeLoginInput
): Promise<IEmployeeAuthResponse> => {
  const email = payload.email.toLowerCase().trim();
  const { password } = payload;

  const employee = await Employee.findOne({ email });
  if (!employee) {
    throw new AppError('Invalid email or password', 400);
  }

  if (!employee.isActive) {
    throw new AppError(
      'Your employee account is currently inactive. Please contact your employer.',
      403
    );
  }

  // Verify parent employer account is active and not suspended/deleted
  const employer = await User.findById(employee.employerId)
    .select('_id isActive isSuspend isDeleted')
    .lean();

  if (!employer || employer.isDeleted) {
    throw new AppError('Employer organization account is no longer active.', 403);
  }

  if (employer.isSuspend) {
    throw new AppError('Employer organization account is currently suspended.', 403);
  }

  const isPasswordValid = await employee.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 400);
  }

  const accessToken = generateEmployeeAccessToken(
    employee._id.toString(),
    employee.employerId.toString(),
    employee.employerType
  );
  const refreshToken = generateEmployeeRefreshToken(
    employee._id.toString(),
    employee.employerId.toString(),
    employee.employerType
  );

  employee.refreshToken = refreshToken;
  await employee.save();

  const employerSummary = await buildEmployerSummary(employee.employerId);

  logger.info(
    `[EmployeeAuth] Employee ${employee._id} (${employee.email}) logged in under ${employee.employerType} employer ${employee.employerId}`
  );

  return {
    _id: employee._id,
    name: employee.name,
    email: employee.email,
    role: 'EMPLOYEE',
    employerId: employee.employerId,
    employerType: employee.employerType,
    isActive: employee.isActive,
    employer: employerSummary,
    accessToken,
    refreshToken,
  };
};

export const refreshEmployeeTokenService = async (
  payload: IEmployeeRefreshTokenInput
): Promise<IEmployeeRefreshTokenResponse> => {
  const { refreshToken } = payload;

  let decoded: {
    id: string;
    role: string;
    employerId?: string;
    employerType?: string;
  };

  try {
    decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (decoded.role !== 'EMPLOYEE') {
    throw new AppError('Invalid employee refresh token', 401);
  }

  const employee = await Employee.findById(decoded.id);
  if (!employee || employee.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (!employee.isActive) {
    throw new AppError('Employee account is inactive', 403);
  }

  const newAccessToken = generateEmployeeAccessToken(
    employee._id.toString(),
    employee.employerId.toString(),
    employee.employerType
  );
  const newRefreshToken = generateEmployeeRefreshToken(
    employee._id.toString(),
    employee.employerId.toString(),
    employee.employerType
  );

  employee.refreshToken = newRefreshToken;
  await employee.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const getEmployeeMeService = async (
  employeeId: string
): Promise<IEmployeeProfileResponse> => {
  const employee = await Employee.findById(employeeId).select('-password -refreshToken');
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const employerSummary = await buildEmployerSummary(employee.employerId);

  return {
    _id: employee._id,
    name: employee.name,
    email: employee.email,
    role: 'EMPLOYEE',
    employerId: employee.employerId,
    employerType: employee.employerType,
    isActive: employee.isActive,
    employer: employerSummary,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};

export const changeEmployeePasswordService = async (
  employeeId: string,
  payload: IEmployeeChangePasswordInput
): Promise<{ message: string }> => {
  const existingPassword = payload.oldPassword || payload.currentPassword;
  if (!existingPassword) {
    throw new AppError('Current password is required', 400);
  }

  if (payload.confirmPassword && payload.newPassword !== payload.confirmPassword) {
    throw new AppError('New password and Confirm password do not match', 400);
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const isMatch = await employee.comparePassword(existingPassword);
  if (!isMatch) {
    throw new AppError('Incorrect current password', 400);
  }

  employee.password = payload.newPassword;
  await employee.save();

  return {
    message: 'Employee password changed successfully',
  };
};

export const logoutEmployeeService = async (
  employeeId: string
): Promise<{ message: string }> => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  employee.refreshToken = '';
  await employee.save();

  return {
    message: 'Employee logged out successfully',
  };
};

