import type { Document, Types } from 'mongoose';

export type EmployerType = 'HOST' | 'BUSINESS';

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  employerId: Types.ObjectId;
  employerType: EmployerType;
  isActive: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ICreateEmployeeInput {
  name?: string;
  userName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface IUpdateEmployeeInput {
  name?: string;
  userName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  isActive?: boolean;
}

export interface IEmployeeQueryFilter {
  page?: number | string;
  limit?: number | string;
  search?: string;
  isActive?: boolean | string;
}

