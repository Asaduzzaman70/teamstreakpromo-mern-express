import { Employee } from './employee.model.js';
import { User } from '../auth/auth.model.js';
import { AppError } from '../../utils/AppError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import type {
  ICreateEmployeeInput,
  IUpdateEmployeeInput,
  IEmployeeQueryFilter,
  EmployerType,
} from './employee.interface.js';

export const createEmployeeService = async (
  employerId: string,
  employerType: EmployerType,
  payload: ICreateEmployeeInput
) => {
  const existingEmployee = await Employee.findOne({ email: payload.email.toLowerCase() });
  if (existingEmployee) {
    throw new AppError('An employee with this email already exists', 400);
  }

  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 400);
  }

  const employee = await Employee.create({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    employerId,
    employerType,
    isActive: true,
  });

  const result = employee.toObject();
  delete result.password;
  return result;
};

export const getEmployerEmployeesService = async (
  employerId: string,
  query: IEmployeeQueryFilter
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = { employerId };

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  if (query.isActive !== undefined) {
    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    } else if (typeof query.isActive === 'string') {
      filter.isActive = query.isActive === 'true';
    }
  }

  const [result, total] = await Promise.all([
    Employee.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result,
  };
};

export const getEmployeeByIdService = async (
  employeeId: string,
  employerId: string
) => {
  const employee = await Employee.findOne({ _id: employeeId, employerId }).select('-password');
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }
  return employee;
};

export const updateEmployeeService = async (
  employeeId: string,
  employerId: string,
  payload: IUpdateEmployeeInput
) => {
  const employee = await Employee.findOne({ _id: employeeId, employerId });
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  if (payload.email && payload.email.toLowerCase() !== employee.email) {
    const existingEmployee = await Employee.findOne({
      email: payload.email.toLowerCase(),
      _id: { $ne: employeeId },
    });
    if (existingEmployee) {
      throw new AppError('An employee with this email already exists', 400);
    }

    const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    employee.email = payload.email.toLowerCase();
  }

  if (payload.name !== undefined) {
    employee.name = payload.name;
  }

  if (payload.password !== undefined) {
    employee.password = payload.password;
  }

  if (payload.isActive !== undefined) {
    employee.isActive = payload.isActive;
  }

  await employee.save();

  const result = employee.toObject();
  delete result.password;
  return result;
};

export const deleteEmployeeService = async (
  employeeId: string,
  employerId: string
) => {
  const employee = await Employee.findOne({ _id: employeeId, employerId });
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  await Employee.deleteOne({ _id: employeeId, employerId });
};
