import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    restaurant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Restaurant ID'),
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional(),
    sequenceOrder: z.coerce.number().min(0).optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    sequenceOrder: z.coerce.number().min(0).optional(),
  }),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    restaurant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Restaurant ID'),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
    name: z.string().min(2, 'Item name must be at least 2 characters'),
    description: z.string().max(300).optional(),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
    isVeg: z.coerce.boolean(),
    isJain: z.coerce.boolean().optional(),
    spicyLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
    averagePreparationTimeMin: z.coerce.number().min(1).optional(),
    ingredients: z.array(z.string()).optional()
      .or(z.string().transform((val) => val.split(',').map((c) => c.trim()))).optional(),
    calories: z.coerce.number().min(0).optional(),
    proteinGrams: z.coerce.number().min(0).optional(),
    carbsGrams: z.coerce.number().min(0).optional(),
    fatsGrams: z.coerce.number().min(0).optional(),
    customizationGroups: z.array(z.object({
      name: z.string().min(1),
      minSelection: z.coerce.number().min(0),
      maxSelection: z.coerce.number().min(1),
      options: z.array(z.object({
        name: z.string().min(1),
        price: z.coerce.number().min(0),
      })),
    })).optional(),
    inventoryCount: z.coerce.number().min(0).optional(),
    isAvailable: z.coerce.boolean().optional(),
  }),
});

export const updateMenuItemSchema = z.object({
  body: z.object({
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    name: z.string().min(2).optional(),
    description: z.string().max(300).optional(),
    price: z.coerce.number().min(0).optional(),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
    isVeg: z.coerce.boolean().optional(),
    isJain: z.coerce.boolean().optional(),
    spicyLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
    averagePreparationTimeMin: z.coerce.number().min(1).optional(),
    ingredients: z.array(z.string()).optional()
      .or(z.string().transform((val) => val.split(',').map((c) => c.trim()))).optional(),
    calories: z.coerce.number().min(0).optional(),
    proteinGrams: z.coerce.number().min(0).optional(),
    carbsGrams: z.coerce.number().min(0).optional(),
    fatsGrams: z.coerce.number().min(0).optional(),
    customizationGroups: z.array(z.object({
      name: z.string().min(1),
      minSelection: z.coerce.number().min(0),
      maxSelection: z.coerce.number().min(1),
      options: z.array(z.object({
        name: z.string().min(1),
        price: z.coerce.number().min(0),
      })),
    })).optional(),
    inventoryCount: z.coerce.number().min(0).optional(),
    isAvailable: z.coerce.boolean().optional(),
  }),
});

export const updateItemStatusSchema = z.object({
  body: z.object({
    isAvailable: z.boolean({ required_error: 'isAvailable flag is required' }),
  }),
});

export const updateItemInventorySchema = z.object({
  body: z.object({
    inventoryCount: z.number({ required_error: 'inventoryCount number is required' }).min(0),
  }),
});
