import type { IUser, UserRole } from '../auth/auth.model.js';
import type { IMeta } from '../../utils/sendResponse.js';

export type { IUser, UserRole };

export interface IUserQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  role?: UserRole | 'all';
  isActive?: string | boolean;
  isSuspend?: string | boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'name' | 'email' | 'totalPoints' | 'walletBalance' | 'rating' | 'sold';
  sortOrder?: 'asc' | 'desc';
}

export interface IUserStatsSummary {
  totalUsers: number;
  totalRegularUsers: number;
  totalHosts: number;
  totalBusinesses: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  newUsersThisMonth: number;
}

export interface IUpdateUserStatusInput {
  isActive?: boolean;
  isSuspend?: boolean;
}

export interface IUpdateUserRoleInput {
  role: UserRole;
}

export interface IGetAllUsersResult {
  meta: IMeta;
  result: IUser[];
}
