import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AppError } from '../../utils/AppError.js';
import {
  createTicketService,
  getMyTicketsService,
  getTicketByIdService,
  getTicketMessagesService,
  sendTicketMessageService,
  adminGetAllTicketsService,
  adminUpdateTicketStatusService,
} from './customerSupport.service.js';

// @desc    Submit a new customer support ticket
// @route   POST /api/customer-support/tickets
// @access  Private (USER, HOST, BUSINESS, ADMIN)
export const createTicket = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const ticket = await createTicketService(req.user.id, req.body);
    sendResponse(res, {
      statusCode: 201,
      message: 'Support ticket submitted successfully',
      data: ticket,
    });
  }
);

// @desc    Get logged-in user's support tickets ("My Support")
// @route   GET /api/customer-support/my-tickets
// @access  Private (USER, HOST, BUSINESS, ADMIN)
export const getMyTickets = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const { meta, result } = await getMyTicketsService(req.user.id, req.query);
    sendResponse(res, {
      statusCode: 200,
      message: 'My support tickets retrieved successfully',
      meta,
      data: result,
    });
  }
);

// @desc    Get single support ticket details and conversation thread
// @route   GET /api/customer-support/tickets/:id
// @access  Private (USER, HOST, BUSINESS, ADMIN)
export const getTicketById = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const ticketId = String(req.params.id || '');
    const ticket = await getTicketByIdService(
      ticketId,
      req.user.id,
      req.user.role || ''
    );
    sendResponse(res, {
      statusCode: 200,
      message: 'Support ticket retrieved successfully',
      data: ticket,
    });
  }
);

// @desc    Get messages only for a support ticket
// @route   GET /api/customer-support/tickets/:id/messages
// @access  Private (USER, HOST, BUSINESS, ADMIN)
export const getTicketMessages = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const ticketId = String(req.params.id || '');
    const result = await getTicketMessagesService(
      ticketId,
      req.user.id,
      req.user.role || ''
    );
    sendResponse(res, {
      statusCode: 200,
      message: 'Ticket messages retrieved successfully',
      data: result,
    });
  }
);

// @desc    Send a message/reply in a support ticket thread
// @route   POST /api/customer-support/tickets/:id/messages
// @access  Private (USER, HOST, BUSINESS, ADMIN)
export const sendTicketMessage = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
      throw new AppError('Not authorized', 401);
    }

    const ticketId = String(req.params.id || '');
    const result = await sendTicketMessageService(
      ticketId,
      req.user.id,
      req.body
    );
    sendResponse(res, {
      statusCode: 200,
      message: 'Message sent successfully',
      data: result,
    });
  }
);

// @desc    Admin: Get all support tickets across all users
// @route   GET /api/customer-support/admin/tickets
// @access  Private (ADMIN)
export const adminGetAllTickets = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { meta, result } = await adminGetAllTicketsService(req.query);
    sendResponse(res, {
      statusCode: 200,
      message: 'All customer support tickets retrieved successfully',
      meta,
      data: result,
    });
  }
);

// @desc    Admin: Update ticket status ('UNDER_REVIEW', 'SOLVED', 'CLOSED')
// @route   PATCH /api/customer-support/admin/tickets/:id/status
// @access  Private (ADMIN)
export const adminUpdateTicketStatus = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const ticketId = String(req.params.id || '');
    const ticket = await adminUpdateTicketStatusService(
      ticketId,
      req.body.status
    );
    sendResponse(res, {
      statusCode: 200,
      message: 'Support ticket status updated successfully',
      data: ticket,
    });
  }
);
