import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  createEmployeeService,
  getEmployerEmployeesService,
  getEmployeeByIdService,
  updateEmployeeService,
  deleteEmployeeService,
} from './employee.service.js';
import type { EmployerType } from './employee.interface.js';

export const createEmployee = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employerId = req.user!.id;
    const employerType = req.user!.role as EmployerType;

    const result = await createEmployeeService(employerId, employerType, req.body);

    sendResponse(res, {
      statusCode: 201,
      message: 'Employee created successfully',
      data: result,
    });
  }
);

export const getEmployerEmployees = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employerId = req.user!.id;

    const { meta, result } = await getEmployerEmployeesService(employerId, req.query);

    sendResponse(res, {
      statusCode: 200,
      message: 'Employees retrieved successfully',
      meta,
      data: result,
    });
  }
);

export const getEmployeeById = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employerId = req.user!.id;
    const id = req.params.id as string;

    const result = await getEmployeeByIdService(id, employerId);

    sendResponse(res, {
      statusCode: 200,
      message: 'Employee retrieved successfully',
      data: result,
    });
  }
);

export const updateEmployee = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employerId = req.user!.id;
    const id = req.params.id as string;

    const result = await updateEmployeeService(id, employerId, req.body);

    sendResponse(res, {
      statusCode: 200,
      message: 'Employee updated successfully',
      data: result,
    });
  }
);

export const deleteEmployee = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employerId = req.user!.id;
    const id = req.params.id as string;

    await deleteEmployeeService(id, employerId);

    sendResponse(res, {
      statusCode: 200,
      message: 'Employee deleted successfully',
      data: null,
    });
  }
);
