import { Router } from 'express';
import { PaymentController } from './payment.controller.js';

const router = Router();

router.post('/create-checkout-session', PaymentController.createCheckoutSession);

export const paymentRoutes = router;
