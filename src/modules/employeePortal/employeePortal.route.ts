import { Router } from 'express';
import {
  scanHostEmployeeTicket,
  getHostEmployeeScannedTickets,
  getHostEmployeeScannedTicketById,
  getBusinessEmployeeRewards,
  getBusinessEmployeeRewardById,
  getBusinessEmployeeOrders,
  getBusinessEmployeeOrderById,
} from './employeePortal.controller.js';
import { employeeScanTicketSchema } from './employeePortal.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router.use(protect, authorizeRoles('EMPLOYEE'));

// ============================================================================
// 1. HOST EMPLOYEE ROUTES (employerType: 'HOST')
// ============================================================================
router.post(
  '/host/scan-ticket',
  validateRequest(employeeScanTicketSchema),
  scanHostEmployeeTicket
);

router.patch('/host/scan-ticket/:id', scanHostEmployeeTicket);

router.get('/host/scanned-tickets', getHostEmployeeScannedTickets);

router.get('/host/scanned-tickets/:id', getHostEmployeeScannedTicketById);

// ============================================================================
// 2. BUSINESS PARTNER EMPLOYEE ROUTES (employerType: 'BUSINESS' — Read-Only)
// ============================================================================
router.get('/business/rewards', getBusinessEmployeeRewards);

router.get('/business/rewards/:id', getBusinessEmployeeRewardById);

router.get('/business/orders', getBusinessEmployeeOrders);

router.get('/business/orders/:id', getBusinessEmployeeOrderById);

export default router;

