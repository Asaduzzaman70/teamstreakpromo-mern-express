import { Router } from 'express';
import {
  createContent,
  upsertContent,
  getAllContents,
  getContentByIdentifier,
  updateContent,
  updateContentStatus,
  deleteContent,
} from './content.controller.js';
import {
  createContentSchema,
  updateContentSchema,
  upsertContentSchema,
  updateContentStatusSchema,
  getContentQuerySchema,
} from './content.validation.js';
import {
  protect,
  authorizeRoles,
  optionalAuth,
} from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// Public / Client discovery routes (with optional auth to detect Admin users)
router.get('/', optionalAuth, validateRequest(getContentQuerySchema), getAllContents);

// Admin-only creation & upsert routes
router.post(
  '/',
  protect,
  authorizeRoles('ADMIN'),
  validateRequest(createContentSchema),
  createContent
);

router.put(
  '/upsert/:slug',
  protect,
  authorizeRoles('ADMIN'),
  validateRequest(upsertContentSchema),
  upsertContent
);

// Specific status update route
router.patch(
  '/:idOrSlug/status',
  protect,
  authorizeRoles('ADMIN'),
  validateRequest(updateContentStatusSchema),
  updateContentStatus
);

// Individual page access (Public by slug/id, drafts visible to Admin)
router.get('/:idOrSlug', optionalAuth, getContentByIdentifier);

// Update page details (Admin)
router.patch(
  '/:idOrSlug',
  protect,
  authorizeRoles('ADMIN'),
  validateRequest(updateContentSchema),
  updateContent
);

router.put(
  '/:idOrSlug',
  protect,
  authorizeRoles('ADMIN'),
  validateRequest(updateContentSchema),
  updateContent
);

// Delete page (Admin)
router.delete(
  '/:idOrSlug',
  protect,
  authorizeRoles('ADMIN'),
  deleteContent
);

export default router;
