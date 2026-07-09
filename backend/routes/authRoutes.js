import { Router } from 'express';
import {
  registerUser,
  verifyOTP,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutUser,
  getCurrentUser,
} from '../controllers/authController.js';
import validate from '../middlewares/validation.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  registerSchema,
  loginSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validationSchemas.js';

const router = Router();

// Public auth endpoints
router.post('/register', validate(registerSchema), registerUser);
router.post('/verify-otp', validate(otpVerifySchema), verifyOTP);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', logoutUser);

// Protected user profile query
router.get('/me', protect, getCurrentUser);

export default router;
