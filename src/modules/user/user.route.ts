import { Router } from 'express';
import {
  getUserStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} from './user.controller.js';
import {
  getUsersQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from './user.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// All routes in this module are protected and restricted to ADMIN
router.use(protect, authorizeRoles('ADMIN'));

router.get('/stats', getUserStats);
router.get('/', validateRequest(getUsersQuerySchema), getAllUsers);
router.get('/:id', validateRequest(userIdParamSchema), getUserById);
router.patch('/:id/status', validateRequest(updateUserStatusSchema), updateUserStatus);
router.patch('/:id/role', validateRequest(updateUserRoleSchema), updateUserRole);
router.delete('/:id', validateRequest(userIdParamSchema), deleteUser);

export default router;
