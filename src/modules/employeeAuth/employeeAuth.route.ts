import { Router } from 'express';
import {
  loginEmployee,
  refreshEmployeeToken,
  getEmployeeMe,
  changeEmployeePassword,
  logoutEmployee,
} from './employeeAuth.controller.js';
import {
  employeeLoginSchema,
  employeeRefreshTokenSchema,
  employeeChangePasswordSchema,
} from './employeeAuth.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { authRateLimiter } from '../../middlewares/security.middleware.js';

const router = Router();

router.post(
  '/login',
  authRateLimiter,
  validateRequest(employeeLoginSchema),
  loginEmployee
);

router.post(
  '/refresh-token',
  authRateLimiter,
  validateRequest(employeeRefreshTokenSchema),
  refreshEmployeeToken
);

router.get('/me', protect, authorizeRoles('EMPLOYEE'), getEmployeeMe);

router.patch(
  '/change-password',
  protect,
  authorizeRoles('EMPLOYEE'),
  validateRequest(employeeChangePasswordSchema),
  changeEmployeePassword
);

router.post('/logout', protect, authorizeRoles('EMPLOYEE'), logoutEmployee);

export default router;

