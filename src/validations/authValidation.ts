import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string({ message: 'Name is required' }).trim().min(1, 'Name is required'),
    email: z
      .string({ message: 'Email is required' })
      .trim()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
    role: z
      .enum(['USER', 'HOST', 'BUSINESS'], {
        message: 'Role must be USER, HOST, or BUSINESS',
      })
      .optional()
      .default('USER'),
    isAgeOver18: z
      .boolean({ message: 'Age confirmation is required' })
      .refine((val) => val === true, {
        message: 'You must be 18+ years old to register',
      }),
    agreesToTerms: z
      .boolean({ message: 'Terms agreement is required' })
      .refine((val) => val === true, {
        message: 'You must agree to the terms and conditions',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string({ message: 'Please enter email and password' })
    .trim()
    .min(1, 'Please enter email and password')
    .email('Invalid email address'),
  password: z
    .string({ message: 'Please enter email and password' })
    .min(1, 'Please enter email and password'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Please provide an email address' })
    .trim()
    .min(1, 'Please provide an email address')
    .email('Invalid email address'),
});
