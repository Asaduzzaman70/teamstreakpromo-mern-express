import { Router } from 'express';
import { EventOrderController } from './eventOrder.controller.js';
import { EventOrderValidation } from './eventOrder.validation.js';
import { PaymentController } from '../payment/payment.controller.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router.use(protect);

// Scan & check-in event ticket via QR payload / ticketId / orderId in request body
router.post(
  '/scan',
  authorizeRoles('HOST', 'BUSINESS', 'EMPLOYEE', 'ADMIN'),
  validateRequest(EventOrderValidation.scanEventTicketZodSchema),
  EventOrderController.scanEventTicket
);

// Dashboard list of scanned tickets (Host Employee sees ONLY tickets they personally scanned)
router.get(
  '/scanned-tickets',
  authorizeRoles('EMPLOYEE', 'HOST', 'BUSINESS', 'ADMIN'),
  EventOrderController.getScannedEventTickets
);

router.get('/my-orders', EventOrderController.getMyEventOrders);
router.get('/:id', EventOrderController.getEventOrderById);

// Scan & check-in event ticket by passing orderId or ticketId in URL params
router.patch(
  '/:id/scan',
  authorizeRoles('HOST', 'BUSINESS', 'EMPLOYEE', 'ADMIN'),
  EventOrderController.scanEventTicket
);

router.post('/:orderId/cancel', PaymentController.cancelEventOrder);

export const eventOrderRoutes = router;
