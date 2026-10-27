import { Router } from 'express';
import { BusinessPartnerAnalyticsController } from './businessPartnerAnalytics.controller.js';
import {
  getBusinessPartnerAnalyticsQuerySchema,
  getBusinessPartnerOverviewQuerySchema,
  getRewardSellChartQuerySchema,
} from './businessPartnerAnalytics.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// Business Partner and Admin analytics endpoints
router.use(protect);
router.use(authorizeRoles('BUSINESS', 'ADMIN'));

router.get(
  '/',
  validateRequest(getBusinessPartnerAnalyticsQuerySchema),
  BusinessPartnerAnalyticsController.getBusinessPartnerAnalytics
);

router.get(
  '/overview',
  validateRequest(getBusinessPartnerOverviewQuerySchema),
  BusinessPartnerAnalyticsController.getBusinessPartnerOverview
);

router.get(
  '/reward-sells',
  validateRequest(getRewardSellChartQuerySchema),
  BusinessPartnerAnalyticsController.getRewardSellChart
);

export const businessPartnerAnalyticsRoutes = router;
export default router;
