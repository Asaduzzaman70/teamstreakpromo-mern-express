import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import { EventOrderService } from './eventOrder.service.js';

const getMyEventOrders = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const result = await EventOrderService.getMyEventOrders(req.user.id, req.query);

    sendResponse(res, {
      statusCode: 200,
      message: 'My event orders retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }
);

const getEventOrderById = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Event order ID is required', 400);
    }
    const orderId = Array.isArray(id) ? id[0] : id;
    if (!orderId) {
      throw new AppError('Event order ID is required', 400);
    }

    const result = await EventOrderService.getEventOrderById(orderId, req.user.id);


    sendResponse(res, {
      statusCode: 200,
      message: 'Event order retrieved successfully',
      data: result,
    });
  }
);


export const EventOrderController = {
  getMyEventOrders,
  getEventOrderById,
};
