import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} from './category.controller.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './category.validation.js';
import { authorizeRoles, protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router
  .route('/')
  .post(protect, authorizeRoles("ADMIN"), validateRequest(createCategorySchema), createCategory)
  .get(getAllCategories);

router.route('/stats').get(getCategoryStats);

router
  .route('/:id')
  .get(getCategoryById)
  .patch(protect, authorizeRoles("ADMIN"), validateRequest(updateCategorySchema), updateCategory)
  .delete(protect, authorizeRoles("ADMIN"), deleteCategory);

export default router;
