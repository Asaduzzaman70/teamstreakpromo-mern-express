import { z } from 'zod';
import { businessProfileSchema } from '../businessProfile/businessProfile.validation.js';

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
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' : val),
        z.boolean({ message: 'Age confirmation is required' })
      )
      .refine((val) => val === true, {
        message: 'You must be 18+ years old to register',
      }),
    agreesToTerms: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' : val),
        z.boolean({ message: 'Terms agreement is required' })
      )
      .refine((val) => val === true, {
        message: 'You must agree to the terms and conditions',
      }),
    businessProfile: businessProfileSchema.optional(),
    businessName: z.string().trim().optional(),
    businessDescription: z.string().trim().optional(),
    location: z.string().trim().optional(),
    einNumber: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    if (data.role === 'HOST' || data.role === 'BUSINESS') {
      const hasNested = !!data.businessProfile;
      const hasFlat = !!(data.businessName && data.businessDescription && data.location);

      if (!hasNested && !hasFlat) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business profile details (businessName, businessDescription, location) are required for HOST and BUSINESS roles',
          path: ['businessProfile'],
        });
      }
    }
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

export const verifyOtpSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  otp: z
    .string({ message: 'OTP is required' })
    .trim()
    .length(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string({ message: 'Reset token is required' }).trim().min(1, 'Reset token is required'),
    newPassword: z
      .string({ message: 'New password is required' })
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ message: 'Refresh token is required' })
    .trim()
    .min(1, 'Refresh token is required'),
});

