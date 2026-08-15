import { z } from 'zod';

export const businessProfileSchema = z.object({
  businessName: z
    .string({ message: 'Business name is required' })
    .trim()
    .min(1, 'Business name is required'),
  businessDescription: z
    .string({ message: 'Business description is required' })
    .trim()
    .min(1, 'Business description is required'),
  einNumber: z.string().trim().optional(),
  location: z
    .string({ message: 'Location is required' })
    .trim()
    .min(1, 'Location is required'),
  govtIdFrontImage: z.string().trim().optional(),
  govtIdBackImage: z.string().trim().optional(),
  businessLicenseFrontImage: z.string().trim().optional(),
  businessLicenseBackImage: z.string().trim().optional(),
});
