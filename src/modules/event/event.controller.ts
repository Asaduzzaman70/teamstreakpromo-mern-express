import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import {
  createEventService,
  updateEventService,
  getAllEventsService,
  getAdminEventsService,
  getEventByIdService,
  deleteEventService,
} from './event.service.js';

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

// @desc    Update an event by ID
// @route   PATCH /api/events/:id or PUT /api/events/:id
// @access  Private (Event Owner Host / Admin)
export const updateEvent = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
  const result = await updateEventService(req.params.id as string, req.user.id, req.user.role, req.body, files);

  sendResponse(res, {
    statusCode: 200,
    message: 'Event updated successfully',
    data: result,
  });
});

// @desc    Get all active events (For all users - USER, HOST, BUSINESS, ADMIN)
// @route   GET /api/events
// @access  Private (USER, HOST, BUSINESS, ADMIN)
export const getAllEvents = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const query = {
    ...req.query,
    ...(authReq.user?.id ? { userId: authReq.user.id } : {}),
  };
  const result = await getAllEventsService(query);

  sendResponse(res, {
    statusCode: 200,
    message: 'Events retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

// @desc    Get paginated events for Admin (Filter by hostId, search by title/host, filter by category)
// @route   GET /api/events/admin
// @access  Private (ADMIN)
export const getAdminEvents = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await getAdminEventsService(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: 'Admin events retrieved successfully',
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

// @desc    Delete an event by ID
// @route   DELETE /api/events/:id
// @access  Private (Event Owner Host / Admin)
export const deleteEvent = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new AppError('Not authorized', 401);
  }

  const result = await deleteEventService(req.params.id as string, req.user.id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    message: 'Event deleted successfully',
    data: result,
  });
});

