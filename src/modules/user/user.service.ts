import { User, type IUser } from './user.model.js';
import type {
  IUserQuery,
  IUserStatsSummary,
  IGetAllUsersResult,
  IUpdateUserStatusInput,
  UserRole,
} from './user.interface.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';

/**
 * Get aggregate user statistics for admin reporting
 */
export const getUserStatsService = async (): Promise<IUserStatsSummary> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalRegularUsers,
    totalHosts,
    totalBusinesses,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    newUsersThisMonth,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'USER', isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'HOST', isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'BUSINESS', isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'ADMIN', isDeleted: { $ne: true } }),
    User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
    User.countDocuments({ isActive: false, isDeleted: { $ne: true } }),
    User.countDocuments({ isSuspend: true, isDeleted: { $ne: true } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth }, isDeleted: { $ne: true } }),
  ]);

  return {
    totalUsers,
    totalRegularUsers,
    totalHosts,
    totalBusinesses,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    newUsersThisMonth,
  };
};

/**
 * Get all users with search, role filters, status filters, sorting, and pagination
 */
export const getAllUsersService = async (
  query: IUserQuery
): Promise<IGetAllUsersResult> => {
  const filter: Record<string, any> = {};

  // Exclude soft-deleted users unless explicitly requested
  if ((query as any).isDeleted !== undefined) {
    filter.isDeleted = (query as any).isDeleted === 'true' || (query as any).isDeleted === true;
  } else {
    filter.isDeleted = { $ne: true };
  }

  // Search by name, email, or phoneNumber
  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex },
    ];
  }

  // Filter by role
  if (query.role && query.role !== 'all') {
    filter.role = query.role;
  }

  // Filter by active status
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  // Filter by suspension status
  if (query.isSuspend !== undefined) {
    filter.isSuspend = query.isSuspend === 'true' || query.isSuspend === true;
  }

  // Filter by registration date range
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  // Pagination calculation
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortOption: Record<string, 1 | -1> = {
    [sortBy]: sortOrder,
  };

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('-password -refreshToken')
      .populate('businessProfile')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result: users as unknown as IUser[],
  };
};

/**
 * Get single user by ID with populated business profile
 */
export const getUserByIdService = async (id: string): Promise<IUser> => {
  const user = await User.findById(id)
    .select('-password -refreshToken')
    .populate('businessProfile');

  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404);
  }

  return user;
};

/**
 * Update user activation / suspension status
 */
export const updateUserStatusService = async (
  id: string,
  payload: IUpdateUserStatusInput
): Promise<IUser> => {
  const user = await User.findById(id);

  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404);
  }

  if (payload.isActive !== undefined) {
    user.isActive = payload.isActive;
  }

  if (payload.isSuspend !== undefined) {
    user.isSuspend = payload.isSuspend;
  }

  await user.save();

  logger.info(`Admin updated status for user ${id}`, {
    userId: id,
    isActive: user.isActive,
    isSuspend: user.isSuspend,
  });

  const updatedUser = await User.findById(id)
    .select('-password -refreshToken')
    .populate('businessProfile');

  return updatedUser!;
};

/**
 * Update user role
 */
export const updateUserRoleService = async (
  id: string,
  role: UserRole
): Promise<IUser> => {
  const user = await User.findById(id);

  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404);
  }

  user.role = role;
  await user.save();

  logger.info(`Admin updated role for user ${id} to ${role}`, {
    userId: id,
    role,
  });

  const updatedUser = await User.findById(id)
    .select('-password -refreshToken')
    .populate('businessProfile');

  return updatedUser!;
};

/**
 * Delete user account
 */
export const deleteUserService = async (
  id: string,
  currentAdminId: string
): Promise<{ id: string }> => {
  if (id === currentAdminId) {
    throw new AppError('You cannot delete your own admin account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await User.findByIdAndDelete(id);

  logger.info(`Admin ${currentAdminId} deleted user ${id}`);

  return { id };
};
