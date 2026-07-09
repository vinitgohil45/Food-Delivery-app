import { z } from 'zod';

export const postHistorySchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query is required'),
  }),
});

export const deleteHistorySchema = z.object({
  body: z.object({
    query: z.string().optional(),
  }),
});

export const clickTelemetrySchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query is required'),
    itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Item ID'),
    itemType: z.enum(['Restaurant', 'MenuItem']),
  }),
});

export const voiceTranscriptSchema = z.object({
  body: z.object({
    transcript: z.string().min(1, 'Transcript text is required'),
  }),
});
