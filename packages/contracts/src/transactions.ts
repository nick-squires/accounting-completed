import { z } from "zod";

export const transactionsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().gte(1990).lte(2999),
});
export type TransactionsRequest = z.infer<typeof transactionsRequestSchema>;

export const transactionsYearsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

export const transactionStatusSchema = z.enum(["review", "categorized", "excluded"]);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

const amount = z.number().finite();

export const transactionSchema = z.object({
  id: z.number(),
  postedDate: z.string(), // ISO
  payee: z.string().nullable(),
  memo: z.string().nullable(),
  amount,
  category: z.string().nullable(),
  checkNumber: z.string().nullable(),
  account: z.string().nullable(),
  status: transactionStatusSchema,
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionsResponseSchema = z.object({
  meta: z.object({ clientId: z.number(), year: z.number(), generatedAt: z.string() }),
  transactions: z.array(transactionSchema),
});
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;

export const transactionsYearsSchema = z.object({ years: z.array(z.number()) });
export type TransactionsYears = z.infer<typeof transactionsYearsSchema>;
