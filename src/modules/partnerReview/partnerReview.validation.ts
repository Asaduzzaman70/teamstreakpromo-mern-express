import { z } from 'zod';

export const createPartnerReviewSchema = {
  body: z.object({
    productId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    orderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format')
      .optional(),
    rating: z
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1 star')
      .max(5, 'Rating cannot exceed 5 stars'),
    experience: z.enum(['POSITIVE', 'NEGATIVE']),
    tags: z
      .array(z.string().trim().min(1, 'Tag cannot be empty'))
      .max(10, 'Cannot select more than 10 tags')
      .optional()
      .default([]),
    feedback: z
      .string()
      .trim()
      .max(300, 'Feedback cannot exceed 300 characters')
      .optional()
      .default(''),
  }),
};

export const checkPartnerEligibilityParamsSchema = {
  params: z.object({
    productId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  }),
};

export const getProductReviewsQuerySchema = {
  params: z.object({
    productId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  }),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      experience: z.enum(['POSITIVE', 'NEGATIVE']).optional(),
      rating: z.string().optional(),
    })
    .optional(),
};

export const getPartnerReviewsQuerySchema = {
  params: z.object({
    partnerId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid partner ID format'),
  }),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      experience: z.enum(['POSITIVE', 'NEGATIVE']).optional(),
      rating: z.string().optional(),
    })
    .optional(),
};

export const getPartnerReviewByIdParamsSchema = {
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format'),
  }),
};
