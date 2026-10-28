import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  scanHostEmployeeTicketService,
  getHostEmployeeScannedTicketsService,
  getHostEmployeeScannedTicketByIdService,
  getBusinessEmployeeRewardsService,
  getBusinessEmployeeRewardByIdService,
  getBusinessEmployeeOrdersService,
  getBusinessEmployeeOrderByIdService,
} from './employeePortal.service.js';

// ============================================================================
// 1. HOST EMPLOYEE — TICKET SCANNER & SCANNED TICKETS DASHBOARD
// ============================================================================

export const scanHostEmployeeTicket = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const rawParamId = req.params.id;
    const paramIdentifier = Array.isArray(rawParamId) ? rawParamId[0] : rawParamId;

    const result = await scanHostEmployeeTicketService(
      employeeId,
      req.body,
      paramIdentifier
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'This Ticket is Valid.',
      data: result,
    });
  }
);

export const getHostEmployeeScannedTickets = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const result = await getHostEmployeeScannedTicketsService(employeeId, req.query);

    sendResponse(res, {
      statusCode: 200,
      message: 'Scanned event tickets retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }
);

export const getHostEmployeeScannedTicketById = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const id = req.params.id as string;

    const result = await getHostEmployeeScannedTicketByIdService(employeeId, id);

    sendResponse(res, {
      statusCode: 200,
      message: 'Scanned ticket details retrieved successfully',
      data: result,
    });
  }
);

// ============================================================================
// 2. BUSINESS PARTNER EMPLOYEE — REWARDS & ORDER REDEMPTION STATUS (READ-ONLY)
// ============================================================================

export const getBusinessEmployeeRewards = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const { meta, result } = await getBusinessEmployeeRewardsService(
      employeeId,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Business Partner rewards retrieved successfully',
      meta,
      data: result,
    });
  }
);

export const getBusinessEmployeeRewardById = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const id = req.params.id as string;

    const result = await getBusinessEmployeeRewardByIdService(employeeId, id);

    sendResponse(res, {
      statusCode: 200,
      message: 'Business Partner reward details retrieved successfully',
      data: result,
    });
  }
);

export const getBusinessEmployeeOrders = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const result = await getBusinessEmployeeOrdersService(employeeId, req.query);

    sendResponse(res, {
      statusCode: 200,
      message: 'Business Partner reward orders retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }
);

export const getBusinessEmployeeOrderById = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const employeeId = req.user!.id;
    const id = req.params.id as string;

    const result = await getBusinessEmployeeOrderByIdService(employeeId, id);

    sendResponse(res, {
      statusCode: 200,
      message: 'Business Partner reward order details retrieved successfully',
      data: result,
    });
  }
);

