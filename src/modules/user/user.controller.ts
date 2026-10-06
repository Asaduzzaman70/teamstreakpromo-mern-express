import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  getUserStatsService,
  getAllUsersService,
  getUserByIdService,
  updateUserStatusService,
  updateUserRoleService,
  deleteUserService,
} from './user.service.js';

/**
 * @desc    Get aggregate user statistics for admin overview
 * @route   GET /api/users/stats
 * @access  Private (ADMIN)
 */
export const getUserStats = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await getUserStatsService();

    sendResponse(res, {
      statusCode: 200,
      message: 'User statistics retrieved successfully',
      data: result,
    });
  }
);

/**
 * @desc    Get all users with search, role filter, status filter, and pagination
 * @route   GET /api/users
 * @access  Private (ADMIN)
 */
export const getAllUsers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { meta, result } = await getAllUsersService(req.query);

    sendResponse(res, {
      statusCode: 200,
      message: 'Users retrieved successfully',
      meta,
      data: result,
    });
  }
);

/**
 * @desc    Get single user details by ID
 * @route   GET /api/users/:id
 * @access  Private (ADMIN)
 */
export const getUserById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await getUserByIdService(id as string);

    sendResponse(res, {
      statusCode: 200,
      message: 'User details retrieved successfully',
      data: result,
    });
  }
);

/**
 * @desc    Update user status (isActive / isSuspend)
 * @route   PATCH /api/users/:id/status
 * @access  Private (ADMIN)
 */
export const updateUserStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await updateUserStatusService(id as string, req.body);

    sendResponse(res, {
      statusCode: 200,
      message: 'User status updated successfully',
      data: result,
    });
  }
);

/**
 * @desc    Update user role (USER, HOST, BUSINESS, ADMIN)
 * @route   PATCH /api/users/:id/role
 * @access  Private (ADMIN)
 */
export const updateUserRole = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body;
    const result = await updateUserRoleService(id as string, role);

    sendResponse(res, {
      statusCode: 200,
      message: 'User role updated successfully',
      data: result,
    });
  }
);

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/:id
 * @access  Private (ADMIN)
 */
export const deleteUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentAdminId = req.user!.id;
    const result = await deleteUserService(id as string, currentAdminId);

    sendResponse(res, {
      statusCode: 200,
      message: 'User deleted successfully',
      data: result,
    });
  }
);
