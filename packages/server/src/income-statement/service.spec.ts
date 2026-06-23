import { describe, expect, it } from "vitest";
import type { PlTxnRow } from "@accounting-completed/db";
import { buildIncomeStatement } from "./service";

const req = { clientId: 2189, year: 2025, generatedAt: "2026-06-23T00:00:00.000Z" };
const row = (p: Partial<PlTxnRow>): PlTxnRow => ({
  accountCode: 1, accountName: "A", accountCategory: null, accountType: "Income", postedMonth: 1, amount: 0, ...p,
});

describe("buildIncomeStatement", () => {
  it("returns three empty sections and zero totals for no rows", () => {
    const s = buildIncomeStatement([], req);
    expect(s.sections.map((x) => x.key)).toEqual(["income", "cogs", "expense"]);
    expect(s.sections.every((x) => x.accounts.length === 0)).toBe(true);
    expect(s.netIncome.total).toBe(0);
    expect(s.grossProfit.months).toHaveLength(12);
  });

  it("flips income sign to positive and buckets by month", () => {
    const s = buildIncomeStatement(
      [row({ accountCode: 4010, accountName: "Sales", accountType: "Income", postedMonth: 1, amount: -1000 })],
      req,
    );
    const income = s.sections.find((x) => x.key === "income")!;
    expect(income.accounts[0].months[0]).toBe(1000); // Jan, flipped positive
    expect(income.accounts[0].total).toBe(1000);
    expect(s.kpis.totalIncome).toBe(1000);
  });

  it("keeps cogs/expense positive and computes gross profit and net income", () => {
    const s = buildIncomeStatement(
      [
        row({ accountCode: 4010, accountName: "Sales", accountType: "Income", postedMonth: 3, amount: -1000 }),
        row({ accountCode: 5010, accountName: "Materials", accountType: "Cost of Goods Sold", postedMonth: 3, amount: 300 }),
        row({ accountCode: 6010, accountName: "Rent", accountType: "Expense", postedMonth: 3, amount: 200 }),
      ],
      req,
    );
    expect(s.grossProfit.months[2]).toBe(700); // 1000 - 300
    expect(s.netIncome.months[2]).toBe(500); // 1000 - 300 - 200
    expect(s.kpis).toEqual({ totalIncome: 1000, grossProfit: 700, totalExpenses: 200, netIncome: 500 });
  });

  it("sums multiple transactions into one account line and sorts accounts by name", () => {
    const s = buildIncomeStatement(
      [
        row({ accountCode: 6020, accountName: "Zebra", accountType: "Expense", postedMonth: 1, amount: 10 }),
        row({ accountCode: 6010, accountName: "Apple", accountType: "Expense", postedMonth: 1, amount: 5 }),
        row({ accountCode: 6010, accountName: "Apple", accountType: "Expense", postedMonth: 2, amount: 7 }),
      ],
      req,
    );
    const expense = s.sections.find((x) => x.key === "expense")!;
    expect(expense.accounts.map((a) => a.name)).toEqual(["Apple", "Zebra"]);
    expect(expense.accounts[0].total).toBe(12); // 5 + 7
    expect(expense.subtotal.total).toBe(22);
  });
});
