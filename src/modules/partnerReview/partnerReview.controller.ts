import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import { PartnerReviewService } from './partnerReview.service.js';

/**
 * Submit a review for a redeemed business partner product.
 */
const createReview = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await PartnerReviewService.createReview(
      req.user.id,
      req.body,
      req.user.role
    );

    sendResponse(res, {
      statusCode: 201,
      message: 'Business partner review submitted successfully',
      data: result,
    });
  }
);

/**
 * Check if the user is eligible to review a business partner product.
 */
const checkEligibility = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const { productId } = req.params;
    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

    const result = await PartnerReviewService.checkReviewEligibility(
      req.user.id,
      productId as string,
      req.user.role
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Partner review eligibility checked',
      data: result,
    });
  }
);

/**
 * Get all reviews for a specific marketplace product.
 */
const getProductReviews = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;
    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

    const result = await PartnerReviewService.getProductReviews(
      productId as string,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Product reviews retrieved successfully',
      meta: result.meta,
      data: {
        stats: result.stats,
        reviews: result.data,
      },
    });
  }
);

/**
 * Get all reviews for a business partner across all products.
 */
const getPartnerReviews = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { partnerId } = req.params;
    if (!partnerId) {
      throw new AppError('Partner ID is required', 400);
    }

    const result = await PartnerReviewService.getPartnerReviews(
      partnerId as string,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Business partner reviews retrieved successfully',
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

    const result = await PartnerReviewService.getMyReviews(
      req.user.id,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'My partner reviews retrieved successfully',
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

    const result = await PartnerReviewService.getReviewById(id as string);

    sendResponse(res, {
      statusCode: 200,
      message: 'Partner review retrieved successfully',
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

    await PartnerReviewService.deleteReview(
      id as string,
      req.user.id,
      req.user.role
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Partner review deleted successfully',
    });
  }
);

export const PartnerReviewController = {
  createReview,
  checkEligibility,
  getProductReviews,
  getPartnerReviews,
  getMyReviews,
  getReviewById,
  deleteReview,
};
