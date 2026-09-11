import { z } from 'zod';

export const createConnectAccountSchema = z.object({
  refreshUrl: z
    .string({ message: 'Refresh URL must be a valid URL string' })
    .url('Refresh URL must be a valid URL')
    .optional(),
  returnUrl: z
    .string({ message: 'Return URL must be a valid URL string' })
    .url('Return URL must be a valid URL')
    .optional(),
  country: z
    .string({ message: 'Country must be a 2-letter ISO code' })
    .trim()
    .length(2, 'Country must be a 2-letter ISO code (e.g., US)')
    .toUpperCase()
    .optional(),
  businessType: z
    .enum(['individual', 'company'], {
      message: 'Business type must be either individual or company',
    })
    .optional(),
});

export const createLoginLinkSchema = z.object({}).optional();
