import { z } from 'zod';

export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    cuisine: z.array(z.string()).min(1, 'Please specify at least one cuisine type')
      .or(z.string().transform((val) => val.split(',').map((c) => c.trim()))), // handle comma-separated string
    longitude: z.coerce.number().min(-180).max(180),
    latitude: z.coerce.number().min(-90).max(90),
    formattedAddress: z.string().min(5, 'Address must be descriptive'),
    openHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid open time format (HH:MM)'),
    closeHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid close time format (HH:MM)'),
    deliveryRadiusKm: z.coerce.number().min(1, 'Radius must be at least 1 Km'),
    minOrderValue: z.coerce.number().min(0, 'Minimum order value cannot be negative'),
    deliveryCharge: z.coerce.number().min(0, 'Delivery charge cannot be negative'),
    averagePreparationTimeMin: z.coerce.number().min(5, 'Preparation time must be at least 5 minutes'),
    gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST identification number format'),
    licenseNumber: z.string().min(14, 'FSSAI License must be exactly 14 digits').max(14, 'FSSAI License must be exactly 14 digits'),
  }),
});

export const updateRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    cuisine: z.array(z.string()).min(1).or(z.string().transform((val) => val.split(',').map((c) => c.trim()))).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    formattedAddress: z.string().min(5).optional(),
    openHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    deliveryRadiusKm: z.coerce.number().min(1).optional(),
    minOrderValue: z.coerce.number().min(0).optional(),
    deliveryCharge: z.coerce.number().min(0).optional(),
    averagePreparationTimeMin: z.coerce.number().min(5).optional(),
    gstNumber: z.string().optional(),
    licenseNumber: z.string().min(14).max(14).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive state flag is required' }),
  }),
});
