import { z } from "zod";

export const clientStatusSchema = z.enum(["verified", "unverified"]);
export type ClientStatus = z.infer<typeof clientStatusSchema>;

export const clientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  // Richer attributes — optional/nullable so lean consumers (e.g. the client
  // switcher) and older payloads that only carry id+name still validate.
  email: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(), // ISO date string
  status: clientStatusSchema.optional(),
});
export const clientsResponseSchema = z.array(clientSummarySchema);
export type ClientSummary = z.infer<typeof clientSummarySchema>;
