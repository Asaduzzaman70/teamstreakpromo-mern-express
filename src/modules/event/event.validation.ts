import { z } from 'zod';

const artistInfoSchema = z.object({
  name: z.string({ message: 'Artist name is required' }).trim().min(1, 'Artist name is required'),
  role: z.string().trim().optional(),
  image: z.string().trim().optional(),
  socialMediaLinks: z
    .preprocess(
      (val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      },
      z.record(z.string(), z.string())
    )
    .optional()
    .transform((val) => val ?? {}),
});

const rewardSchema = z.object({
  title: z.string({ message: 'Reward title is required' }).trim().min(1, 'Reward title is required'),
  description: z.string().trim().optional(),
  pointsRequired: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ message: 'Points required must be a number' }).min(0, 'Points required cannot be negative')
  ),
  stock: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ message: 'Stock must be a number' }).min(0, 'Stock cannot be negative')
  ),
  image: z.string().trim().optional(),
});

export const createEventSchema = z
  .object({
    categoryId: z.string({ message: 'Category ID is required' }).trim().min(1, 'Category ID is required'),
    title: z.string({ message: 'Title is required' }).trim().min(1, 'Title is required'),
    latitude: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number({ message: 'Latitude must be a number' })
    ),
    longitude: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number({ message: 'Longitude must be a number' })
    ),
    ageRestriction: z
      .preprocess(
        (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
        z.number().min(0, 'Age restriction cannot be negative').optional()
      )
      .transform((val) => val ?? 0),
    placeName: z.string({ message: 'Place name is required' }).trim().min(1, 'Place name is required'),
    description: z.string({ message: 'Description is required' }).trim().min(1, 'Description is required'),
    startDate: z.preprocess(
      (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
      z.date({ message: 'Valid start date is required' })
    ),
    endDate: z.preprocess(
      (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
      z.date({ message: 'Valid end date is required' })
    ),
    ticketPrice: z
      .preprocess(
        (val) => (typeof val === 'string' ? parseFloat(val) : val),
        z.number({ message: 'Ticket price must be a number' }).min(0, 'Ticket price cannot be negative').optional()
      )
      .transform((val) => val ?? 0),
    images: z
      .preprocess(
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
      )
      .transform((val) => val ?? []),
    artistInfo: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            try {
              return JSON.parse(val);
            } catch {
              return val;
            }
          }
          return val;
        },
        z.array(artistInfoSchema).optional()
      )
      .transform((val) => val ?? []),
    rewards: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            try {
              return JSON.parse(val);
            } catch {
              return val;
            }
          }
          return val;
        },
        z.array(rewardSchema).optional()
      )
      .transform((val) => val ?? []),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      message: 'End date must be greater than or equal to start date',
      path: ['endDate'],
    }
  );
