import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import {
  createReviewSchema,
  checkEligibilityParamsSchema,
  getEventReviewsQuerySchema,
  getHostReviewsQuerySchema,
  getReviewByIdParamsSchema,
} from './review.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// ==========================================
// Authenticated User Routes
// ==========================================

// Submit a review for a completed event
router.post(
  '/',
  protect,
  authorizeRoles('USER'),
  validateRequest(createReviewSchema),
  ReviewController.createReview
);

// Check if authenticated user can review a specific event
router.get(
  '/check-eligibility/:eventId',
  protect,
  authorizeRoles('USER'),
  validateRequest(checkEligibilityParamsSchema),
  ReviewController.checkEligibility
);

// Get current user's submitted reviews
router.get(
  '/my-reviews',
  protect,
  authorizeRoles('USER'),
  ReviewController.getMyReviews
);

// ==========================================
// Public / Informational Routes
// ==========================================

// Get all reviews for a specific event with breakdown and popular tags
router.get(
  '/event/:eventId',
  validateRequest(getEventReviewsQuerySchema),
  ReviewController.getEventReviews
);

// Get all reviews for a specific host across all events
router.get(
  '/host/:hostId',
  validateRequest(getHostReviewsQuerySchema),
  ReviewController.getHostReviews
);

// Get a single review by ID
router.get(
  '/:id',
  validateRequest(getReviewByIdParamsSchema),
  ReviewController.getReviewById
);

// Delete a review (Author or Admin)
router.delete(
  '/:id',
  protect,
  validateRequest(getReviewByIdParamsSchema),
  ReviewController.deleteReview
);

export default router;
export { router as reviewRoutes };
