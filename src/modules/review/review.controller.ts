import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import { ReviewService } from './review.service.js';

/**
 * Submit a review for a completed event.
 */
const createReview = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await ReviewService.createReview(
      req.user.id,
      req.body,
      req.user.role
    );

    sendResponse(res, {
      statusCode: 201,
      message: 'Review submitted successfully',
      data: result,
    });
  }
);

/**
 * Check if the authenticated user is eligible to review an event.
 */
const checkEligibility = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const { eventId } = req.params;
    if (!eventId) {
      throw new AppError('Event ID is required', 400);
    }

    const result = await ReviewService.checkReviewEligibility(
      req.user.id,
      eventId as string,
      req.user.role
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Review eligibility checked',
      data: result,
    });
  }
);

/**
 * Get reviews for a specific event with rating metrics and tags.
 */
const getEventReviews = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { eventId } = req.params;
    if (!eventId) {
      throw new AppError('Event ID is required', 400);
    }

    const result = await ReviewService.getEventReviews(
      eventId as string,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Event reviews retrieved successfully',
      meta: result.meta,
      data: {
        stats: result.stats,
        reviews: result.data,
      },
    });
  }
);

/**
 * Get reviews for a host across all their events with aggregate stats.
 */
const getHostReviews = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { hostId } = req.params;
    if (!hostId) {
      throw new AppError('Host ID is required', 400);
    }

    const result = await ReviewService.getHostReviews(
      hostId as string,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Host reviews retrieved successfully',
      meta: result.meta,
      data: {
        stats: result.stats,
        reviews: result.data,
      },
    });
  }
);

/**
 * Get reviews written by the logged-in user.
 */
const getMyReviews = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await ReviewService.getMyReviews(req.user.id, req.query);

    sendResponse(res, {
      statusCode: 200,
      message: 'My reviews retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }
);

/**
 * Get a single review by ID.
 */
const getReviewById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Review ID is required', 400);
    }

    const result = await ReviewService.getReviewById(id as string);

    sendResponse(res, {
      statusCode: 200,
      message: 'Review retrieved successfully',
      data: result,
    });
  }
);

/**
 * Delete a review (Author or Admin).
 */
const deleteReview = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Review ID is required', 400);
    }

    await ReviewService.deleteReview(
      id as string,
      req.user.id,
      req.user.role
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Review deleted successfully',
    });
  }
);

export const ReviewController = {
  createReview,
  checkEligibility,
  getEventReviews,
  getHostReviews,
  getMyReviews,
  getReviewById,
  deleteReview,
};
