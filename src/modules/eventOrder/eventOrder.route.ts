import { Router } from 'express';
import { EventOrderController } from './eventOrder.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/my-orders', EventOrderController.getMyEventOrders);
router.get('/:id', EventOrderController.getEventOrderById);

export const eventOrderRoutes = router;
