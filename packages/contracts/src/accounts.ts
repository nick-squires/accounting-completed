import { z } from "zod";

export const accountsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

export const accountSchema = z.object({
  code: z.number(),
  name: z.string(),
  type: z.string().nullable(),
  category: z.string().nullable(),
  balance: z.number().finite().nullable(),
  bankAccountType: z.string().nullable(),
  currency: z.string().nullable(),
  status: z.string().nullable(),
});
export type Account = z.infer<typeof accountSchema>;

export const accountsResponseSchema = z.object({ accounts: z.array(accountSchema) });
export type AccountsResponse = z.infer<typeof accountsResponseSchema>;
