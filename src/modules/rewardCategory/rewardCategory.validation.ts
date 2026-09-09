import { z } from 'zod';

export const createRewardCategorySchema = z.object({
  name: z
    .string({ message: 'Reward Category name is required' })
    .trim()
    .min(1, 'Reward Category name cannot be empty'),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const updateRewardCategorySchema = z.object({
  name: z.string().trim().min(1, 'Reward Category name cannot be empty').optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});
