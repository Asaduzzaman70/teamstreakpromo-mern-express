import { Types } from 'mongoose';
import { Review } from './review.model.js';
import type {
  CreateReviewInput,
  IReview,
  ReviewEligibilityResult,
  ReviewQuery,
  ReviewStats,
} from './review.interface.js';
import { Event } from '../event/event.model.js';
import { EventOrder } from '../eventOrder/eventOrder.model.js';
import { User } from '../auth/auth.model.js';
import { BusinessProfile } from '../businessProfile/businessProfile.model.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';

/**
 * Recalculates and persists the aggregate rating for a host.
 */
const recalculateHostRating = async (hostId: string): Promise<number> => {
  const hostObjectId = new Types.ObjectId(hostId);
  const stats = await Review.aggregate([
    { $match: { host: hostObjectId } },
    {
      $group: {
        _id: '$host',
        avgRating: { $avg: '$rating' },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const avgRating =
    stats.length > 0 && stats[0].avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0;

  await User.findByIdAndUpdate(hostId, { rating: avgRating });
  await BusinessProfile.findOneAndUpdate({ userId: hostObjectId }, { rating: avgRating });

  logger.info(`[ReviewService] Updated rating for host ${hostId}: ${avgRating}`);
  return avgRating;
};

/**
 * Creates a new review for an event and host after verification.
 */
const createReview = async (
  userId: string,
  input: CreateReviewInput,
  userRole?: string
): Promise<IReview> => {
  if (userRole && userRole !== 'USER') {
    throw new AppError('Only accounts with USER role can submit reviews', 403);
  }

  const event = await Event.findById(input.eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Prevent host from reviewing their own event
  if (event.hostId.toString() === userId) {
    throw new AppError('You cannot review your own event', 400);
  }

  // Check if user already reviewed this event
  const existingReview = await Review.findOne({
    user: userId,
    event: input.eventId,
  });
  if (existingReview) {
    throw new AppError('You have already submitted a review for this event', 400);
  }

  // Check if user has booked this event and ticket wasn't cancelled
  const order = await EventOrder.findOne({
    user: userId,
    eventId: input.eventId,
    status: { $ne: 'CANCELLED' },
  }).sort({ createdAt: -1 });

  if (!order) {
    throw new AppError(
      'You cannot review this event because you have not booked a ticket for it',
      403
    );
  }

  // Verify that the event or order is completed
  const isCompleted =
    order.status === 'COMPLETED' ||
    (event.endDate && new Date(event.endDate) <= new Date());

  if (!isCompleted) {
    throw new AppError(
      'You can only submit a review after the event has completed',
      400
    );
  }

  // Auto-mark order as COMPLETED if event has ended
  if (order.status === 'PAID') {
    order.status = 'COMPLETED';
    await order.save();
  }

  const review = await Review.create({
    user: userId,
    event: input.eventId,
    host: event.hostId,
    order: order._id,
    rating: input.rating,
    experience: input.experience,
    tags: input.tags || [],
    feedback: input.feedback || '',
  });

  // Update host's aggregate rating
  await recalculateHostRating(event.hostId.toString());

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'name profileImage')
    .populate('event', 'title placeName startDate endDate images')
    .populate('host', 'name profileImage');

  return populatedReview as IReview;
};

/**
 * Checks if the currently logged-in user is eligible to review an event.
 */
const checkReviewEligibility = async (
  userId: string,
  eventId: string,
  userRole?: string
): Promise<ReviewEligibilityResult> => {
  if (userRole && userRole !== 'USER') {
    return {
      canReview: false,
      message: 'Only accounts with USER role can review events',
      isBooked: false,
      isCompleted: false,
      hasReviewed: false,
    };
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.hostId.toString() === userId) {
    return {
      canReview: false,
      message: 'You are the host of this event',
      isBooked: false,
      isCompleted: false,
      hasReviewed: false,
    };
  }

  const existingReview = await Review.findOne({ user: userId, event: eventId });
  if (existingReview) {
    return {
      canReview: false,
      message: 'You have already submitted a review for this event',
      isBooked: true,
      isCompleted: true,
      hasReviewed: true,
      existingReview,
    };
  }

  const order = await EventOrder.findOne({
    user: userId,
    eventId,
    status: { $ne: 'CANCELLED' },
  }).sort({ createdAt: -1 });

  if (!order) {
    return {
      canReview: false,
      message: 'You must purchase a ticket to review this event',
      isBooked: false,
      isCompleted: false,
      hasReviewed: false,
    };
  }

  const isCompleted =
    order.status === 'COMPLETED' ||
    (event.endDate && new Date(event.endDate) <= new Date());

  if (!isCompleted) {
    return {
      canReview: false,
      message: 'Review will become available once the event is completed',
      isBooked: true,
      isCompleted: false,
      hasReviewed: false,
    };
  }

  return {
    canReview: true,
    message: 'You are eligible to review this event',
    isBooked: true,
    isCompleted: true,
    hasReviewed: false,
  };
};

/**
 * Computes review statistics (average rating, positive/negative, breakdown, tags).
 */
const getReviewStats = async (matchFilter: Record<string, any>): Promise<ReviewStats> => {
  const [generalStats, tagStats] = await Promise.all([
    Review.aggregate([
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
    Review.aggregate([
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
  const averageRating = totalReviews > 0 ? Math.round(summary.avgRating * 10) / 10 : 0;

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
 * Retrieves paginated reviews for a specific event with statistical breakdown.
 */
const getEventReviews = async (eventId: string, query: ReviewQuery) => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = parseInt(query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const eventObjectId = new Types.ObjectId(eventId);
  const filter: Record<string, any> = { event: eventObjectId };

  if (query.experience) {
    filter.experience = query.experience;
  }
  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  const [reviews, total, stats] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
    getReviewStats({ event: eventObjectId }),
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
 * Retrieves paginated reviews for a specific host across all events.
 */
const getHostReviews = async (hostId: string, query: ReviewQuery) => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = parseInt(query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const hostObjectId = new Types.ObjectId(hostId);
  const filter: Record<string, any> = { host: hostObjectId };

  if (query.experience) {
    filter.experience = query.experience;
  }
  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  const [reviews, total, stats] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name profileImage')
      .populate('event', 'title images startDate endDate placeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
    getReviewStats({ host: hostObjectId }),
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
 * Retrieves paginated reviews written by the authenticated user.
 */
const getMyReviews = async (userId: string, query: ReviewQuery) => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = parseInt(query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const userObjectId = new Types.ObjectId(userId);
  const filter: Record<string, any> = { user: userObjectId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('event', 'title images startDate endDate placeName')
      .populate({
        path: 'host',
        select: 'name profileImage',
        populate: { path: 'businessProfile', select: 'businessName' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
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
 * Retrieves a single review by its ID.
 */
const getReviewById = async (reviewId: string): Promise<IReview> => {
  const review = await Review.findById(reviewId)
    .populate('user', 'name profileImage')
    .populate('event', 'title images startDate endDate placeName')
    .populate('host', 'name profileImage');

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  return review;
};

/**
 * Deletes a review and updates the host's overall rating.
 */
const deleteReview = async (
  reviewId: string,
  userId: string,
  userRole: string
): Promise<void> => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.user.toString() !== userId && userRole !== 'ADMIN') {
    throw new AppError('Not authorized to delete this review', 403);
  }

  const hostId = review.host.toString();
  await Review.findByIdAndDelete(reviewId);

  // Recalculate rating
  await recalculateHostRating(hostId);
};

export const ReviewService = {
  createReview,
  checkReviewEligibility,
  getEventReviews,
  getHostReviews,
  getMyReviews,
  getReviewById,
  deleteReview,
  recalculateHostRating,
};
