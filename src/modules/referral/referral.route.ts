import { Router } from 'express';
import {
  getMyHostPoints,
  getEventReferralDetails,
  getMyReferrals,
} from './referral.controller.js';
import { getEventReferralParamsSchema } from './referral.validation.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// Retrieve all host point balances for the authenticated user
router.get('/my-points', protect, getMyHostPoints);

// Retrieve referral history for the authenticated user
router.get('/my-referrals', protect, getMyReferrals);

// Retrieve referral code, shareable link, and current host points for a specific event
router.get(
  '/event/:eventId',
  protect,
  validateRequest(getEventReferralParamsSchema),
  getEventReferralDetails
);

export default router;

