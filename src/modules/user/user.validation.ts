import { z } from 'zod';

export const getUsersQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    role: z.enum(['USER', 'HOST', 'BUSINESS', 'ADMIN', 'all']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    isSuspend: z.enum(['true', 'false']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z
      .enum(['createdAt', 'name', 'email', 'totalPoints', 'walletBalance', 'rating', 'sold'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
};

export const userIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
};

export const updateUserStatusSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z
    .object({
      isActive: z.boolean().optional(),
      isSuspend: z.boolean().optional(),
    })
    .refine((data) => data.isActive !== undefined || data.isSuspend !== undefined, {
      message: 'At least one of isActive or isSuspend must be provided',
    }),
};

export const updateUserRoleSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z.object({
    role: z.enum(['USER', 'HOST', 'BUSINESS', 'ADMIN'], {
      message: "Role must be 'USER', 'HOST', 'BUSINESS', or 'ADMIN'",
    }),
  }),
};
