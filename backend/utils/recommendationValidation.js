import { z } from 'zod';

export const recentlyViewedSchema = z.object({
  body: z.object({
    restaurantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Restaurant ID').optional(),
    menuItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Menu Item ID').optional(),
    category: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const trackClickSchema = z.object({
  body: z.object({
    itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Item ID'),
    itemType: z.enum(['Restaurant', 'MenuItem']),
    recommendationType: z.string(),
  }),
});
