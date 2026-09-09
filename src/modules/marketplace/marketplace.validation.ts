import { z } from 'zod';

export const createMarketplaceSchema = z.object({
    title: z.string({
      message: 'Reward Title is required',
    }).min(1, 'Reward Title cannot be empty'),
    description: z.string({
      message: 'Reward Description is required',
    }),
    categoryId: z.string({
      message: 'Category ID is required',
    }).trim().min(1, 'Category ID cannot be empty'),
    subCategoryId: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().optional()
    ),
    location: z.string({
      message: 'Location is required',
    }),
    latitude: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number({ message: 'Latitude must be a number' })
    ),
    longitude: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number({ message: 'Longitude must be a number' })
    ),
    startDateTime: z.string({
      message: 'Start Date & Time is required',
    }),
    endDateTime: z.string({
      message: 'End Date & Time is required',
    }),
    points: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number({
        message: 'Reward Points are required and must be a number',
      }).min(0, 'Points cannot be negative')
    ),
    quantity: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number({
        message: 'Reward Quantity is required and must be a number',
      }).min(0, 'Quantity cannot be negative')
    ),
    photos: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [val];
          }
        }
        return val;
      },
      z.array(z.string()).optional()
    ).transform((val) => val ?? []),
    isActive: z.preprocess(
      (val) => (val === 'true' ? true : val === 'false' ? false : val),
      z.boolean().optional().default(true)
    ),
});

export const updateMarketplaceSchema = z.object({
    title: z.string().trim().min(1, 'Title cannot be empty').optional(),
    description: z.string().trim().min(1, 'Description cannot be empty').optional(),
    categoryId: z.string().optional(),
    subCategoryId: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().optional()
    ),
    location: z.string().optional(),
    latitude: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number({ message: 'Latitude must be a number' })
    ).optional(),
    longitude: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number({ message: 'Longitude must be a number' })
    ).optional(),
    startDateTime: z.string().optional(),
    endDateTime: z.string().optional(),
    points: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().min(0, 'Points cannot be negative')
    ).optional(),
    quantity: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().min(0, 'Quantity cannot be negative')
    ).optional(),
    photos: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [val];
          }
        }
        return val;
      },
      z.array(z.string()).optional()
    ).optional(),
    isActive: z.preprocess(
      (val) => (val === 'true' ? true : val === 'false' ? false : val),
      z.boolean().optional()
    ),
});
