import { Router } from 'express';
import {
  createEmployee,
  getEmployerEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from './employee.controller.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router
  .route('/')
  .post(
    protect,
    authorizeRoles('HOST', 'BUSINESS'),
    validateRequest(createEmployeeSchema),
    createEmployee
  )
  .get(protect, authorizeRoles('HOST', 'BUSINESS'), getEmployerEmployees);

router
  .route('/:id')
  .get(protect, authorizeRoles('HOST', 'BUSINESS'), getEmployeeById)
  .patch(
    protect,
    authorizeRoles('HOST', 'BUSINESS'),
    validateRequest(updateEmployeeSchema),
    updateEmployee
  )
  .delete(protect, authorizeRoles('HOST', 'BUSINESS'), deleteEmployee);

export default router;
