import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  createCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
  deleteCategoryService,
} from './category.service.js';

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private
export const createCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await createCategoryService(req.body);
  sendResponse(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: result,
  });
});

// @desc    Get all categories with optional search and filters
// @route   GET /api/categories
// @access  Public
export const getAllCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { meta, result } = await getAllCategoriesService(req.query);
  sendResponse(res, {
    statusCode: 200,
    message: 'Categories retrieved successfully',
    meta,
    data: result,
  });
});

// @desc    Get category details by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await getCategoryByIdService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: 'Category details retrieved successfully',
    data: result,
  });
});

// @desc    Update category details
// @route   PATCH /api/categories/:id
// @access  Private
export const updateCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await updateCategoryService(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: 'Category updated successfully',
    data: result,
  });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await deleteCategoryService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: result.message,
  });
});
