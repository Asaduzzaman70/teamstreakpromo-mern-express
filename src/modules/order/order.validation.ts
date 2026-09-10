import { z } from 'zod';

const createOrderZodSchema = z.object({
  itemType: z.enum(['MARKETPLACE', 'EVENT'], {
    message: 'Item type is required and must be MARKETPLACE or EVENT',
  }),
  itemId: z.string({ message: 'Item ID is required' }).trim().min(1, 'Item ID is required'),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .optional()
    .default(1),
});

export const OrderValidation = {
  createOrderZodSchema,
};
