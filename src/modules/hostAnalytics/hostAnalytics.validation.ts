import { z } from 'zod';

const timeRangeEnum = z.enum([
  'week',
  'month',
  'year',
  'last6months',
  'last30days',
  'last7days',
]);

export const getHostAnalyticsQuerySchema = {
  query: z.object({
    range: timeRangeEnum.optional(),
    revenueRange: timeRangeEnum.optional(),
    ticketRange: timeRangeEnum.optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format')
      .optional(),
  }),
};

export const getHostChartQuerySchema = {
  query: z.object({
    range: timeRangeEnum.optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format')
      .optional(),
  }),
};

export const getHostOverviewQuerySchema = {
  query: z.object({
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format')
      .optional(),
  }),
};
