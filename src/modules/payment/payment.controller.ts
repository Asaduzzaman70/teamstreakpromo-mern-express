import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import { PaymentService } from './payment.service.js';

// @desc    Create/retrieve Stripe Connect account and generate onboarding link
// @route   POST /api/payments/create-connect-account
// @access  Private (HOST, BUSINESS)
const createConnectAccount = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await PaymentService.createConnectAccount(req.user.id, req.body);

    sendResponse(res, {
      statusCode: 200,
      message: 'Stripe onboarding link generated successfully',
      data: result,
    });
  }
);

// @desc    Get Stripe Connect account & payout status for host
// @route   GET /api/payments/account-status
// @access  Private (HOST, BUSINESS)
const getAccountStatus = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await PaymentService.getAccountStatus(req.user.id);

    sendResponse(res, {
      statusCode: 200,
      message: 'Stripe account status retrieved successfully',
      data: result,
    });
  }
);

// @desc    Create Stripe Express Dashboard login link for host
// @route   POST /api/payments/create-login-link
// @access  Private (HOST, BUSINESS)
const createLoginLink = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await PaymentService.createLoginLink(req.user.id);

    sendResponse(res, {
      statusCode: 200,
      message: 'Stripe dashboard login link created successfully',
      data: result,
    });
  }
);

// @desc    Create Stripe Checkout Session for event ticket purchase
// @route   POST /api/payments/create-checkout-session
// @access  Private (Authenticated users)
const createCheckoutSession = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await PaymentService.createCheckoutSession(req.user.id, req.body);

    sendResponse(res, {
      statusCode: 200,
      message: 'Stripe checkout session created successfully',
      data: result,
    });
  }
);

// @desc    Stripe Webhook handler to synchronize account status updates
// @route   POST /api/payments/webhook
// @access  Public (Stripe signature verified)
const handleWebhook = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const rawBody = (req as any).rawBody;
  const signature = req.headers['stripe-signature'];
  const result = await PaymentService.handleWebhook(rawBody, signature, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: 'Stripe webhook received and processed successfully',
    data: result,
  });
});

export const PaymentController = {
  createConnectAccount,
  createCheckoutSession,
  getAccountStatus,
  createLoginLink,
  handleWebhook,
};

