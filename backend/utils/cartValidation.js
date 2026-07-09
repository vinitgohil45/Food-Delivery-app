import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    menuItem: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Menu Item ID'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    selectedCustomizations: z.array(
      z.object({
        groupName: z.string().min(1),
        optionName: z.string().min(1),
        price: z.coerce.number().min(0),
      })
    ).optional(),
    instructions: z.string().max(200).optional(),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    menuItem: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Menu Item ID'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Coupon code must be at least 2 characters').toUpperCase(),
  }),
});

export const checkoutSchema = z.object({
  body: z.object({
    addressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Address ID'),
    paymentMethod: z.enum(['stripe', 'razorpay', 'wallet', 'cod'], {
      required_error: 'Please choose a payment method',
    }),
    driverTip: z.coerce.number().min(0).optional(),
  }),
});
