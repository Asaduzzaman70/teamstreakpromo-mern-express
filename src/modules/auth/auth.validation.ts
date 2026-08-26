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
          message:
            'Business profile details (businessName, businessDescription, location) are required for HOST and BUSINESS roles',
          path: ['businessProfile'],
        });
      }

      const ein = (data.einNumber || data.businessProfile?.einNumber || '').trim();
      const hasEin = ein.length > 0;
      const licenseFront = (data.businessProfile?.businessLicenseFrontImage || '').trim();
      const licenseBack = (data.businessProfile?.businessLicenseBackImage || '').trim();
      const hasLicenseImages = licenseFront.length > 0 && licenseBack.length > 0;

      // Note: when files are uploaded via multipart form-data, images will be validated in service layer
      // If no ein is provided and businessProfile object is explicitly passed without images, validate it
      if (hasNested && !hasEin && !hasLicenseImages) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Either einNumber or both businessLicenseFrontImage and businessLicenseBackImage must be provided',
          path: ['einNumber'],
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

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  phoneNumber: z.string().trim().optional(),
  businessName: z.string().trim().min(1, 'Business name cannot be empty').optional(),
  businessDescription: z.string().trim().min(1, 'Business description cannot be empty').optional(),
  location: z.string().trim().min(1, 'Location cannot be empty').optional(),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string({ message: 'New password is required' })
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
  })
  .refine((data) => !!(data.oldPassword || data.currentPassword), {
    message: 'Old password is required',
    path: ['oldPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });





