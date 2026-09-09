import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createRewardSubCategorySchema = z.object({
  name: z
    .string({ message: 'Reward Subcategory name is required' })
    .trim()
    .min(1, 'Reward Subcategory name cannot be empty'),
  description: z.string().trim().optional(),
  rewardCategory: z
    .string({ message: 'Reward Category ID is required' })
    .refine((val) => objectIdRegex.test(val), {
      message: 'Invalid Reward Category ObjectId format',
    }),
  isActive: z.boolean().optional(),
});

export const updateRewardSubCategorySchema = z.object({
  name: z.string().trim().min(1, 'Reward Subcategory name cannot be empty').optional(),
  description: z.string().trim().optional(),
  rewardCategory: z
    .string()
    .refine((val) => objectIdRegex.test(val), {
      message: 'Invalid Reward Category ObjectId format',
    })
    .optional(),
  isActive: z.boolean().optional(),
});
