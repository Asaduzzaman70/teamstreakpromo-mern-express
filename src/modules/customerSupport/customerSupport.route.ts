import { Router } from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  getTicketMessages,
  sendTicketMessage,
  adminGetAllTickets,
  adminUpdateTicketStatus,
} from './customerSupport.controller.js';
import {
  createSupportTicketSchema,
  sendSupportMessageSchema,
  updateSupportTicketStatusSchema,
  getSupportTicketsQuerySchema,
} from './customerSupport.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// ==========================================
// User Support Routes (USER, HOST, BUSINESS, ADMIN)
// ==========================================

// Submit a new support ticket
router.post(
  '/tickets',
  protect,
  authorizeRoles('USER', 'HOST', 'BUSINESS', 'ADMIN'),
  validateRequest(createSupportTicketSchema),
  createTicket
);

// Get my support tickets list ("My Support" screen)
router.get(
  '/my-tickets',
  protect,
  authorizeRoles('USER', 'HOST', 'BUSINESS', 'ADMIN'),
  validateRequest(getSupportTicketsQuerySchema),
  getMyTickets
);

// Get single support ticket details and chat thread
router.get(
  '/tickets/:id',
  protect,
  authorizeRoles('USER', 'HOST', 'BUSINESS', 'ADMIN'),
  getTicketById
);

// Get messages only for a support ticket
router.get(
  '/tickets/:id/messages',
  protect,
  authorizeRoles('USER', 'HOST', 'BUSINESS', 'ADMIN'),
  getTicketMessages
);

// Send message / reply in support ticket chat
router.post(
  '/tickets/:id/messages',
  protect,
  authorizeRoles('USER', 'HOST', 'BUSINESS', 'ADMIN'),
  validateRequest(sendSupportMessageSchema),
  sendTicketMessage
);

// ==========================================
// Admin / Customer Care Routes (ADMIN)
// ==========================================

// Admin: Get all tickets across all users
router.get(
  '/admin/tickets',
  protect,
  authorizeRoles('ADMIN'),
  validateRequest(getSupportTicketsQuerySchema),
  adminGetAllTickets
);

// Admin: Update ticket status ('UNDER_REVIEW', 'SOLVED', 'CLOSED')
router.patch(
  '/admin/tickets/:id/status',
  protect,
  authorizeRoles('ADMIN'),
  validateRequest(updateSupportTicketStatusSchema),
  adminUpdateTicketStatus
);

export default router;
export { router as customerSupportRoutes };
