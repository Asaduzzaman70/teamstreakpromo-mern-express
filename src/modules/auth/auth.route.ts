import { Router } from 'express';
import {
  registerUser,
  verifyRegisterOtp,
  resendForgotPasswordOtp,
  resendActivationOtp,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  logoutUser,
  deleteAccount,
} from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from './auth.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { authRateLimiter } from '../../middlewares/security.middleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { uploadFields } from '../../middlewares/multer.middleware.js';

const router = Router();

const registrationImageFields = uploadFields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'govtIdFrontImage', maxCount: 1 },
  { name: 'govtIdBackImage', maxCount: 1 },
  { name: 'businessLicenseFrontImage', maxCount: 1 },
  { name: 'businessLicenseBackImage', maxCount: 1 },
]);

const profileUploadFields = uploadFields([
  { name: 'profileImage', maxCount: 1 },
]);

router.post(
  '/register',
  authRateLimiter,
  registrationImageFields,
  validateRequest(registerSchema),
  registerUser
);
router.post('/verify-register-otp', authRateLimiter, validateRequest(verifyOtpSchema), verifyRegisterOtp);
router.post('/verify-account', authRateLimiter, validateRequest(verifyOtpSchema), verifyRegisterOtp);
router.post('/resend-activation-otp', authRateLimiter, validateRequest(forgotPasswordSchema), resendActivationOtp);
router.post('/resend-forgot-password-otp', authRateLimiter, validateRequest(forgotPasswordSchema), resendForgotPasswordOtp);
router.post('/login', authRateLimiter, validateRequest(loginSchema), loginUser);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/verify-forgot-password-otp', authRateLimiter, validateRequest(verifyOtpSchema), verifyOtp);
router.post('/verify-otp', authRateLimiter, validateRequest(verifyOtpSchema), verifyOtp);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), resetPassword);
router.post('/change-password', protect, validateRequest(changePasswordSchema), changePassword);
router.post('/refresh-token', validateRequest(refreshTokenSchema), refreshToken);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.patch('/me', protect, profileUploadFields, validateRequest(updateProfileSchema), updateProfile);
router.patch('/profile', protect, profileUploadFields, validateRequest(updateProfileSchema), updateProfile);
router.put('/profile', protect, profileUploadFields, validateRequest(updateProfileSchema), updateProfile);
router.delete(
  '/delete-account',
  protect,
  authorizeRoles('USER', 'HOST', 'BUSINESS', 'ADMIN'),
  validateRequest(deleteAccountSchema),
  deleteAccount
);
router.delete(
  '/me',
  protect,
  authorizeRoles('USER', 'HOST', 'BUSINESS', 'ADMIN'),
  validateRequest(deleteAccountSchema),
  deleteAccount
);

export default router;
