import { z } from 'zod';

const timeRangeEnum = z.enum([
  'week',
  'month',
  'year',
  'last6months',
  'last30days',
  'last7days',
]);

export const getBusinessPartnerAnalyticsQuerySchema = {
  query: z.object({
    range: timeRangeEnum.optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    itemId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid reward item ID format')
      .optional(),
  }),
};

export const getBusinessPartnerOverviewQuerySchema = {
  query: z.object({
    itemId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid reward item ID format')
      .optional(),
  }),
};

export const getRewardSellChartQuerySchema = {
  query: z.object({
    range: timeRangeEnum.optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    itemId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid reward item ID format')
      .optional(),
  }),
};
