import { z } from 'zod';

export const employeeLoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const employeeRefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const employeeChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password cannot be empty').optional(),
    currentPassword: z.string().min(1, 'Current password cannot be empty').optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').optional(),
  })
  .refine((data) => Boolean(data.oldPassword || data.currentPassword), {
    message: 'Current password is required',
    path: ['oldPassword'],
  })
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    {
      message: 'New password and Confirm password do not match',
      path: ['confirmPassword'],
    }
  );

