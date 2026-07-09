import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
    gateway: z.enum(['stripe', 'razorpay', 'wallet', 'cod'], {
      required_error: 'Please specify payment gateway method',
    }),
  }),
});

export const verifyRazorpaySchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay Signature is required'),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Payment ID'),
    amount: z.coerce.number().min(1).optional(),
  }),
});
