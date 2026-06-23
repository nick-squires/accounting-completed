import { z } from "zod";
export const clientSummarySchema = z.object({ id: z.string(), name: z.string() });
export const clientsResponseSchema = z.array(clientSummarySchema);
export type ClientSummary = z.infer<typeof clientSummarySchema>;
