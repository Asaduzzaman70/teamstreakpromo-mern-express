import { z } from 'zod';

const createOrderZodSchema = z
  .object({
    itemType: z.enum(['MARKETPLACE', 'EVENT'], {
      message: 'Item type is required and must be MARKETPLACE or EVENT',
    }),
    itemId: z.string({ message: 'Item ID is required' }).trim().optional(),
    eventId: z.string().trim().optional(),
    rewardItemId: z.string().trim().optional(),
    quantity: z
      .number()
      .int()
      .min(1, 'Quantity must be at least 1')
      .optional()
      .default(1),
  })
  .refine(
    (data) => {
      if (data.itemType === 'MARKETPLACE') {
        return !!data.itemId;
      }
      if (data.itemType === 'EVENT') {
        return (!!data.eventId && !!data.rewardItemId) || !!data.itemId;
      }
      return true;
    },
    {
      message: 'For MARKETPLACE provide itemId; for EVENT provide eventId and rewardItemId (or itemId)',
    }
  );

export const OrderValidation = {
  createOrderZodSchema,
};
