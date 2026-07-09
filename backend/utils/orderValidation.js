import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'placed',
      'accepted',
      'preparing',
      'prepared',
      'picked_up',
      'on_the_way',
      'delivered',
      'cancelled',
    ], { required_error: 'Order status flag is required' }),
    note: z.string().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(4, 'Reason must be at least 4 characters'),
  }),
});

export const assignDriverSchema = z.object({
  body: z.object({
    deliveryPartnerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Delivery Partner ID'),
  }),
});

export const rateOrderSchema = z.object({
  body: z.object({
    rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    review: z.string().optional(),
  }),
});

export const reorderSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
  }),
});
