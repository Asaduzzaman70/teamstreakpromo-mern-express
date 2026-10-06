import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  createRewardCategoryService,
  getAllRewardCategoriesService,
  getRewardCategoryByIdService,
  updateRewardCategoryService,
  deleteRewardCategoryService,
  getRewardCategoryStatsService,
} from './rewardCategory.service.js';

// @desc    Create a new reward category
// @route   POST /api/reward-categories
// @access  Private
export const createRewardCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await createRewardCategoryService(req.body);
  sendResponse(res, {
    statusCode: 201,
    message: 'Reward Category created successfully',
    data: result,
  });
});

// @desc    Get all reward categories with optional search and filters
// @route   GET /api/reward-categories
// @access  Public
export const getAllRewardCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { meta, result } = await getAllRewardCategoriesService(req.query);
  sendResponse(res, {
    statusCode: 200,
    message: 'Reward Categories retrieved successfully',
    meta,
    data: result,
  });
});

// @desc    Get reward category details by ID
// @route   GET /api/reward-categories/:id
// @access  Public
export const getRewardCategoryById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await getRewardCategoryByIdService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: 'Reward Category details retrieved successfully',
    data: result,
  });
});

// @desc    Update reward category details
// @route   PATCH /api/reward-categories/:id
// @access  Private
export const updateRewardCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await updateRewardCategoryService(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: 'Reward Category updated successfully',
    data: result,
  });
});

// @desc    Delete a reward category
// @route   DELETE /api/reward-categories/:id
// @access  Private
export const deleteRewardCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await deleteRewardCategoryService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
  });
});

// @desc    Get reward category statistics
// @route   GET /api/reward-categories/stats
// @access  Public
export const getRewardCategoryStats = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const result = await getRewardCategoryStatsService();
  sendResponse(res, {
    statusCode: 200,
    message: 'Reward Category stats retrieved successfully',
    data: result,
  });
});
