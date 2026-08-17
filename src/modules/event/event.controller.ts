import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import { createEventService, getAllEventsAdminService, getEventByIdService } from './event.service.js';

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (HOST, BUSINESS, USER, ADMIN)
export const createEvent = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
  const result = await createEventService(req.user.id, req.body, files);

  sendResponse(res, {
    statusCode: 201,
    message: 'Event created successfully',
    data: result,
  });
});

// @desc    Get all events (Event view with pagination max 20 per page)
// @route   GET /api/events
// @access  Private (ADMIN)
export const getAllEventsAdmin = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await getAllEventsAdminService(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: 'Events retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

// @desc    Get single event details by ID
// @route   GET /api/events/:id
// @access  Public / Private
export const getEventById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await getEventByIdService(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    message: 'Event details retrieved successfully',
    data: result,
  });
});
