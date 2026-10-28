import type { Types } from 'mongoose';
import type { EmployerType } from '../employee/employee.interface.js';

export interface IEmployeeLoginInput {
  email: string;
  password: string;
}

export interface IEmployeeRefreshTokenInput {
  refreshToken: string;
}

export interface IEmployeeChangePasswordInput {
  oldPassword?: string;
  currentPassword?: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface IEmployeeEmployerSummary {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  businessName?: string;
  location?: string;
}

export interface IEmployeeAuthResponse {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'EMPLOYEE';
  employerId: Types.ObjectId;
  employerType: EmployerType;
  isActive: boolean;
  employer: IEmployeeEmployerSummary | null;
  accessToken: string;
  refreshToken: string;
}

export interface IEmployeeRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IEmployeeProfileResponse {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'EMPLOYEE';
  employerId: Types.ObjectId;
  employerType: EmployerType;
  isActive: boolean;
  employer: IEmployeeEmployerSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

