import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { OrderService } from './order.service.js';

const createOrder = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const result = await OrderService.createOrder(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Order placed successfully',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user?.role;

  // If called by BUSINESS, EMPLOYEE, or HOST, return their organization's reward orders & redemption statuses
  if (role === 'BUSINESS' || role === 'EMPLOYEE' || role === 'HOST') {
    const result = await OrderService.getBusinessOrders(userId, role, req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Business reward orders retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
    return;
  }

  const result = await OrderService.getMyOrders(userId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getBusinessOrders = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const actorId = req.user!.id;
  const actorRole = req.user?.role;

  const result = await OrderService.getBusinessOrders(actorId, actorRole, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business reward orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getOrderById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = await OrderService.getOrderById(userId, id as string, req.user?.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order details retrieved successfully',
    data: result,
  });
});

const redeemOrder = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = await OrderService.redeemOrder(id as string, userId, req.user?.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order redeemed successfully',
    data: result,
  });
});

export const OrderController = {
  createOrder,
  getMyOrders,
  getBusinessOrders,
  getOrderById,
  redeemOrder,
};
