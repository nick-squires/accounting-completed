import { prisma } from "../client";

// Raw row: repository returns DB fields; status derivation lives in the server
// service so it can be unit-tested without a database.
export interface RawTxnRow {
  id: number;
  postedDate: Date;
  payee: string | null;
  memo: string | null;
  amount: number;
  categoryName: string | null;
  checkNumber: string | null;
  account: string | null;
  isApprove: boolean | null;
  isArchived: boolean;
  isActive: boolean | null;
  source: "ledger" | "uncategorized";
}

// Half-open UTC range [year-01-01, (year+1)-01-01)
function yearRange(year: number) {
  return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
}

export const transactionsRepository = {
  async listForYear(userId: number, year: number): Promise<RawTxnRow[]> {
    const range = yearRange(year);

    const txns = await prisma.accountTransaction.findMany({
      where: { UserId: userId, Posted_Date: range },
      select: {
        Transaction_Code: true,
        Posted_Date: true,
        Payee_Name: true,
        Memo: true,
        Amount: true,
        Category_Name: true,
        CheckNumber: true,
        Is_Approve: true,
        IsArchived: true,
        Is_Active: true,
        Accounts: { select: { Account_Name: true } },
      },
      orderBy: { Posted_Date: "desc" },
    });

    const unc = await prisma.uncategorizedEntries.findMany({
      where: { UserId: userId, Is_Active: true, Posted_Date: range },
      select: {
        Transaction_Code: true,
        Posted_Date: true,
        Payee_Name: true,
        Memo: true,
        Amount: true,
        Category_Name: true,
        CheckNumber: true,
        Accounts: { select: { Account_Name: true } },
      },
      orderBy: { Posted_Date: "desc" },
    });

    const rows: RawTxnRow[] = [];

    for (const t of txns) {
      if (!t.Posted_Date) continue;
      rows.push({
        id: t.Transaction_Code,
        postedDate: t.Posted_Date,
        payee: t.Payee_Name?.trim() || null,
        memo: t.Memo?.trim() || null,
        amount: Number(t.Amount ?? 0),
        categoryName: t.Category_Name?.trim() || null,
        checkNumber: t.CheckNumber?.trim() || null,
        account: t.Accounts?.Account_Name?.trim() || null,
        isApprove: t.Is_Approve,
        isArchived: t.IsArchived,
        isActive: t.Is_Active,
        source: "ledger",
      });
    }

    for (const u of unc) {
      if (!u.Posted_Date) continue;
      rows.push({
        id: u.Transaction_Code,
        postedDate: u.Posted_Date,
        payee: u.Payee_Name?.trim() || null,
        memo: u.Memo?.trim() || null,
        amount: Number(u.Amount ?? 0),
        categoryName: u.Category_Name?.trim() || null,
        checkNumber: u.CheckNumber?.trim() || null,
        account: u.Accounts?.Account_Name?.trim() || null,
        isApprove: null,
        isArchived: false,
        isActive: true,
        source: "uncategorized",
      });
    }

    return rows;
  },

  async availableYears(userId: number): Promise<number[]> {
    const txns = await prisma.accountTransaction.findMany({
      where: { UserId: userId, Posted_Date: { not: null } },
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
