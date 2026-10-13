import { z } from 'zod';

export const createSupportTicketSchema = {
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
    description: z
      .string()
      .min(1, 'Problem details are required')
      .max(5000, 'Description cannot exceed 5000 characters')
      .trim(),
    priority: z
      .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .optional()
      .default('MEDIUM'),
  }),
};

export const sendSupportMessageSchema = {
  body: z.object({
    message: z
      .string()
      .min(1, 'Message cannot be empty')
      .max(3000, 'Message cannot exceed 3000 characters')
      .trim(),
  }),
};

export const updateSupportTicketStatusSchema = {
  body: z.object({
    status: z.enum([
      'UNDER_REVIEW',
      'SOLVED',
      'CLOSED',
      'Under review',
      'Solved',
      'Closed',
    ]),
  }),
};

export const getSupportTicketsQuerySchema = {
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      userRole: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
};
