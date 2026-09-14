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

