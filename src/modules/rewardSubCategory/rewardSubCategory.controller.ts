import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  createRewardSubCategoryService,
  getAllRewardSubCategoriesService,
  getRewardSubCategoryByIdService,
  updateRewardSubCategoryService,
  deleteRewardSubCategoryService,
} from './rewardSubCategory.service.js';

// @desc    Create a new reward subcategory
// @route   POST /api/reward-subcategories
// @access  Private
export const createRewardSubCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await createRewardSubCategoryService(req.body);
  sendResponse(res, {
    statusCode: 201,
    message: 'Reward Subcategory created successfully',
    data: result,
  });
});

// @desc    Get all reward subcategories with optional search and filters
// @route   GET /api/reward-subcategories
// @access  Public
export const getAllRewardSubCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { meta, result } = await getAllRewardSubCategoriesService(req.query);
  sendResponse(res, {
    statusCode: 200,
    message: 'Reward Subcategories retrieved successfully',
    meta,
    data: result,
  });
});

// @desc    Get reward subcategory details by ID
// @route   GET /api/reward-subcategories/:id
// @access  Public
export const getRewardSubCategoryById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await getRewardSubCategoryByIdService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: 'Reward Subcategory details retrieved successfully',
    data: result,
  });
});

// @desc    Update reward subcategory details
// @route   PATCH /api/reward-subcategories/:id
// @access  Private
export const updateRewardSubCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await updateRewardSubCategoryService(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: 'Reward Subcategory updated successfully',
    data: result,
  });
});

// @desc    Delete a reward subcategory
// @route   DELETE /api/reward-subcategories/:id
// @access  Private
export const deleteRewardSubCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await deleteRewardSubCategoryService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
  });
});
