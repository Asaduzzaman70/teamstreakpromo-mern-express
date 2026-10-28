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
  isScanned?: boolean;
  scannedAt?: Date | undefined;
  scannedBy?: Types.ObjectId | undefined;
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

export interface ScanEventTicketInput {
  ticketId?: string | undefined;
  orderId?: string | undefined;
  code?: string | undefined;
  qrData?: string | Record<string, any> | undefined;
}

export interface IScanEventTicketResponse {
  isValid: boolean;
  statusText: string;
  ticketId: string;
  orderId: string;
  qrCode: string;
  event: string;
  eventLocation: string;
  dateTime: string;
  eventOrganizer: string;
  isScanned: boolean;
  scannedAt: Date;
  totalTicketQuantity: number;
  totalAmount: number;
  tickets: IEventOrderTicket[];
  attendee: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
  } | null;
  order: IEventOrder;
}

export interface IScannedTicketDashboardItem {
  _id: Types.ObjectId;
  orderId: string;
  ticketId: string;
  eventName: string;
  dateTime: string;
  scannedAt: Date | undefined;
  eventStartDate: Date | undefined;
  eventLocation: string;
  totalTicketQuantity: number;
  totalAmount: number;
  tickets: IEventOrderTicket[];
  attendee: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
  } | null;
}

export interface IScannedTicketsQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  eventId?: string;
}
