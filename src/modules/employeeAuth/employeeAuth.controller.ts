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

