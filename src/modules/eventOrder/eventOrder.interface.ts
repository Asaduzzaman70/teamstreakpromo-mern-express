import type { Document, Types } from 'mongoose';

export type EventOrderStatus = 'PAID' | 'CANCELLED' | 'COMPLETED';

export interface IEventOrderTicket {
  priceCategoryId?: Types.ObjectId;
  categoryName?: string;
  unitPrice: number;
  quantity: number;
}

export type EventOrderPayoutStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

export interface IEventOrder extends Document {
  user: Types.ObjectId;
  hostId: Types.ObjectId;
  eventId: Types.ObjectId;
  tickets: IEventOrderTicket[];
  totalTicketQuantity: number;
  totalAmount: number;
  stripeSessionId?: string;
  ticketId?: string;
  qrCode?: string;
  status: EventOrderStatus;
  payoutStatus?: EventOrderPayoutStatus;
  hostPayoutAmount?: number;
  platformFeeAmount?: number;
  stripeTransferId?: string | undefined;
  stripeRefundId?: string | undefined;
  cancelledAt?: Date | undefined;
  pointsEarned: number;
  createdAt: Date;
  updatedAt: Date;
}
