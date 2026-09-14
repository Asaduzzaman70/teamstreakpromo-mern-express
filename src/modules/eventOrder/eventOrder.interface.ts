import type { Document, Types } from 'mongoose';

export type EventOrderStatus = 'PAID' | 'CANCELLED' | 'COMPLETED';

export interface IEventOrderTicket {
  priceCategoryId?: Types.ObjectId;
  categoryName?: string;
  unitPrice: number;
  quantity: number;
}

export interface IEventOrder extends Document {
  user: Types.ObjectId;
  hostId: Types.ObjectId;
  eventId: Types.ObjectId;
  tickets: IEventOrderTicket[];
  totalTicketQuantity: number;
  totalAmount: number;
  stripeSessionId?: string;
  status: EventOrderStatus;
  pointsEarned: number;
  createdAt: Date;
  updatedAt: Date;
}
