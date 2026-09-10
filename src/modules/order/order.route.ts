import express from 'express';
import { OrderController } from './order.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { OrderValidation } from './order.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

router.post(
  '/',
  authorizeRoles('USER'),
  validateRequest(OrderValidation.createOrderZodSchema),
  OrderController.createOrder
);

router.get(
  '/my-orders',
  authorizeRoles('USER'),
  OrderController.getMyOrders
);

router.get(
  '/:id',
  authorizeRoles('USER', 'ADMIN'),
  OrderController.getOrderById
);

export const orderRoutes = router;
