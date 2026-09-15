import Stripe from 'stripe';
import config from '../../config/config.js';
import { BusinessProfile } from '../businessProfile/businessProfile.model.js';
import { User } from '../auth/auth.model.js';
import { AppError } from '../../utils/AppError.js';
import { Event } from '../event/event.model.js';
import { Order } from '../order/order.model.js';
import { EventOrder } from '../eventOrder/eventOrder.model.js';
import { EventOrderService } from '../eventOrder/eventOrder.service.js';
import type {
  CreateConnectAccountInput,
  ICreateConnectAccountResponse,
  CreateCheckoutSessionInput,
  ICreateCheckoutSessionResponse,
  IAccountStatusResponse,
  ICreateLoginLinkResponse,
  IWebhookResponse,
  IEventPayoutResponse,
  IEventPayoutStatusResponse,
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
    } else if (account.details_submitted) {
      const disabledReason = account.requirements?.disabled_reason || '';
      if (disabledReason.startsWith('rejected.')) {
        status = 'RESTRICTED';
      } else {
        status = 'PENDING';
      }
    } else if (account.requirements?.disabled_reason) {
      status = 'RESTRICTED';
    } else {
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
 * Validates event & ticket availability, then creates a Stripe Checkout Session for buying tickets (with optional rewards).
 */
const createCheckoutSession = async (
  userId: string,
  payload: CreateCheckoutSessionInput
): Promise<ICreateCheckoutSessionResponse> => {
  checkStripeConfig();

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { eventId, successUrl, cancelUrl } = payload;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // 1. Process ticket items
  const inputTickets = payload.tickets && payload.tickets.length > 0 ? payload.tickets : [{ quantity: 1 }];

  const validatedTickets: Array<{
    priceCategoryId?: string;
    categoryName: string;
    unitPrice: number;
    quantity: number;
  }> = [];

  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let totalTicketQuantity = 0;

  for (const item of inputTickets) {
    const qty = Math.max(1, item.quantity || 1);
    let unitPrice = event.priceCategories?.[0]?.price || 0;
    let categoryName = 'General';
    const targetPriceCat = item.priceCategoryId
      ? event.priceCategories?.find(
        (pc: any) => pc._id?.toString() === item.priceCategoryId || pc.id === item.priceCategoryId
      )
      : event.priceCategories?.[0];

    if (item.priceCategoryId && !targetPriceCat) {
      throw new AppError(`Price category '${item.priceCategoryId}' not found for this event`, 404);
    }

    if (targetPriceCat) {
      if (targetPriceCat.stock < qty) {
        throw new AppError(
          `Only ${targetPriceCat.stock} tickets available for price category '${targetPriceCat.name}'`,
          400
        );
      }
      unitPrice = targetPriceCat.price;
      categoryName = targetPriceCat.name;
    }

    totalTicketQuantity += qty;

    const valTicket: {
      priceCategoryId?: string;
      categoryName: string;
      unitPrice: number;
      quantity: number;
    } = {
      categoryName,
      unitPrice,
      quantity: qty,
    };
    if (item.priceCategoryId) {
      valTicket.priceCategoryId = item.priceCategoryId;
    }
    validatedTickets.push(valTicket);

    stripeLineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Event Ticket: ${event.title} (${categoryName})`,
          description: `${qty} ticket(s) for ${event.placeName}`,
          images:
            event.images && event.images.length > 0 && typeof event.images[0] === 'string'
              ? [event.images[0]]
              : [],
        },
        unit_amount: Math.round(unitPrice * 100),
      },
      quantity: qty,
    });
  }

  // 2. Process reward items & check points
  const inputRewards = payload.rewards || [];
  const validatedRewards: Array<{ rewardId: string; quantity: number }> = [];
  let totalPointsRequired = 0;

  for (const rItem of inputRewards) {
    if (!rItem.rewardId) continue;
    const qty = Math.max(1, rItem.quantity || 1);

    const reward = event.rewards?.find(
      (r: any) => r._id?.toString() === rItem.rewardId || r.id === rItem.rewardId
    );
    if (!reward) {
      throw new AppError(`Reward item '${rItem.rewardId}' not found in this event`, 404);
    }
    if (reward.stock < qty) {
      throw new AppError(`Only ${reward.stock} items left for reward '${reward.title}'`, 400);
    }
    totalPointsRequired += (reward.pointsRequired || 0) * qty;
    validatedRewards.push({
      rewardId: rItem.rewardId,
      quantity: qty,
    });
  }

  if (totalPointsRequired > 0 && user.totalPoints < totalPointsRequired) {
    throw new AppError(
      `Insufficient points to claim reward(s). You need ${totalPointsRequired} points, but you have ${user.totalPoints} points.`,
      400
    );
  }



  const returnSuccessUrl =
    successUrl || `${config.serverUrl}/api/payments/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
  const returnCancelUrl =
    cancelUrl || `${config.serverUrl}/api/payments/checkout-cancel`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: stripeLineItems,
    metadata: {
      userId,
      eventId,
      tickets: JSON.stringify(validatedTickets),
      rewards: JSON.stringify(validatedRewards),
      totalTicketQuantity: totalTicketQuantity.toString(),
      type: 'EVENT_TICKET',
    },
    success_url: returnSuccessUrl,
    cancel_url: returnCancelUrl,
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
};

/**
 * Handles incoming Stripe Webhooks and updates BusinessProfile status or completes ticket purchases.
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
      console.error(`[Stripe Webhook Step 1 ERROR] Signature verification failed: ${err.message}`);
      throw new AppError(`Stripe Webhook Signature Verification Failed: ${err.message}`, 400);
    }
  } else if (fallbackBody && fallbackBody.type) {
    event = fallbackBody as Stripe.Event;
  } else {
    console.error('[Stripe Webhook Step 1 ERROR] Invalid webhook payload or missing signature');
    throw new AppError('Invalid webhook payload or missing signature', 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid' || session.status === 'complete') {
        const metadata = session.metadata || {};
        const { userId, eventId, tickets: rawTicketsJson, rewards: rawRewardsJson, totalTicketQuantity: rawTotalQty } = metadata;

        if (userId && eventId) {
          // Idempotency check: verify if EventOrder for this session already exists
          const existingOrder = await EventOrder.findOne({ stripeSessionId: session.id });
          if (!existingOrder) {
            const eventDoc = await Event.findById(eventId);
            if (eventDoc) {
              // Parse tickets metadata
              let parsedTickets: Array<{
                priceCategoryId?: string;
                categoryName: string;
                unitPrice: number;
                quantity: number;
              }> = [];

              if (rawTicketsJson) {
                try {
                  parsedTickets = JSON.parse(rawTicketsJson);
                } catch {
                  parsedTickets = [];
                }
              }

              if (parsedTickets.length === 0) {
                const defaultQty = parseInt(rawTotalQty || '1', 10) || 1;
                parsedTickets = [
                  {
                    categoryName: 'General',
                    unitPrice: eventDoc.priceCategories?.[0]?.price || 0,
                    quantity: defaultQty,
                  },
                ];
              }


              const totalTicketQuantity = parsedTickets.reduce((acc, t) => acc + t.quantity, 0);
              const totalAmount = (session.amount_total || 0) / 100;

              // 1. Save EventOrder in eventOrder module (and decrement event ticket stock per price category)
              const eventOrderPayload: any = {
                userId,
                hostId: eventDoc.hostId.toString(),
                eventId,
                tickets: parsedTickets,
                totalTicketQuantity,
                totalAmount,
                stripeSessionId: session.id,
                pointsEarned: totalTicketQuantity,
              };
              await EventOrderService.createEventOrder(eventOrderPayload);

              // 2. Save Reward Orders in order module and calculate points spent
              let parsedRewards: Array<{ rewardId: string; quantity: number }> = [];
              if (rawRewardsJson) {
                try {
                  parsedRewards = JSON.parse(rawRewardsJson);
                } catch {
                  parsedRewards = [];
                }
              }

              let totalPointsSpent = 0;
              for (const rewardMeta of parsedRewards) {
                const reward = eventDoc.rewards?.find(
                  (r: any) => r._id?.toString() === rewardMeta.rewardId || r.id === rewardMeta.rewardId
                );
                if (reward) {
                  const qtyToClaim = rewardMeta.quantity || 1;
                  totalPointsSpent += (reward.pointsRequired || 0) * qtyToClaim;
                  reward.stock = Math.max(0, reward.stock - qtyToClaim);
                  await eventDoc.save();

                  const orderData: any = {
                    user: userId,
                    itemType: 'EVENT',
                    hostId: eventDoc.hostId,
                    eventId: eventDoc._id,
                    rewardItemId: reward._id,
                    itemPoints: reward.pointsRequired || 0,
                    quantity: qtyToClaim,
                    status: 'CLAIMED',
                  };
                  await Order.create(orderData);
                }
              }

              // 3. Update user points (gain 1 point per ticket, minus points spent on rewards)
              const userDoc = await User.findById(userId);
              if (userDoc) {
                const updatedPoints = (userDoc.totalPoints || 0) + totalTicketQuantity - totalPointsSpent;
                userDoc.totalPoints = Math.max(0, updatedPoints);
                await userDoc.save();
              }

            }
          }
        }
      }
      break;
    }



    case 'account.updated':
    case 'capability.updated':
    case 'person.updated': {
      const eventObj = event.data.object as any;

      // Extract ONLY valid Stripe Account ID starting with 'acct_'
      // Do NOT use capability or object IDs (such as 'card_payments' or 'transfers')
      let stripeAccountId: string | undefined;
      if (event.type === 'account.updated' && eventObj?.object === 'account' && typeof eventObj?.id === 'string' && eventObj.id.startsWith('acct_')) {
        stripeAccountId = eventObj.id;
      } else if (event.account && typeof event.account === 'string' && event.account.startsWith('acct_')) {
        stripeAccountId = event.account;
      } else if (eventObj?.account && typeof eventObj.account === 'string' && eventObj.account.startsWith('acct_')) {
        stripeAccountId = eventObj.account;
      }

      if (!stripeAccountId) {
        console.warn(`[Stripe Webhook Step 3 WARN] Could not determine valid Stripe Account ID (acct_...) from event '${event.type}'`);
        break;
      }

      let businessProfile = await BusinessProfile.findOne({ stripeAccountId });
      if (!businessProfile && eventObj?.metadata?.businessProfileId) {
        businessProfile = await BusinessProfile.findById(eventObj.metadata.businessProfileId);
      }
      if (!businessProfile && eventObj?.metadata?.userId) {
        businessProfile = await BusinessProfile.findOne({ userId: eventObj.metadata.userId });
      }

      if (!businessProfile) {
        console.warn(`[Stripe Webhook Step 3 WARN] No matching BusinessProfile found in database for stripeAccountId '${stripeAccountId}'!`);
        break;
      }

      // Retrieve full updated account object directly from Stripe API to get accurate live data
      let account: Stripe.Account;
      if (config.stripeSecretKey && !config.stripeSecretKey.startsWith('sk_test_placeholder')) {
        try {
          account = await stripe.accounts.retrieve(stripeAccountId);
        } catch (apiErr: any) {
          console.warn(`[Stripe Webhook Step 4 WARN] Could not fetch fresh account from Stripe API: ${apiErr.message}.`);
          if (event.type === 'account.updated' && eventObj?.object === 'account') {
            account = eventObj as Stripe.Account;
          } else {
            console.error(`[Stripe Webhook Step 4 ERROR] Cannot process event '${event.type}' without full account object.`);
            break;
          }
        }
      } else if (event.type === 'account.updated' && eventObj?.object === 'account') {
        account = eventObj as Stripe.Account;
      } else {
        console.error(`[Stripe Webhook Step 4 ERROR] Cannot process event '${event.type}' without full account object.`);
        break;
      }

      const isVerified = Boolean(account.details_submitted && account.payouts_enabled);
      let status: StripeAccountStatus = 'PENDING';

      if (account.payouts_enabled && account.charges_enabled) {
        status = 'ACTIVE';
      } else {
        const disabledReason = account.requirements?.disabled_reason || '';
        if (disabledReason.startsWith('rejected.')) {
          status = 'RESTRICTED';
        } else {
          status = 'PENDING';
        }
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
        } else {
          console.warn(`[Stripe Webhook Step 3 WARN] No BusinessProfile found for deauthorization with stripeAccountId '${deauthAccountId}'`);
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

/**
 * Processes automated payout for an event whose end date has passed.
 * Deducts $0.99 per ticket sold as platform fee and transfers remaining ticket revenue
 * directly to host's connected Stripe Express account.
 */
const processEventPayout = async (
  eventId: string,
  requestedByUserId?: string
): Promise<IEventPayoutResponse> => {
  const eventDoc = await Event.findById(eventId);
  if (!eventDoc) {
    throw new AppError('Event not found', 404);
  }

  if (requestedByUserId && eventDoc.hostId.toString() !== requestedByUserId) {
    throw new AppError('Not authorized to manage payouts for this event', 403);
  }

  const now = new Date();
  if (eventDoc.endDate > now) {
    throw new AppError(
      `Event has not ended yet (End Date: ${eventDoc.endDate.toISOString()}). Payouts can only be processed after event completion.`,
      400
    );
  }

  if (eventDoc.payoutStatus === 'COMPLETED' && eventDoc.stripeTransferId) {
    // Already completed payout, return existing summary
    const totalOrders = await EventOrder.countDocuments({ eventId: eventDoc._id });
    const orders = await EventOrder.find({ eventId: eventDoc._id });
    const totalTicketsSold = orders.reduce((sum, o) => sum + (o.totalTicketQuantity || 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      eventId: eventDoc._id.toString(),
      payoutStatus: eventDoc.payoutStatus,
      totalOrders,
      totalTicketsSold,
      totalRevenue,
      platformFeeAmount: eventDoc.platformFeeAmount || 0,
      hostPayoutAmount: eventDoc.payoutAmount || 0,
      stripeTransferId: eventDoc.stripeTransferId || undefined,
      payoutError: eventDoc.payoutError || undefined,
      paidOutAt: eventDoc.paidOutAt || undefined,
    };
  }

  // Update status to PROCESSING
  eventDoc.payoutStatus = 'PROCESSING';
  await eventDoc.save();

  // Aggregate all paid or completed orders for this event
  const orders = await EventOrder.find({
    eventId: eventDoc._id,
    status: { $in: ['PAID', 'COMPLETED'] },
  });

  const totalTicketsSold = orders.reduce((sum, o) => sum + (o.totalTicketQuantity || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Platform fee is $0.99 per ticket sold
  const platformFeeAmount = Math.round(totalTicketsSold * 0.99 * 100) / 100;
  const hostPayoutAmount = Math.max(0, Math.round((totalRevenue - platformFeeAmount) * 100) / 100);

  // If no tickets sold or no revenue to payout
  if (totalTicketsSold === 0 || totalRevenue === 0 || hostPayoutAmount <= 0) {
    eventDoc.payoutStatus = 'SKIPPED';
    eventDoc.payoutAmount = 0;
    eventDoc.platformFeeAmount = 0;
    eventDoc.paidOutAt = new Date();
    eventDoc.payoutError = '';
    await eventDoc.save();

    for (const order of orders) {
      order.status = 'COMPLETED';
      order.payoutStatus = 'SKIPPED';
      order.platformFeeAmount = 0;
      order.hostPayoutAmount = 0;
      await order.save();
    }

    return {
      eventId: eventDoc._id.toString(),
      payoutStatus: 'SKIPPED',
      totalOrders: orders.length,
      totalTicketsSold,
      totalRevenue,
      platformFeeAmount: 0,
      hostPayoutAmount: 0,
      paidOutAt: eventDoc.paidOutAt || undefined,
    };
  }

  // Retrieve Host's Business Profile & Stripe account details
  const businessProfile = await BusinessProfile.findOne({ userId: eventDoc.hostId });
  if (!businessProfile || !businessProfile.stripeAccountId || !businessProfile.isStripeConnected) {
    const errorMsg = 'Host has not created or connected a Stripe Express account. Payout cannot be processed.';
    eventDoc.payoutStatus = 'FAILED';
    eventDoc.payoutError = errorMsg;
    await eventDoc.save();
    throw new AppError(errorMsg, 400);
  }

  checkStripeConfig();

  try {
    // Transfer funds from main platform balance to Host's Stripe Connect Express account
    const transfer = await stripe.transfers.create({
      amount: Math.round(hostPayoutAmount * 100), // amount in cents
      currency: 'usd',
      destination: businessProfile.stripeAccountId,
      description: `Payout for Event: "${eventDoc.title}" (Event ID: ${eventDoc._id})`,
      metadata: {
        eventId: eventDoc._id.toString(),
        hostId: eventDoc.hostId.toString(),
        totalOrders: orders.length.toString(),
        totalTicketsSold: totalTicketsSold.toString(),
        totalRevenue: totalRevenue.toFixed(2),
        platformFeeAmount: platformFeeAmount.toFixed(2),
        hostPayoutAmount: hostPayoutAmount.toFixed(2),
      },
    });

    // Update Event document
    eventDoc.payoutStatus = 'COMPLETED';
    eventDoc.payoutAmount = hostPayoutAmount;
    eventDoc.platformFeeAmount = platformFeeAmount;
    eventDoc.stripeTransferId = transfer.id;
    eventDoc.paidOutAt = new Date();
    eventDoc.payoutError = '';
    await eventDoc.save();

    // Update individual EventOrder documents
    for (const order of orders) {
      const orderTickets = order.totalTicketQuantity || 1;
      const orderFee = Math.round(orderTickets * 0.99 * 100) / 100;
      const orderHostPayout = Math.max(0, Math.round(((order.totalAmount || 0) - orderFee) * 100) / 100);

      order.status = 'COMPLETED';
      order.payoutStatus = 'COMPLETED';
      order.platformFeeAmount = orderFee;
      order.hostPayoutAmount = orderHostPayout;
      order.stripeTransferId = transfer.id;
      await order.save();
    }

    return {
      eventId: eventDoc._id.toString(),
      payoutStatus: 'COMPLETED',
      totalOrders: orders.length,
      totalTicketsSold,
      totalRevenue,
      platformFeeAmount,
      hostPayoutAmount,
      stripeTransferId: transfer.id,
      paidOutAt: eventDoc.paidOutAt || undefined,
    };
  } catch (err: any) {
    const errorMsg = err.message || 'Stripe transfer failed';
    eventDoc.payoutStatus = 'FAILED';
    eventDoc.payoutError = errorMsg;
    await eventDoc.save();
    throw new AppError(`Event Payout Failed: ${errorMsg}`, 500);
  }
};

/**
 * Sweep function that finds all ended events with pending payouts and processes them.
 */
const processCompletedEventPayouts = async (): Promise<{
  processedCount: number;
  results: IEventPayoutResponse[];
  errors: Array<{ eventId: string; error: string }>;
}> => {
  const now = new Date();
  const eligibleEvents = await Event.find({
    endDate: { $lte: now },
    payoutStatus: { $in: ['PENDING', 'FAILED'] },
  });

  const results: IEventPayoutResponse[] = [];
  const errors: Array<{ eventId: string; error: string }> = [];

  for (const eventDoc of eligibleEvents) {
    try {
      const res = await processEventPayout(eventDoc._id.toString());
      results.push(res);
    } catch (err: any) {
      errors.push({
        eventId: eventDoc._id.toString(),
        error: err.message || 'Payout processing failed',
      });
    }
  }

  return {
    processedCount: eligibleEvents.length,
    results,
    errors,
  };
};

/**
 * Gets payout status breakdown for a specific event.
 */
const getEventPayoutStatus = async (
  eventId: string,
  requestedByUserId?: string
): Promise<IEventPayoutStatusResponse> => {
  const eventDoc = await Event.findById(eventId);
  if (!eventDoc) {
    throw new AppError('Event not found', 404);
  }

  if (requestedByUserId && eventDoc.hostId.toString() !== requestedByUserId) {
    throw new AppError('Not authorized to view payout status for this event', 403);
  }

  const orders = await EventOrder.find({
    eventId: eventDoc._id,
    status: { $in: ['PAID', 'COMPLETED'] },
  });

  const totalTicketsSold = orders.reduce((sum, o) => sum + (o.totalTicketQuantity || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const platformFeeAmount = eventDoc.platformFeeAmount || Math.round(totalTicketsSold * 0.99 * 100) / 100;
  const hostPayoutAmount = eventDoc.payoutAmount || Math.max(0, Math.round((totalRevenue - platformFeeAmount) * 100) / 100);

  const businessProfile = await BusinessProfile.findOne({ userId: eventDoc.hostId });

  return {
    eventId: eventDoc._id.toString(),
    eventTitle: eventDoc.title,
    endDate: eventDoc.endDate,
    isEventEnded: new Date(eventDoc.endDate) <= new Date(),
    payoutStatus: eventDoc.payoutStatus || 'PENDING',
    totalTicketsSold,
    totalRevenue,
    platformFeeAmount,
    hostPayoutAmount,
    stripeTransferId: eventDoc.stripeTransferId || undefined,
    payoutError: eventDoc.payoutError || undefined,
    paidOutAt: eventDoc.paidOutAt || undefined,
    hostStripeAccountId: businessProfile?.stripeAccountId || undefined,
    isHostStripeVerified: businessProfile?.isStripeVerified ?? undefined,
  };
};

export const PaymentService = {
  createConnectAccount,
  createCheckoutSession,
  getAccountStatus,
  createLoginLink,
  handleWebhook,
  processEventPayout,
  processCompletedEventPayouts,
  getEventPayoutStatus,
};

