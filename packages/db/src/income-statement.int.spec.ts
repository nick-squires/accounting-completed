// packages/db/src/income-statement.int.spec.ts
import { afterAll, describe, expect, it } from "vitest";
import { Prisma } from "../generated/prisma/client";
import { prisma, incomeStatementRepository, UNCATEGORIZED_ACCOUNT_CODE } from "./index";

// Gate on the vars that drive the live connection (NOT DATABASE_URL — that only feeds the Prisma CLI and is empty in .env.example).
const RUN = process.env.RUN_DB_TESTS === "1" && !!process.env.MAC_DB_SERVER;
const USER_ID = Number(process.env.RECON_USER_ID ?? 2189);
const YEAR = Number(process.env.RECON_YEAR ?? 2025);

// Legacy detail proc row (subset we compare on).
// Yearly_Total is SUM(...) in the proc — returns null when no rows match a type.
interface ProcRow {
  Account_Code: number;
  Account_Name: string;
  Type: string;
  Yearly_Total: number | null;
}

// Mirror of the service's section/sign rules, kept local so db has no server dep.
function ourSectionTotals(rows: Awaited<ReturnType<typeof incomeStatementRepository.getTransactionsForYear>>) {
  const totals = { Income: 0, "Cost of Goods Sold": 0, Expense: 0 } as Record<string, number>;
  for (const r of rows) {
    const v = r.accountType === "Income" ? -r.amount : r.amount;
    totals[r.accountType] += v;
  }
  return totals;
}

describe.skipIf(!RUN)("income statement reconciliation vs legacy procs", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("reports section-total deltas between clean queries and the legacy detail proc", async () => {
    const from = `${YEAR}-01-01`;
    const to = `${YEAR}-12-31`;

    const procRows = await prisma.$queryRaw<ProcRow[]>(
      Prisma.sql`EXEC dbo.QBAutomation_ProfitLoss_TEST @UserId = ${USER_ID}, @DateFrom = ${from}, @DateTo = ${to}`,
    );

    // Legacy yearly totals per type. proc 1 tags uncategorized rows Type='Uncategorized'
    // (NOT 'Expense') — map them to Expense to match our convention, else the Expense
    // delta is just the uncategorized total and the comparison is meaningless.
    // Income is stored negative → flip to compare to our natural-sign totals.
    const procTotals = { Income: 0, "Cost of Goods Sold": 0, Expense: 0 } as Record<string, number>;
    for (const r of procRows) {
      const t = r.Type === "Uncategorized" ? "Expense" : r.Type;
      if (t in procTotals) {
        const val = Number(r.Yearly_Total ?? 0);
        procTotals[t] += t === "Income" ? -val : val;
      }
    }

    const rows = await incomeStatementRepository.getTransactionsForYear(USER_ID, YEAR);
    const ours = ourSectionTotals(rows);

    const TOLERANCE = 0.01; // absorb float/rounding noise; real divergence shows above this
    const report = (["Income", "Cost of Goods Sold", "Expense"] as const).map((t) => {
      const delta = Math.round((ours[t] - procTotals[t]) * 100) / 100;
      return {
        type: t,
        proc: Math.round(procTotals[t] * 100) / 100,
        ours: Math.round(ours[t] * 100) / 100,
        delta,
        withinTolerance: Math.abs(delta) < TOLERANCE,
      };
    });

    const uncategorizedOurs = rows
      .filter((r) => r.accountCode === UNCATEGORIZED_ACCOUNT_CODE)
      .reduce((s, r) => s + r.amount, 0);

    // Diff report is the deliverable — print it for the human parity decision.
    // eslint-disable-next-line no-console
    console.log("RECON_REPORT " + JSON.stringify({ userId: USER_ID, year: YEAR, report, uncategorizedOurs }));

    // Sanity, not strict parity: both sides return numbers for each type.
    expect(report.every((r) => Number.isFinite(r.proc) && Number.isFinite(r.ours))).toBe(true);
  });
});
