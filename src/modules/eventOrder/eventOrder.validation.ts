import { z } from 'zod';

export const scanEventTicketZodSchema = z
  .object({
    ticketId: z.string().trim().optional(),
    orderId: z.string().trim().optional(),
    code: z.string().trim().optional(),
    qrData: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  })
  .passthrough();

export const EventOrderValidation = {
  scanEventTicketZodSchema,
};
