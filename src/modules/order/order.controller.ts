import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { OrderService } from './order.service.js';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore - Assuming req.user is set by auth middleware
  const userId = req.user._id;
  
  const result = await OrderService.createOrder(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Order placed successfully',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore - Assuming req.user is set by auth middleware
  const userId = req.user._id;
  
  const result = await OrderService.getMyOrders(userId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const OrderController = {
  createOrder,
  getMyOrders,
};
