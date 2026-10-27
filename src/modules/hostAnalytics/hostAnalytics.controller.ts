import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import { HostAnalyticsService } from './hostAnalytics.service.js';

/**
 * Helper to ensure host authentication and extract logged-in host's ID from JWT token.
 */
const getAuthenticatedHostId = (req: AuthenticatedRequest): string => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }
  return req.user.id;
};

/**
 * GET /api/host-analytics
 * Retrieves the complete host analytics dashboard payload (overview cards + revenue chart + ticket sales chart).
 */
const getHostAnalytics = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const hostId = getAuthenticatedHostId(req);
    const result = await HostAnalyticsService.getHostAnalytics(hostId, req.query as any);

    sendResponse(res, {
      statusCode: 200,
      message: 'Host analytics retrieved successfully',
      data: result,
    });
  }
);

/**
 * GET /api/host-analytics/overview
 * Retrieves high-level total revenue, tickets sold, events count, and orders count.
 */
const getHostOverview = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const hostId = getAuthenticatedHostId(req);
    const eventId = req.query.eventId as string | undefined;

    const result = await HostAnalyticsService.getHostOverview(hostId, eventId);

    sendResponse(res, {
      statusCode: 200,
      message: 'Host overview statistics retrieved successfully',
      data: result,
    });
  }
);

/**
 * GET /api/host-analytics/revenue
 * Retrieves revenue chart data with dynamic timeframe grouping (week, month, year, etc.).
 */
const getHostRevenueChart = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const hostId = getAuthenticatedHostId(req);
    const result = await HostAnalyticsService.getHostRevenueChart(hostId, req.query as any);

    sendResponse(res, {
      statusCode: 200,
      message: 'Host revenue chart data retrieved successfully',
      data: result,
    });
  }
);

/**
 * GET /api/host-analytics/ticket-sales
 * Retrieves ticket sales chart data with dynamic timeframe grouping (week, month, year, etc.).
 */
const getHostTicketSalesChart = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const hostId = getAuthenticatedHostId(req);
    const result = await HostAnalyticsService.getHostTicketSalesChart(
      hostId,
      req.query as any
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Host ticket sales chart data retrieved successfully',
      data: result,
    });
  }
);

export const HostAnalyticsController = {
  getHostAnalytics,
  getHostOverview,
  getHostRevenueChart,
  getHostTicketSalesChart,
};
