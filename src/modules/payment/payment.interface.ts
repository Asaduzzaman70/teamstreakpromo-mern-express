import type { z } from 'zod';
import type {
  createConnectAccountSchema,
  createLoginLinkSchema,
  createCheckoutSessionSchema,
} from './payment.validation.js';
import type { StripeAccountStatus } from '../businessProfile/businessProfile.interface.js';

export type CreateConnectAccountInput = z.infer<typeof createConnectAccountSchema>;
export type CreateLoginLinkInput = z.infer<typeof createLoginLinkSchema>;
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

export interface ICreateConnectAccountResponse {
  stripeAccountId: string;
  url: string;
}

export interface ICreateCheckoutSessionResponse {
  sessionId: string;
  url: string | null;
}

export interface IAccountStatusResponse {
  stripeAccountId: string;
  isStripeConnected: boolean;
  isStripeVerified: boolean;
  stripeAccountStatus: StripeAccountStatus;
  stripePayoutsEnabled: boolean;
  stripeChargesEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  requirements?: {
    currentlyDue?: string[];
    eventuallyDue?: string[];
    pastDue?: string[];
    pendingVerification?: string[];
    disabledReason?: string | null;
  };
}

export interface ICreateLoginLinkResponse {
  url: string;
}

export interface IWebhookResponse {
  received: boolean;
  eventType?: string;
}

export interface IEventPayoutResponse {
  eventId: string;
  payoutStatus: string;
  totalOrders: number;
  totalTicketsSold: number;
  totalRevenue: number;
  platformFeeAmount: number;
  hostPayoutAmount: number;
  stripeTransferId?: string | undefined;
  payoutError?: string | undefined;
  paidOutAt?: Date | undefined;
}

export interface IEventPayoutStatusResponse {
  eventId: string;
  eventTitle: string;
  endDate: Date;
  isEventEnded: boolean;
  payoutStatus: string;
  totalTicketsSold: number;
  totalRevenue: number;
  platformFeeAmount: number;
  hostPayoutAmount: number;
  stripeTransferId?: string | undefined;
  payoutError?: string | undefined;
  paidOutAt?: Date | undefined;
  hostStripeAccountId?: string | undefined;
  isHostStripeVerified?: boolean | undefined;
}

export interface ICancelEventOrderResponse {
  orderId: string;
  eventId: string;
  eventTitle: string;
  totalAmountRefunded: number;
  totalTicketsCancelled: number;
  stripeRefundId?: string | undefined;
  cancelledAt: Date;
}

