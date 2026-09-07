import { z } from 'zod';

export const createMarketplaceSchema = z.object({
    title: z.string({
      message: 'Reward Title is required',
    }).min(1, 'Reward Title cannot be empty'),
    description: z.string({
      message: 'Reward Description is required',
    }),
    categoryId: z.string({
      message: 'Reward Category ID is required',
    }),
    subCategoryId: z.string({
      message: 'Reward Subcategory ID is required',
    }).optional(),
    location: z.string({
      message: 'Location is required',
    }),
    startDateTime: z.string({
      message: 'Start Date & Time is required',
    }),
    endDateTime: z.string({
      message: 'End Date & Time is required',
    }),
    points: z.number({
      message: 'Reward Points are required and must be a number',
    }).min(0, 'Points cannot be negative'),
    quantity: z.number({
      message: 'Reward Quantity is required and must be a number',
    }).min(0, 'Quantity cannot be negative'),
    photos: z.array(z.string()).min(1, 'At least one photo is required'),
    isActive: z.boolean().optional().default(true),
});

export const updateMarketplaceSchema = z.object({
    title: z.string().min(1, 'Reward Title cannot be empty').optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    subCategoryId: z.string().optional(),
    location: z.string().optional(),
    startDateTime: z.string().optional(),
    endDateTime: z.string().optional(),
    points: z.number().min(0, 'Points cannot be negative').optional(),
    quantity: z.number().min(0, 'Quantity cannot be negative').optional(),
    photos: z.array(z.string()).min(1, 'At least one photo is required').optional(),
    isActive: z.boolean().optional(),
});
