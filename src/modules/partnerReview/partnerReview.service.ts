import { Types } from 'mongoose';
import { PartnerReview } from './partnerReview.model.js';
import type {
  CreatePartnerReviewInput,
  IPartnerReview,
  PartnerReviewEligibilityResult,
  PartnerReviewQuery,
  PartnerReviewStats,
} from './partnerReview.interface.js';
import { Marketplace } from '../marketplace/marketplace.model.js';
import { Order } from '../order/order.model.js';
import { User } from '../auth/auth.model.js';
import { BusinessProfile } from '../businessProfile/businessProfile.model.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';

/**
 * Recalculates and persists aggregate rating for a business partner.
 */
const recalculatePartnerRating = async (partnerId: string): Promise<number> => {
  const partnerObjectId = new Types.ObjectId(partnerId);
  const stats = await PartnerReview.aggregate([
    { $match: { businessPartner: partnerObjectId } },
    {
      $group: {
        _id: '$businessPartner',
        avgRating: { $avg: '$rating' },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const avgRating =
    stats.length > 0 && stats[0].avgRating
      ? Math.round(stats[0].avgRating * 10) / 10
      : 0;

  await User.findByIdAndUpdate(partnerId, { rating: avgRating });
  await BusinessProfile.findOneAndUpdate(
    { userId: partnerObjectId },
    { rating: avgRating }
  );

  logger.info(
    `[PartnerReviewService] Updated rating for business partner ${partnerId}: ${avgRating}`
  );
  return avgRating;
};

/**
 * Creates a review for a business partner and redeemed product.
 */
const createReview = async (
  userId: string,
  input: CreatePartnerReviewInput,
  userRole?: string
): Promise<IPartnerReview> => {
  if (userRole && userRole !== 'USER') {
    throw new AppError('Only accounts with USER role can submit reviews', 403);
  }

  const product = await Marketplace.findById(input.productId);
  if (!product) {
    throw new AppError('Marketplace product not found', 404);
  }

  // Prevent business partner from reviewing their own product
  if (product.businessOwnerId.toString() === userId) {
    throw new AppError('You cannot review your own product', 400);
  }

  // Check if user already reviewed this product
  const existingReview = await PartnerReview.findOne({
    user: userId,
    product: input.productId,
  });
  if (existingReview) {
    throw new AppError(
      'You have already submitted a review for this product',
      400
    );
  }

  // Find user's order for this product
  const orderFilter: Record<string, any> = {
    user: userId,
    itemId: input.productId,
    itemType: 'MARKETPLACE',
  };
  if (input.orderId) {
    orderFilter._id = input.orderId;
  }

  const order = await Order.findOne(orderFilter).sort({ createdAt: -1 });

  if (!order) {
    throw new AppError(
      'You cannot review this product because you have not claimed or redeemed it',
      403
    );
  }

  // Check redeemed status
  if (order.status !== 'REDEEMED') {
    throw new AppError(
      'You can only submit a review after the product has been redeemed',
      400
    );
  }

  const review: any = await PartnerReview.create({
    user: userId,
    product: input.productId,
    businessPartner: product.businessOwnerId as any,
    order: order._id,
    rating: input.rating,
    experience: input.experience,
    tags: input.tags || [],
    feedback: input.feedback || '',
  });

  // Recalculate business partner rating
  await recalculatePartnerRating(product.businessOwnerId.toString());

  const populatedReview = await PartnerReview.findById(review._id)
    .populate('user', 'name profileImage')
    .populate('product', 'title description photos points location')
    .populate({
      path: 'businessPartner',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    });

  return populatedReview as IPartnerReview;
};

/**
 * Checks if the user is eligible to review a business partner product.
 */
const checkReviewEligibility = async (
  userId: string,
  productId: string,
  userRole?: string
): Promise<PartnerReviewEligibilityResult> => {
  if (userRole && userRole !== 'USER') {
    return {
      canReview: false,
      message: 'Only accounts with USER role can review business partners',
      isClaimed: false,
      isRedeemed: false,
      hasReviewed: false,
    };
  }

  const product = await Marketplace.findById(productId);
  if (!product) {
    throw new AppError('Marketplace product not found', 404);
  }

  if (product.businessOwnerId.toString() === userId) {
    return {
      canReview: false,
      message: 'You are the owner of this product',
      isClaimed: false,
      isRedeemed: false,
      hasReviewed: false,
    };
  }

  const existingReview = await PartnerReview.findOne({
    user: userId,
    product: productId,
  });
  if (existingReview) {
    return {
      canReview: false,
      message: 'You have already submitted a review for this product',
      isClaimed: true,
      isRedeemed: true,
      hasReviewed: true,
      existingReview,
    };
  }

  const order = await Order.findOne({
    user: userId,
    itemId: productId,
    itemType: 'MARKETPLACE',
  }).sort({ createdAt: -1 });

  if (!order) {
    return {
      canReview: false,
      message: 'You must claim and redeem this product to review it',
      isClaimed: false,
      isRedeemed: false,
      hasReviewed: false,
    };
  }

  if (order.status !== 'REDEEMED') {
    return {
      canReview: false,
      message:
        'Review will become available once the product is redeemed at the partner store',
      isClaimed: true,
      isRedeemed: false,
      hasReviewed: false,
    };
  }

  return {
    canReview: true,
    message: 'You are eligible to review this business partner and product',
    isClaimed: true,
    isRedeemed: true,
    hasReviewed: false,
  };
};

/**
 * Computes statistical metrics for reviews matching a filter.
 */
const getReviewStats = async (
  matchFilter: Record<string, any>
): Promise<PartnerReviewStats> => {
  const [generalStats, tagStats] = await Promise.all([
    PartnerReview.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
          positiveCount: {
            $sum: { $cond: [{ $eq: ['$experience', 'POSITIVE'] }, 1, 0] },
          },
          negativeCount: {
            $sum: { $cond: [{ $eq: ['$experience', 'NEGATIVE'] }, 1, 0] },
          },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        },
      },
    ]),
    PartnerReview.aggregate([
      { $match: matchFilter },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const summary = generalStats[0] || {};
  const totalReviews = summary.totalCount || 0;
  const averageRating =
    totalReviews > 0 ? Math.round(summary.avgRating * 10) / 10 : 0;

  return {
    averageRating,
    totalReviews,
    positiveCount: summary.positiveCount || 0,
    negativeCount: summary.negativeCount || 0,
    starBreakdown: {
      1: summary.star1 || 0,
      2: summary.star2 || 0,
      3: summary.star3 || 0,
      4: summary.star4 || 0,
      5: summary.star5 || 0,
    },
    popularTags: tagStats.map((t) => ({ tag: t._id, count: t.count })),
  };
};

/**
 * Retrieves paginated reviews for a specific marketplace product.
 */
const getProductReviews = async (
  productId: string,
  query: PartnerReviewQuery
) => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = parseInt(query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const productObjectId = new Types.ObjectId(productId);
  const filter: Record<string, any> = { product: productObjectId };

  if (query.experience) {
    filter.experience = query.experience;
  }
  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  const [reviews, total, stats] = await Promise.all([
    PartnerReview.find(filter)
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PartnerReview.countDocuments(filter),
    getReviewStats({ product: productObjectId }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit) || 1,
    },
    stats,
    data: reviews,
  };
};

/**
 * Retrieves paginated reviews for a business partner across all products.
 */
const getPartnerReviews = async (
  partnerId: string,
  query: PartnerReviewQuery
) => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = parseInt(query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const partnerObjectId = new Types.ObjectId(partnerId);
  const filter: Record<string, any> = { businessPartner: partnerObjectId };

  if (query.experience) {
    filter.experience = query.experience;
  }
  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  const [reviews, total, stats] = await Promise.all([
    PartnerReview.find(filter)
      .populate('user', 'name profileImage')
      .populate('product', 'title description photos points location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PartnerReview.countDocuments(filter),
    getReviewStats({ businessPartner: partnerObjectId }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit) || 1,
    },
    stats,
    data: reviews,
  };
};

/**
 * Retrieves reviews written by the authenticated user.
 */
const getMyReviews = async (userId: string, query: PartnerReviewQuery) => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = parseInt(query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const userObjectId = new Types.ObjectId(userId);
  const filter: Record<string, any> = { user: userObjectId };

  const [reviews, total] = await Promise.all([
    PartnerReview.find(filter)
      .populate('product', 'title description photos points location')
      .populate({
        path: 'businessPartner',
        select: 'name profileImage',
        populate: { path: 'businessProfile', select: 'businessName' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PartnerReview.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit) || 1,
    },
    data: reviews,
  };
};

/**
 * Retrieves a single review by ID.
 */
const getReviewById = async (reviewId: string): Promise<IPartnerReview> => {
  const review = await PartnerReview.findById(reviewId)
    .populate('user', 'name profileImage')
    .populate('product', 'title description photos points location')
    .populate({
      path: 'businessPartner',
      select: 'name profileImage',
      populate: { path: 'businessProfile', select: 'businessName' },
    });

  if (!review) {
    throw new AppError('Partner review not found', 404);
  }

  return review;
};

/**
 * Deletes a review and recalculates the partner's overall rating.
 */
const deleteReview = async (
  reviewId: string,
  userId: string,
  userRole?: string
): Promise<void> => {
  const review = await PartnerReview.findById(reviewId);
  if (!review) {
    throw new AppError('Partner review not found', 404);
  }

  if (review.user.toString() !== userId && userRole !== 'ADMIN') {
    throw new AppError('Not authorized to delete this review', 403);
  }

  const partnerId = review.businessPartner.toString();
  await PartnerReview.findByIdAndDelete(reviewId);

  await recalculatePartnerRating(partnerId);
};

export const PartnerReviewService = {
  createReview,
  checkReviewEligibility,
  getProductReviews,
  getPartnerReviews,
  getMyReviews,
  getReviewById,
  deleteReview,
  recalculatePartnerRating,
};
