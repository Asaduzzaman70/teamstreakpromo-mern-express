import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createConnectAccountSchema } from './payment.validation.js';

const router = Router();

// Stripe Webhook (Public, signature verified)
router.post('/webhook', PaymentController.handleWebhook);

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

export const paymentRoutes = router;
