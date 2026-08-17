import { Router } from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  refreshToken,
  logoutUser,
} from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.validation.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { uploadFields } from '../../middlewares/multer.middleware.js';

const router = Router();

const registrationImageFields = uploadFields([
  { name: 'govtIdFrontImage', maxCount: 1 },
  { name: 'govtIdBackImage', maxCount: 1 },
  { name: 'businessLicenseFrontImage', maxCount: 1 },
  { name: 'businessLicenseBackImage', maxCount: 1 },
]);

router.post(
  '/register',
  registrationImageFields,
  validateRequest(registerSchema),
  registerUser
);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/refresh-token', validateRequest(refreshTokenSchema), refreshToken);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);

export default router;
