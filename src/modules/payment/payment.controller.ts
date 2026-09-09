import { type Request, type Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { PaymentService } from './payment.service.js';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { amount, currency, successUrl, cancelUrl } = req.body;

  if (!amount) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Amount is required',
      data: null,
    });
  }

  const result = await PaymentService.createCheckoutSession(
    amount,
    currency,
    successUrl,
    cancelUrl
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment Checkout Session created successfully',
    data: {
      sessionId: result.id,
      url: result.url,
    },
  });
});

export const PaymentController = {
  createCheckoutSession,
};
