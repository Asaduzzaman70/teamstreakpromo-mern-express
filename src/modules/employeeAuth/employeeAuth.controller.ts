import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  loginEmployeeService,
  refreshEmployeeTokenService,
  getEmployeeMeService,
  changeEmployeePasswordService,
  logoutEmployeeService,
} from './employeeAuth.service.js';

// @desc    Authenticate employee (HOST or BUSINESS staff) & get tokens
// @route   POST /api/employee-auth/login
// @access  Public
export const loginEmployee = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await loginEmployeeService(req.body);

    sendResponse(res, {
      statusCode: 200,
      message: 'Employee logged in successfully',
      data: result,
    });
  }
);

// @desc    Refresh employee access token using refresh token
// @route   POST /api/employee-auth/refresh-token
// @access  Public
export const refreshEmployeeToken = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await refreshEmployeeTokenService(req.body);

    sendResponse(res, {
      statusCode: 200,
      message: 'Employee token refreshed successfully',
      data: result,
    });
  }
);

// @desc    Get currently logged-in employee profile & employer details
// @route   GET /api/employee-auth/me
// @access  Private (EMPLOYEE)
export const getEmployeeMe = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const result = await getEmployeeMeService(employeeId);

    sendResponse(res, {
      statusCode: 200,
      message: 'Employee profile retrieved successfully',
      data: result,
    });
  }
);

// @desc    Change logged-in employee password
// @route   PATCH /api/employee-auth/change-password
// @access  Private (EMPLOYEE)
export const changeEmployeePassword = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const result = await changeEmployeePasswordService(employeeId, req.body);

    sendResponse(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  }
);

// @desc    Logout logged-in employee (invalidate refresh token)
// @route   POST /api/employee-auth/logout
// @access  Private (EMPLOYEE)
export const logoutEmployee = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const result = await logoutEmployeeService(employeeId);

    sendResponse(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  }
);

