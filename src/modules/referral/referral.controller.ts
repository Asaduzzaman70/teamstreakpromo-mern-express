import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as ReferralService from './referral.service.js';

export const getMyHostPoints = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const result = await ReferralService.getAllUserHostPoints(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User host points retrieved successfully',
    data: result,
  });
});

export const getEventReferralDetails = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const eventId = req.params.eventId as string;
  const result = await ReferralService.getEventReferralDetails(userId, eventId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event referral link and host points retrieved successfully',
    data: result,
  });
});

export const getMyReferrals = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const result = await ReferralService.getMyReferrals(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User referral history retrieved successfully',
    data: result,
  });
});
