import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/authMiddleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import {
  createContentService,
  upsertContentBySlugService,
  getAllContentsService,
  getContentByIdentifierService,
  updateContentService,
  updateContentStatusService,
  deleteContentService,
} from './content.service.js';
import type { ContentStatus } from './content.interface.js';

// @desc    Create a new static content / legal page
// @route   POST /api/contents
// @access  Private (ADMIN)
export const createContent = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const result = await createContentService(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Static content page created successfully',
    data: result,
  });
});

// @desc    Upsert a static content / legal page by slug
// @route   PUT /api/contents/upsert/:slug
// @access  Private (ADMIN)
export const upsertContent = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const slug = req.params.slug as string;
  const { content, isCreated } = await upsertContentBySlugService(slug, userId, req.body);

  sendResponse(res, {
    statusCode: isCreated ? 201 : 200,
    success: true,
    message: isCreated
      ? 'Static content page created successfully'
      : 'Static content page updated successfully',
    data: content,
  });
});

// @desc    Get all static content pages (Public: Published only, Admin: Filterable)
// @route   GET /api/contents
// @access  Public / Admin
export const getAllContents = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const isAdmin = req.user?.role === 'ADMIN';
  const { meta, result } = await getAllContentsService(req.query, isAdmin);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Static content pages retrieved successfully',
    meta,
    data: result,
  });
});

// @desc    Get a single static content page by slug or ObjectId
// @route   GET /api/contents/:idOrSlug
// @access  Public / Admin
export const getContentByIdentifier = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const isAdmin = req.user?.role === 'ADMIN';
  const idOrSlug = req.params.idOrSlug as string;
  const result = await getContentByIdentifierService(idOrSlug, isAdmin);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Static content page retrieved successfully',
    data: result,
  });
});

// @desc    Update a static content page by ID or slug
// @route   PATCH /api/contents/:idOrSlug or PUT /api/contents/:idOrSlug
// @access  Private (ADMIN)
export const updateContent = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const idOrSlug = req.params.idOrSlug as string;
  const result = await updateContentService(idOrSlug, userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Static content page updated successfully',
    data: result,
  });
});

// @desc    Update publication status of a static content page
// @route   PATCH /api/contents/:idOrSlug/status
// @access  Private (ADMIN)
export const updateContentStatus = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const idOrSlug = req.params.idOrSlug as string;
  const status = req.body.status as ContentStatus;
  const result = await updateContentStatusService(idOrSlug, userId, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Static content status updated to '${status}' successfully`,
    data: result,
  });
});

// @desc    Delete a static content page by ID or slug
// @route   DELETE /api/contents/:idOrSlug
// @access  Private (ADMIN)
export const deleteContent = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const idOrSlug = req.params.idOrSlug as string;
  const result = await deleteContentService(idOrSlug);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Static content page deleted successfully',
    data: result,
  });
});
