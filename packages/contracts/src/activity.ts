import { z } from "zod";

export const activityRequestSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const activityItemSchema = z.object({
  id: z.number(),
  when: z.string(), // ISO
  actor: z.string().nullable(),
  action: z.string(),
  detail: z.string().nullable(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const activityResponseSchema = z.object({ items: z.array(activityItemSchema) });
export type ActivityResponse = z.infer<typeof activityResponseSchema>;
