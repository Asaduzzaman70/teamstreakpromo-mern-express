import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCategorySchema = z.object({
  name: z
    .string({ message: 'Category name is required' })
    .trim()
    .min(1, 'Category name cannot be empty'),
  description: z.string().trim().optional(),
  parentCategory: z
    .string()
    .refine((val) => objectIdRegex.test(val), {
      message: 'Invalid parentCategory ObjectId format',
    })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name cannot be empty').optional(),
  description: z.string().trim().optional(),
  parentCategory: z
    .string()
    .refine((val) => objectIdRegex.test(val), {
      message: 'Invalid parentCategory ObjectId format',
    })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});
