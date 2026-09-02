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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ICreateEmployeeInput {
  name: string;
  email: string;
  password: string;
}

export interface IUpdateEmployeeInput {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

export interface IEmployeeQueryFilter {
  page?: number | string;
  limit?: number | string;
  search?: string;
  isActive?: boolean | string;
}
