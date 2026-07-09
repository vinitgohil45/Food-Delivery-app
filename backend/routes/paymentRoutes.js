import { Router } from 'express';
import {
  createPaymentOrder,
  verifyRazorpayPayment,
  handleWebhook,
  refundPayment,
  getPaymentById,
} from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import {
  createPaymentOrderSchema,
  verifyRazorpaySchema,
  refundPaymentSchema,
} from '../utils/paymentValidation.js';

const router = Router();

// Webhook is public (Stripe/Razorpay calls it natively)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-order', validate(createPaymentOrderSchema), createPaymentOrder);
router.post('/verify', validate(verifyRazorpaySchema), verifyRazorpayPayment);
router.get('/:id', getPaymentById);

// Admin only refunds
router.post('/refund', restrictTo('admin'), validate(refundPaymentSchema), refundPayment);

export default router;
