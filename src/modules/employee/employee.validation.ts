import { z } from 'zod';

export const createEmployeeSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    userName: z.string().trim().min(1, 'User Name cannot be empty').optional(),
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').optional(),
  })
  .refine((data) => Boolean(data.name || data.userName), {
    message: 'Name or User Name is required',
    path: ['name'],
  })
  .refine(
    (data) => !data.confirmPassword || data.password === data.confirmPassword,
    {
      message: 'Password and Confirm Password do not match',
      path: ['confirmPassword'],
    }
  );

export const updateEmployeeSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    userName: z.string().trim().min(1, 'User Name cannot be empty').optional(),
    email: z.string().trim().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.confirmPassword || !data.password || data.password === data.confirmPassword,
    {
      message: 'Password and Confirm Password do not match',
      path: ['confirmPassword'],
    }
  );
