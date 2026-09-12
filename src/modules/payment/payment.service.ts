import Stripe from 'stripe';
import config from '../../config/config.js';
import { BusinessProfile } from '../businessProfile/businessProfile.model.js';
import { User } from '../auth/auth.model.js';
import { AppError } from '../../utils/AppError.js';
import type {
  CreateConnectAccountInput,
  ICreateConnectAccountResponse,
  IAccountStatusResponse,
  ICreateLoginLinkResponse,
  IWebhookResponse,
} from './payment.interface.js';
import type { StripeAccountStatus } from '../businessProfile/businessProfile.interface.js';

// Initialize Stripe instance with safe fallback to prevent boot crashes when key is not yet in .env
const stripe = new Stripe(config.stripeSecretKey || 'sk_test_placeholder_teamstreakpromo');

const checkStripeConfig = () => {
  if (!config.stripeSecretKey || config.stripeSecretKey.startsWith('sk_test_placeholder')) {
    throw new AppError('Stripe secret key is not configured in environment variables (STRIPE_SECRET_KEY)', 500);
  }
};

/**
 * Creates a Stripe Connect Express Account for a Host and returns an onboarding link.
 */
const createConnectAccount = async (
  userId: string,
  payload: CreateConnectAccountInput
): Promise<ICreateConnectAccountResponse> => {
  checkStripeConfig();
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const businessProfile = await BusinessProfile.findOne({ userId });
  if (!businessProfile) {
    throw new AppError(
      'Business profile not found. Please complete your host registration profile first.',
      404
    );
  }

  let stripeAccountId = businessProfile.stripeAccountId;

  // If no Stripe Account ID is saved, create a new Express account
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: payload.country || 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: payload.businessType || 'individual',
      metadata: {
        userId: user._id.toString(),
        businessProfileId: businessProfile._id.toString(),
        businessName: businessProfile.businessName || '',
      },
    });

    stripeAccountId = account.id;
    businessProfile.stripeAccountId = stripeAccountId;
    businessProfile.isStripeConnected = true;
    businessProfile.stripeAccountStatus = 'PENDING';
    await businessProfile.save();
  }

  const refreshUrl =
    payload.refreshUrl || `${config.serverUrl}/api/payments/stripe/refresh`;
  const returnUrl =
    payload.returnUrl || `${config.serverUrl}/api/payments/stripe/return`;

  // Create an Account Link for Stripe-hosted onboarding & bank verification
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return {
    stripeAccountId,
    url: accountLink.url,
  };
};

/**
 * Retrieves the Stripe Connect account onboarding & payout status for a host.
 */
const getAccountStatus = async (userId: string): Promise<IAccountStatusResponse> => {
  const businessProfile = await BusinessProfile.findOne({ userId });
  if (!businessProfile) {
    throw new AppError('Business profile not found', 404);
  }

  if (!businessProfile.stripeAccountId) {
    return {
      stripeAccountId: '',
      isStripeConnected: false,
      isStripeVerified: false,
      stripeAccountStatus: 'UNLINKED',
      stripePayoutsEnabled: false,
      stripeChargesEnabled: false,
      stripeDetailsSubmitted: false,
    };
  }

  try {
    const account = await stripe.accounts.retrieve(businessProfile.stripeAccountId);
    const isVerified = Boolean(account.details_submitted && account.payouts_enabled);

    let status: StripeAccountStatus = 'PENDING';
    if (account.payouts_enabled && account.charges_enabled) {
      status = 'ACTIVE';
    } else if (account.requirements?.disabled_reason) {
      status = 'RESTRICTED';
    } else if (account.details_submitted) {
      status = 'PENDING';
    }

    businessProfile.isStripeConnected = true;
    businessProfile.isStripeVerified = isVerified;
    businessProfile.stripePayoutsEnabled = Boolean(account.payouts_enabled);
    businessProfile.stripeChargesEnabled = Boolean(account.charges_enabled);
    businessProfile.stripeDetailsSubmitted = Boolean(account.details_submitted);
    businessProfile.stripeAccountStatus = status;
    await businessProfile.save();

    return {
      stripeAccountId: businessProfile.stripeAccountId,
      isStripeConnected: businessProfile.isStripeConnected,
      isStripeVerified: businessProfile.isStripeVerified,
      stripeAccountStatus: businessProfile.stripeAccountStatus,
      stripePayoutsEnabled: businessProfile.stripePayoutsEnabled,
      stripeChargesEnabled: businessProfile.stripeChargesEnabled,
      stripeDetailsSubmitted: businessProfile.stripeDetailsSubmitted,
      requirements: {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
        pendingVerification: account.requirements?.pending_verification || [],
        disabledReason: account.requirements?.disabled_reason || null,
      },
    };
  } catch {
    return {
      stripeAccountId: businessProfile.stripeAccountId,
      isStripeConnected: Boolean(businessProfile.isStripeConnected),
      isStripeVerified: Boolean(businessProfile.isStripeVerified),
      stripeAccountStatus: businessProfile.stripeAccountStatus || 'PENDING',
      stripePayoutsEnabled: Boolean(businessProfile.stripePayoutsEnabled),
      stripeChargesEnabled: Boolean(businessProfile.stripeChargesEnabled),
      stripeDetailsSubmitted: Boolean(businessProfile.stripeDetailsSubmitted),
    };
  }
};

