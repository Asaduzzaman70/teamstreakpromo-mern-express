import { z } from 'zod';

export const createReviewSchema = {
  body: z.object({
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
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

export const checkEligibilityParamsSchema = {
  params: z.object({
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
  }),
};

export const getEventReviewsQuerySchema = {
  params: z.object({
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
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

export const getHostReviewsQuerySchema = {
  params: z.object({
    hostId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid host ID format'),
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

export const getReviewByIdParamsSchema = {
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format'),
  }),
};
