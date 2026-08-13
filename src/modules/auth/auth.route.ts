import { Router } from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
} from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from './auth.validation.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);

export default router;
