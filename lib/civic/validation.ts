import { z } from 'zod';

import { CIVIC_CATEGORIES } from '@/types/civic';

const categoryIds = CIVIC_CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const civicReportBodySchema = z.object({
  category: z.enum(categoryIds),
  description: z.string().max(250).default(''),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photo_url: z.string().url().optional().nullable(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

/** Voto di validazione: 1 like, -1 dislike, 0 rimuove il voto */
export const voteBodySchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const commentBodySchema = z.object({
  body: z.string().trim().min(1).max(300),
});
