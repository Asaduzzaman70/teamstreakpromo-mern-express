import { Router } from 'express';
import {
  createRewardSubCategory,
  getAllRewardSubCategories,
  getRewardSubCategoryById,
  updateRewardSubCategory,
  deleteRewardSubCategory,
} from './rewardSubCategory.controller.js';
import {
  createRewardSubCategorySchema,
  updateRewardSubCategorySchema,
} from './rewardSubCategory.validation.js';
import { authorizeRoles, protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router
  .route('/')
  .post(protect, authorizeRoles("ADMIN"), validateRequest(createRewardSubCategorySchema), createRewardSubCategory)
  .get(getAllRewardSubCategories);

router
  .route('/:id')
  .get(getRewardSubCategoryById)
  .patch(protect, authorizeRoles("ADMIN"), validateRequest(updateRewardSubCategorySchema), updateRewardSubCategory)
  .delete(protect, authorizeRoles("ADMIN"), deleteRewardSubCategory);

export default router;
