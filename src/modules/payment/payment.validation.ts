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

const ticketItemSchema = z.object({
  priceCategoryId: z.string().trim().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

const rewardItemSchema = z.object({
  rewardId: z.string({ message: 'rewardId is required' }).trim().min(1),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export const createCheckoutSessionSchema = z.object({
  eventId: z.string({ message: 'eventId is required' }).trim().min(1, 'eventId cannot be empty'),
  tickets: z.array(ticketItemSchema).optional().default([]),
  rewards: z.array(rewardItemSchema).optional().default([]),
  successUrl: z.string().url('successUrl must be a valid URL').optional(),
  cancelUrl: z.string().url('cancelUrl must be a valid URL').optional(),
});



