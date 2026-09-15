import { Router } from 'express';
import { EventOrderController } from './eventOrder.controller.js';
import { PaymentController } from '../payment/payment.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/my-orders', EventOrderController.getMyEventOrders);
router.get('/:id', EventOrderController.getEventOrderById);
router.post('/:orderId/cancel', PaymentController.cancelEventOrder);

export const eventOrderRoutes = router;
