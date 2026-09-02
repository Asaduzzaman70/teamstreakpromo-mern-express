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

// @desc    Create a new employee (for HOST / BUSINESS)
// @route   POST /api/employees
// @access  Private (HOST, BUSINESS)
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

// @desc    Get all employees for the logged-in HOST / BUSINESS employer
// @route   GET /api/employees
// @access  Private (HOST, BUSINESS)
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

// @desc    Get an employee by ID (for logged-in HOST / BUSINESS employer)
// @route   GET /api/employees/:id
// @access  Private (HOST, BUSINESS)
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

// @desc    Update an employee by ID (for logged-in HOST / BUSINESS employer)
// @route   PATCH /api/employees/:id
// @access  Private (HOST, BUSINESS)
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

// @desc    Delete an employee by ID (for logged-in HOST / BUSINESS employer)
// @route   DELETE /api/employees/:id
// @access  Private (HOST, BUSINESS)
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
