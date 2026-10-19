import { Router } from 'express';
import { PartnerReviewController } from './partnerReview.controller.js';
import {
  createPartnerReviewSchema,
  checkPartnerEligibilityParamsSchema,
  getProductReviewsQuerySchema,
  getPartnerReviewsQuerySchema,
  getPartnerReviewByIdParamsSchema,
} from './partnerReview.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// ==========================================
// Authenticated User Routes (USER only)
// ==========================================

// Submit a review for a redeemed business partner product
router.post(
  '/',
  protect,
  authorizeRoles('USER'),
  validateRequest(createPartnerReviewSchema),
  PartnerReviewController.createReview
);

// Check if authenticated user can review a specific product/partner
router.get(
  '/check-eligibility/:productId',
  protect,
  authorizeRoles('USER'),
  validateRequest(checkPartnerEligibilityParamsSchema),
  PartnerReviewController.checkEligibility
);

// Get current user's submitted partner reviews
router.get(
  '/my-reviews',
  protect,
  authorizeRoles('USER'),
  PartnerReviewController.getMyReviews
);

// ==========================================
// Public / Informational Routes
// ==========================================

// Get all reviews for a specific marketplace product
router.get(
  '/product/:productId',
  validateRequest(getProductReviewsQuerySchema),
  PartnerReviewController.getProductReviews
);

// Get all reviews for a business partner across all products
router.get(
  '/partner/:partnerId',
  validateRequest(getPartnerReviewsQuerySchema),
  PartnerReviewController.getPartnerReviews
);

// Get a single review by ID
router.get(
  '/:id',
  validateRequest(getPartnerReviewByIdParamsSchema),
  PartnerReviewController.getReviewById
);

// Delete a review (Author or Admin)
router.delete(
  '/:id',
  protect,
  validateRequest(getPartnerReviewByIdParamsSchema),
  PartnerReviewController.deleteReview
);

export default router;
export { router as partnerReviewRoutes };
