import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  createMarketplaceService,
  getAllMarketplacesService,
  getMarketplaceByIdService,
  updateMarketplaceService,
  deleteMarketplaceService,
} from './marketplace.service.js';

// @desc    Create a new marketplace item
// @route   POST /api/marketplace
// @access  Private (BUSINESS)
export const createMarketplace = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const businessOwnerId = req.user!.id;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
  const result = await createMarketplaceService(businessOwnerId, req.body, files);
  sendResponse(res, {
    statusCode: 201,
    message: 'Marketplace item created successfully',
    data: result,
  });
});

// @desc    Get all marketplace items with optional search and filters
// @route   GET /api/marketplace
// @access  Public
export const getAllMarketplaces = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { meta, result } = await getAllMarketplacesService(req.query);
  sendResponse(res, {
    statusCode: 200,
    message: 'Marketplace items retrieved successfully',
    meta,
    data: result,
  });
});

// @desc    Get marketplace item details by ID
// @route   GET /api/marketplace/:id
// @access  Public
export const getMarketplaceById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await getMarketplaceByIdService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: 'Marketplace item details retrieved successfully',
    data: result,
  });
});

// @desc    Update marketplace item details
// @route   PATCH /api/marketplace/:id
// @access  Private (BUSINESS)
export const updateMarketplace = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
  const result = await updateMarketplaceService(req.params.id as string, req.body, files);
  sendResponse(res, {
    statusCode: 200,
    message: 'Marketplace item updated successfully',
    data: result,
  });
});

// @desc    Delete a marketplace item
// @route   DELETE /api/marketplace/:id
// @access  Private (BUSINESS)
export const deleteMarketplace = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await deleteMarketplaceService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
  });
});
