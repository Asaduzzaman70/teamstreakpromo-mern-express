import { Router } from 'express';
import {
  createRewardCategory,
  getAllRewardCategories,
  getRewardCategoryById,
  updateRewardCategory,
  deleteRewardCategory,
  getRewardCategoryStats,
} from './rewardCategory.controller.js';
import {
  createRewardCategorySchema,
  updateRewardCategorySchema,
} from './rewardCategory.validation.js';
import { authorizeRoles, protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router
  .route('/')
  .post(protect, authorizeRoles("ADMIN"), validateRequest(createRewardCategorySchema), createRewardCategory)
  .get(getAllRewardCategories);

router.route('/stats').get(getRewardCategoryStats);

router
  .route('/:id')
  .get(getRewardCategoryById)
  .patch(protect, authorizeRoles("ADMIN"), validateRequest(updateRewardCategorySchema), updateRewardCategory)
  .delete(protect, authorizeRoles("ADMIN"), deleteRewardCategory);

export default router;
