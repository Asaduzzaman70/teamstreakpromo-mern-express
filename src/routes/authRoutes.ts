import { Router } from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect as any, getMe);

export default router;
