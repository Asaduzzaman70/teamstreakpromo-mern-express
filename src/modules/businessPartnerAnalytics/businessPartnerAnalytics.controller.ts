import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import { BusinessPartnerAnalyticsService } from './businessPartnerAnalytics.service.js';

/**
 * Helper to ensure business partner authentication and extract logged-in business owner's ID from JWT token.
 */
const getAuthenticatedBusinessOwnerId = (req: AuthenticatedRequest): string => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }
  return req.user.id;
};

/**
 * GET /api/business-partner-analytics
 * Retrieves the complete business partner analytics dashboard payload (overview cards + reward sell chart).
 */
const getBusinessPartnerAnalytics = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const businessOwnerId = getAuthenticatedBusinessOwnerId(req);
    const result = await BusinessPartnerAnalyticsService.getBusinessPartnerAnalytics(
      businessOwnerId,
      req.query as any
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Business partner analytics retrieved successfully',
      data: result,
    });
  }
);

/**
 * GET /api/business-partner-analytics/overview
 * Retrieves high-level total claims, store visits, and active reward count.
 */
const getBusinessPartnerOverview = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const businessOwnerId = getAuthenticatedBusinessOwnerId(req);
    const itemId = req.query.itemId as string | undefined;

    const result = await BusinessPartnerAnalyticsService.getBusinessPartnerOverview(
      businessOwnerId,
      itemId
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Business partner overview statistics retrieved successfully',
      data: result,
    });
  }
);

/**
 * GET /api/business-partner-analytics/reward-sells
 * Retrieves reward sells chart data with dynamic timeframe grouping (week, month, year, etc.).
 */
const getRewardSellChart = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const businessOwnerId = getAuthenticatedBusinessOwnerId(req);
    const result = await BusinessPartnerAnalyticsService.getRewardSellChart(
      businessOwnerId,
      req.query as any
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Reward sell chart data retrieved successfully',
      data: result,
    });
  }
);

export const BusinessPartnerAnalyticsController = {
  getBusinessPartnerAnalytics,
  getBusinessPartnerOverview,
  getRewardSellChart,
};
