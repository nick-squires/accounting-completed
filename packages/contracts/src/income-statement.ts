import { z } from "zod";

export const incomeStatementRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().gte(1990).lte(2999),
});
export type IncomeStatementRequest = z.infer<typeof incomeStatementRequestSchema>;

export const incomeStatementYearsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

const amount = z.number().finite(); // reject NaN/Infinity from any float mishap
const months12 = z.array(amount).length(12);
export const bucketedSchema = z.object({ months: months12, total: amount });
export type Bucketed = z.infer<typeof bucketedSchema>;

export const incomeStatementAccountSchema = z.object({
  code: z.number(),
  name: z.string(),
  category: z.string().nullable(),
  months: months12,
  total: amount,
});
export type IncomeStatementAccount = z.infer<typeof incomeStatementAccountSchema>;

export const incomeStatementSectionSchema = z.object({
  key: z.enum(["income", "cogs", "expense"]),
  label: z.string(),
  accounts: z.array(incomeStatementAccountSchema),
  subtotal: bucketedSchema,
});
export type IncomeStatementSection = z.infer<typeof incomeStatementSectionSchema>;

export const incomeStatementSchema = z.object({
  meta: z.object({
    clientId: z.number(),
    year: z.number(),
    generatedAt: z.string(),
  }),
  sections: z.array(incomeStatementSectionSchema),
  grossProfit: bucketedSchema,
  netIncome: bucketedSchema,
  kpis: z.object({
    totalIncome: amount,
    grossProfit: amount,
    totalExpenses: amount,
    netIncome: amount,
  }),
});
export type IncomeStatement = z.infer<typeof incomeStatementSchema>;

export const incomeStatementYearsSchema = z.object({ years: z.array(z.number()) });
export type IncomeStatementYears = z.infer<typeof incomeStatementYearsSchema>;
