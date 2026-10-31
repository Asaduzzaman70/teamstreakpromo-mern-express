import { z } from 'zod';

export const getEventReferralParamsSchema = {
  params: z.object({
    eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
  }),
};

export const getHostPointsParamsSchema = {
  params: z.object({
    hostId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid host ID format'),
  }),
};
