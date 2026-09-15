import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  createConnectAccountSchema,
  createCheckoutSessionSchema,
} from './payment.validation.js';

const router = Router();

// Stripe Webhook (Public, signature verified)
router.post('/webhook', PaymentController.handleWebhook);

// Create Stripe Checkout Session for Event Ticket Purchase
router.post(
  '/create-checkout-session',
  protect,
  validateRequest(createCheckoutSessionSchema),
  PaymentController.createCheckoutSession
);

// Host Stripe Connect Account Onboarding
router.post(
  '/create-connect-account',
  protect,
  authorizeRoles('HOST', 'BUSINESS', 'ADMIN'),
  validateRequest(createConnectAccountSchema),
  PaymentController.createConnectAccount
);

// Host Stripe Connect Account Status
router.get(
  '/account-status',
  protect,
  authorizeRoles('HOST', 'BUSINESS', 'ADMIN'),
  PaymentController.getAccountStatus
);

// Host Stripe Express Dashboard Login Link
router.post(
  '/create-login-link',
  protect,
  authorizeRoles('HOST', 'BUSINESS', 'ADMIN'),
  PaymentController.createLoginLink
);

// Trigger payout for a completed event (Host/Business/Admin)
router.post(
  '/events/:eventId/payout',
  protect,
  authorizeRoles('HOST', 'BUSINESS', 'ADMIN'),
  PaymentController.processEventPayout
);

// Sweep and process payouts for all completed ended events (Admin)
router.post(
  '/process-payouts',
  protect,
  authorizeRoles('ADMIN'),
  PaymentController.processCompletedEventPayouts
);

// Get payout status and breakdown for an event (Host/Business/Admin)
router.get(
  '/events/:eventId/payout-status',
  protect,
  authorizeRoles('HOST', 'BUSINESS', 'ADMIN'),
  PaymentController.getEventPayoutStatus
);

export const paymentRoutes = router;

