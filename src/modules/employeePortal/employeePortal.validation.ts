import { z } from 'zod';

export const employeeScanTicketSchema = z
  .object({
    ticketId: z.string().trim().min(1, 'Ticket ID cannot be empty').optional(),
    orderId: z.string().trim().min(1, 'Order ID cannot be empty').optional(),
    code: z.string().trim().min(1, 'Ticket code cannot be empty').optional(),
    qrData: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  })
  .passthrough();

