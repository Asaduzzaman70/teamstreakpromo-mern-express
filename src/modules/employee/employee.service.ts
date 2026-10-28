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
  const employeeName = (payload.name || payload.userName || '').trim();
  if (!employeeName) {
    throw new AppError('Employee name is required', 400);
  }

  if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
    throw new AppError('Password and Confirm Password do not match', 400);
  }

  const normalizedEmail = payload.email.toLowerCase().trim();

  const existingEmployee = await Employee.findOne({ email: normalizedEmail });
  if (existingEmployee) {
    throw new AppError('An employee with this email already exists', 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 400);
  }

  const employee = await Employee.create({
    name: employeeName,
    email: normalizedEmail,
    password: payload.password,
    employerId,
    employerType,
    isActive: true,
  });

  const result = employee.toObject();
  delete result.password;
  delete result.refreshToken;
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
    Employee.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
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
  const employee = await Employee.findOne({ _id: employeeId, employerId }).select(
    '-password -refreshToken'
  );
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

  if (payload.email && payload.email.toLowerCase().trim() !== employee.email) {
    const normalizedEmail = payload.email.toLowerCase().trim();
    const existingEmployee = await Employee.findOne({
      email: normalizedEmail,
      _id: { $ne: employeeId },
    });
    if (existingEmployee) {
      throw new AppError('An employee with this email already exists', 400);
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    employee.email = normalizedEmail;
  }

  const updatedName = payload.name ?? payload.userName;
  if (updatedName !== undefined) {
    employee.name = updatedName.trim();
  }

  if (payload.password !== undefined) {
    if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
      throw new AppError('Password and Confirm Password do not match', 400);
    }
    employee.password = payload.password;
  }

  if (payload.isActive !== undefined) {
    employee.isActive = payload.isActive;
  }

  await employee.save();

  const result = employee.toObject();
  delete result.password;
  delete result.refreshToken;
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
