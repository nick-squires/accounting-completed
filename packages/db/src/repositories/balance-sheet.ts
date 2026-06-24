import { prisma } from "../client";

export interface BsAccountBalance {
  code: number;
  name: string;
  type: string; // trimmed Account_Type
  sum: number;  // raw Σ Amount (service applies sign)
}

const ASSET_TYPES = ["BankingAccount", "Current Assets", "Fixed Assets", "Other Assets"];
const LIAB_TYPES = ["Credit Card/Loan", "Current Liabilities", "Long Term Liabilities"];
const EQUITY_TYPES = ["Equity"];
const BS_TYPES = [...ASSET_TYPES, ...LIAB_TYPES, ...EQUITY_TYPES];
const PL_TYPES = ["Income", "Cost of Goods Sold", "Expense", "Other Income", "Other Expense"];

export const balanceSheetRepository = {
  // Per-account raw sum of active txns posted before asOf, for balance-sheet accounts.
  async accountBalances(userId: number, asOf: Date): Promise<BsAccountBalance[]> {
    const accounts = await prisma.accounts.findMany({
      where: { UserId: userId, Account_Type: { in: BS_TYPES } },
      select: { Account_Code: true, Account_Name: true, Account_Type: true },
    });
    if (accounts.length === 0) return [];
    const meta = new Map(accounts.map((a) => [a.Account_Code, a]));
    const codes = accounts.map((a) => a.Account_Code);

    const grouped = await prisma.accountTransaction.groupBy({
      by: ["Account_Code"],
      where: {
        UserId: userId,
        Is_Active: true,
        Posted_Date: { lt: asOf },
        Account_Code: { in: codes },
      },
      _sum: { Amount: true },
    });

    const rows: BsAccountBalance[] = [];
    for (const g of grouped) {
      if (g.Account_Code == null) continue;
      const a = meta.get(g.Account_Code);
      if (!a) continue;
      rows.push({
        code: g.Account_Code,
        name: a.Account_Name?.trim() || `Account ${g.Account_Code}`,
        type: a.Account_Type?.trim() || "",
        sum: Number(g._sum.Amount ?? 0),
      });
    }
    return rows;
  },

  // Raw Σ Amount of P&L-account active txns in [start, endExclusive). Service negates for net income.
  async plAmountSum(userId: number, start: Date | null, endExclusive: Date): Promise<number> {
    const plAccounts = await prisma.accounts.findMany({
      where: { UserId: userId, Account_Type: { in: PL_TYPES } },
      select: { Account_Code: true },
    });
    if (plAccounts.length === 0) return 0;
    const codes = plAccounts.map((a) => a.Account_Code);

    const r = await prisma.accountTransaction.aggregate({
      where: {
        UserId: userId,
        Is_Active: true,
        Posted_Date: start ? { gte: start, lt: endExclusive } : { lt: endExclusive },
        Account_Code: { in: codes },
      },
      _sum: { Amount: true },
    });
    return Number(r._sum.Amount ?? 0);
  },
};