/**
 * Creates a Stripe Express Dashboard login link for verified hosts.
 */
const createLoginLink = async (userId: string): Promise<ICreateLoginLinkResponse> => {
  checkStripeConfig();
  const businessProfile = await BusinessProfile.findOne({ userId });
  if (!businessProfile) {
    throw new AppError('Business profile not found', 404);
  }

  if (!businessProfile.stripeAccountId) {
    throw new AppError(
      'No Stripe account connected for this host yet. Please link your account first.',
      400
    );
  }

  const loginLink = await stripe.accounts.createLoginLink(
    businessProfile.stripeAccountId
  );

  return {
    url: loginLink.url,
  };
};

/**
 * Handles incoming Stripe Webhooks and updates the host's BusinessProfile status.
 */
const handleWebhook = async (
  payloadBuffer: Buffer | string | undefined,
  signatureHeader: string | string[] | undefined,
  fallbackBody?: any
): Promise<IWebhookResponse> => {
  let event: Stripe.Event;
  const sig = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  if (config.stripeWebhookSecret && sig && payloadBuffer) {
    try {
      event = stripe.webhooks.constructEvent(
        payloadBuffer,
        sig,
        config.stripeWebhookSecret
      );
    } catch (err: any) {
      throw new AppError(`Stripe Webhook Signature Verification Failed: ${err.message}`, 400);
    }
  } else if (fallbackBody && fallbackBody.type) {
    event = fallbackBody as Stripe.Event;
  } else {
    throw new AppError('Invalid webhook payload or missing signature', 400);
  }

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      const stripeAccountId = account.id;

      let businessProfile = await BusinessProfile.findOne({ stripeAccountId });
      if (!businessProfile && account.metadata?.businessProfileId) {
        businessProfile = await BusinessProfile.findById(account.metadata.businessProfileId);
      }
      if (!businessProfile && account.metadata?.userId) {
        businessProfile = await BusinessProfile.findOne({ userId: account.metadata.userId });
      }

      if (businessProfile) {
        const isVerified = Boolean(account.details_submitted && account.payouts_enabled);
        let status: StripeAccountStatus = 'PENDING';
        if (account.payouts_enabled && account.charges_enabled) {
          status = 'ACTIVE';
        } else if (account.requirements?.disabled_reason) {
          status = 'RESTRICTED';
        } else if (account.details_submitted) {
          status = 'PENDING';
        }

        businessProfile.stripeAccountId = stripeAccountId;
        businessProfile.isStripeConnected = true;
        businessProfile.isStripeVerified = isVerified;
        businessProfile.stripePayoutsEnabled = Boolean(account.payouts_enabled);
        businessProfile.stripeChargesEnabled = Boolean(account.charges_enabled);
        businessProfile.stripeDetailsSubmitted = Boolean(account.details_submitted);
        businessProfile.stripeAccountStatus = status;

        if (isVerified && !businessProfile.verifiedAt) {
          businessProfile.verifiedAt = new Date();
        }

        await businessProfile.save();
      }
      break;
    }

    case 'account.application.deauthorized': {
      const deauthAccountId = event.account || (event.data.object as { id?: string })?.id;
      if (deauthAccountId) {
        const businessProfile = await BusinessProfile.findOne({ stripeAccountId: deauthAccountId });
        if (businessProfile) {
          businessProfile.stripeAccountStatus = 'INACTIVE';
          businessProfile.isStripeConnected = false;
          businessProfile.isStripeVerified = false;
          businessProfile.stripePayoutsEnabled = false;
          businessProfile.stripeChargesEnabled = false;
          await businessProfile.save();
        }
      }
      break;
    }

    default:
      break;
  }

  return {
    received: true,
    eventType: event.type,
  };
};

export const PaymentService = {
  createConnectAccount,
  getAccountStatus,
  createLoginLink,
  handleWebhook,
};
