import { prisma } from "../client";

export const UNCATEGORIZED_ACCOUNT_CODE = -1;
const PL_TYPES = ["Income", "Cost of Goods Sold", "Expense"] as const;
type PlType = (typeof PL_TYPES)[number];

export interface PlTxnRow {
  accountCode: number;
  accountName: string;
  accountCategory: string | null;
  accountType: PlType;
  postedMonth: number; // 1..12, derived from Posted_Date (UTC)
  amount: number;
}

// Half-open UTC range [year-01-01, (year+1)-01-01)
function yearRange(year: number) {
  return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
}

export const incomeStatementRepository = {
  // Firm-scoping guard for the route: is this client a customer in the staff user's firm?
  async clientInFirm(userId: number, firmClientId: number): Promise<boolean> {
    const u = await prisma.users.findFirst({
      where: { UserId: userId, Client_Id: firmClientId, Is_Customer: true, Is_Active: true },
      select: { UserId: true },
    });
    return u != null;
  },

  async getTransactionsForYear(userId: number, year: number): Promise<PlTxnRow[]> {
    const range = yearRange(year);

    const txns = await prisma.accountTransaction.findMany({
      where: {
        UserId: userId,
        Is_Active: true,
        Posted_Date: range,
        Accounts: { Account_Type: { in: [...PL_TYPES] } },
      },
      select: {
        Amount: true,
        Posted_Date: true,
        Accounts: {
          select: { Account_Code: true, Account_Name: true, Account_Category: true, Account_Type: true },
        },
      },
    });

    const uncategorized = await prisma.uncategorizedEntries.findMany({
      where: { UserId: userId, Is_Active: true, Posted_Date: range },
      select: { Amount: true, Posted_Date: true },
    });

    const rows: PlTxnRow[] = [];

    for (const t of txns) {
      const a = t.Accounts;
      if (!a || !t.Posted_Date) continue;
      rows.push({
        accountCode: a.Account_Code,
        accountName: a.Account_Name?.trim() || `Account ${a.Account_Code}`,
        accountCategory: a.Account_Category?.trim() ?? null,
        accountType: (a.Account_Type?.trim() ?? "") as PlType, // legacy RTRIMs; guard padded NVarChar
        postedMonth: t.Posted_Date.getUTCMonth() + 1,
        amount: Number(t.Amount ?? 0),
      });
    }

    for (const u of uncategorized) {
      if (!u.Posted_Date) continue;
      rows.push({
        accountCode: UNCATEGORIZED_ACCOUNT_CODE,
        accountName: "Uncategorized Expense",
        accountCategory: null,
        accountType: "Expense",
        postedMonth: u.Posted_Date.getUTCMonth() + 1,
        amount: Number(u.Amount ?? 0),
      });
    }

    return rows;
  },

  async getAvailableYears(userId: number): Promise<number[]> {
    const txns = await prisma.accountTransaction.findMany({
      where: { UserId: userId, Is_Active: true, Posted_Date: { not: null }, Accounts: { Account_Type: { in: [...PL_TYPES] } } },
      select: { Posted_Date: true },
    });
    const unc = await prisma.uncategorizedEntries.findMany({
      where: { UserId: userId, Is_Active: true, Posted_Date: { not: null } },
      select: { Posted_Date: true },
    });
    const years = new Set<number>();
    for (const t of txns) if (t.Posted_Date) years.add(t.Posted_Date.getUTCFullYear());
    for (const u of unc) if (u.Posted_Date) years.add(u.Posted_Date.getUTCFullYear());
    return [...years].sort((a, b) => b - a);
  },
};
