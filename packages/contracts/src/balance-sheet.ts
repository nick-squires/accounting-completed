import { z } from "zod";

export const balanceSheetRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().gte(1990).lte(2999),
});
export type BalanceSheetRequest = z.infer<typeof balanceSheetRequestSchema>;

const amount = z.number().finite();

export const balanceSheetAccountSchema = z.object({
  code: z.number(),
  name: z.string(),
  amount,
});
export type BalanceSheetAccount = z.infer<typeof balanceSheetAccountSchema>;

export const balanceSheetGroupSchema = z.object({
  type: z.string(),
  accounts: z.array(balanceSheetAccountSchema),
  subtotal: amount,
});
export type BalanceSheetGroup = z.infer<typeof balanceSheetGroupSchema>;

export const balanceSheetSectionSchema = z.object({
  key: z.enum(["assets", "liabilities", "equity"]),
  label: z.string(),
  groups: z.array(balanceSheetGroupSchema),
  total: amount,
});
export type BalanceSheetSection = z.infer<typeof balanceSheetSectionSchema>;

export const balanceSheetSchema = z.object({
  meta: z.object({
    clientId: z.number(),
    year: z.number(),
    asOf: z.string(), // ISO, exclusive upper bound
    generatedAt: z.string(),
  }),
  sections: z.array(balanceSheetSectionSchema),
  totals: z.object({
    assets: amount,
    liabilities: amount,
    equity: amount,
    liabilitiesAndEquity: amount,
  }),
  balanced: z.boolean(),
});
export type BalanceSheet = z.infer<typeof balanceSheetSchema>;
