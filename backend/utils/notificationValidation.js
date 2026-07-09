import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    email: z.boolean().optional(),
    inApp: z.boolean().optional(),
    push: z.boolean().optional(),
  }),
});

export const markReadSchema = z.object({
  body: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID')).optional(),
  }),
});
