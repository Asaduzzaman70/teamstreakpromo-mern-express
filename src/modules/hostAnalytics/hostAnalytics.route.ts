import { Router } from 'express';
import { HostAnalyticsController } from './hostAnalytics.controller.js';
import {
  getHostAnalyticsQuerySchema,
  getHostOverviewQuerySchema,
  getHostChartQuerySchema,
} from './hostAnalytics.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// Host and Admin analytics endpoints
router.use(protect);
router.use(authorizeRoles('HOST', 'ADMIN'));

router.get(
  '/',
  validateRequest(getHostAnalyticsQuerySchema),
  HostAnalyticsController.getHostAnalytics
);

router.get(
  '/overview',
  validateRequest(getHostOverviewQuerySchema),
  HostAnalyticsController.getHostOverview
);

router.get(
  '/revenue',
  validateRequest(getHostChartQuerySchema),
  HostAnalyticsController.getHostRevenueChart
);

router.get(
  '/ticket-sales',
  validateRequest(getHostChartQuerySchema),
  HostAnalyticsController.getHostTicketSalesChart
);

export const hostAnalyticsRoutes = router;
export default router;
