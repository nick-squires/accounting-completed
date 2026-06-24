import { describe, expect, it } from "vitest";
import { buildBalanceSheet } from "./service";
import type { BsAccountBalance } from "@accounting-completed/db";

// Synthetic double-entry-ish data: a bank account funded by income, an expense paid from it,
// a credit card with a balance, an equity contribution.
const balances: BsAccountBalance[] = [
  { code: 1000, name: "Checking", type: "BankingAccount", sum: 800 },     // asset +800
  { code: 1500, name: "Equipment", type: "Fixed Assets", sum: 500 },      // asset +500
  { code: 2000, name: "Amex", type: "Credit Card/Loan", sum: -200 },      // liability: -(-200)=200
  { code: 3000, name: "Owner Capital", type: "Equity", sum: -1000 },      // equity: -(-1000)=1000
];
// P&L: retained earnings raw (prior years) and current-year net income raw.
// Equity synthetic: RetainedEarnings = -(-100)=100 ; NetIncome = -(-? ) ...
// Choose so the sheet balances: assets=1300; liabilities=200; equityAccts=1000;
// need RE+NI = 1300-200-1000 = 100. Use retainedEarningsRaw=-60, currentNetIncomeRaw=-40 → RE=60, NI=40.
const built = buildBalanceSheet({
  balances,
  retainedEarningsRaw: -60,
  currentNetIncomeRaw: -40,
  clientId: 2189,
  year: 2025,
  asOf: "2026-01-01T00:00:00.000Z",
  generatedAt: "2025-06-01T00:00:00.000Z",
});

describe("buildBalanceSheet", () => {
  it("maps types into sections with correct signs", () => {
    const assets = built.sections.find((s) => s.key === "assets")!;
    const liabilities = built.sections.find((s) => s.key === "liabilities")!;
    const equity = built.sections.find((s) => s.key === "equity")!;
    expect(assets.total).toBe(1300);          // 800 + 500
    expect(liabilities.total).toBe(200);      // -(-200)
    expect(equity.total).toBe(1100);          // -(-1000) + 60 + 40
  });

  it("remaps display types (BankingAccount→Current Assets, Credit Card/Loan→Current Liabilities)", () => {
    const assets = built.sections.find((s) => s.key === "assets")!;
    expect(assets.groups.map((g) => g.type)).toEqual(["Current Assets", "Fixed Assets"]);
    const liabilities = built.sections.find((s) => s.key === "liabilities")!;
    expect(liabilities.groups[0].type).toBe("Current Liabilities");
  });

  it("adds Retained Earnings and Net Income as equity accounts with negated P&L sums", () => {
    const equity = built.sections.find((s) => s.key === "equity")!;
    const eqGroup = equity.groups.find((g) => g.type === "Equity")!;
    const re = eqGroup.accounts.find((a) => a.name === "Retained Earnings")!;
    const ni = eqGroup.accounts.find((a) => a.name === "Net Income")!;
    expect(re.amount).toBe(60);   // -(-60)
    expect(ni.amount).toBe(40);   // -(-40)
  });

  it("foots: assets = liabilities + equity, and reports balanced=true", () => {
    expect(built.totals.assets).toBe(1300);
    expect(built.totals.liabilitiesAndEquity).toBe(1300);
    expect(built.totals.liabilitiesAndEquity).toBe(built.totals.liabilities + built.totals.equity);
    expect(built.balanced).toBe(true);
  });

  it("drops zero-balance accounts", () => {
    const b = buildBalanceSheet({
      balances: [
        { code: 1, name: "Zero Asset", type: "Current Assets", sum: 0 },
        { code: 2, name: "Real Asset", type: "Current Assets", sum: 50 },
      ],
      retainedEarningsRaw: 0, currentNetIncomeRaw: -50,
      clientId: 1, year: 2025, asOf: "2026-01-01T00:00:00.000Z", generatedAt: "x",
    });
    const assets = b.sections.find((s) => s.key === "assets")!;
    const names = assets.groups.flatMap((g) => g.accounts.map((a) => a.name));
    expect(names).toEqual(["Real Asset"]);
  });

  it("marks balanced=false when the ledger does not foot", () => {
    const b = buildBalanceSheet({
      balances: [{ code: 1, name: "Checking", type: "BankingAccount", sum: 100 }],
      retainedEarningsRaw: 0, currentNetIncomeRaw: 0, // equity 0, assets 100 → unbalanced
      clientId: 1, year: 2025, asOf: "2026-01-01T00:00:00.000Z", generatedAt: "x",
    });
    expect(b.balanced).toBe(false);
  });
});
