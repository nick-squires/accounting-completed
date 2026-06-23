# Income Statement (Profit & Loss) Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Income Statement (P&L) vertical slice — Prisma query → pure aggregation service → Hono API → shared zod contract → React Query hook → `ProfitLossPage` — fully decoupled from the legacy stored procs, with a gated reconciliation test that diffs our output against those procs.

**Architecture:** A thin typed Prisma repository pulls one client-year of active transactions (plus uncategorized entries). A pure `buildIncomeStatement` service buckets them into 12 months, normalizes signs, and computes section subtotals, gross profit, and net income. A Hono route (staff-only) validates query params with zod and returns a contract-shaped `IncomeStatement`. The web app fetches it via a typed React Query hook and renders KPI tiles + a 12-month table. The legacy procs are referenced only in a gated integration test that measures parity.

**Tech Stack:** TypeScript (strict, ESM), Prisma 7 + `@prisma/adapter-mssql`, Hono + `@hono/zod-validator`, zod, `@tanstack/react-query`, React 19 + react-router, Vitest + React Testing Library + MSW, Nx + pnpm.

## Global Constraints

- **Package scope:** internal packages are `@accounting-completed/<name>`.
- **No database changes.** Existing DB is read-only; SELECT/EXEC only. No DDL/DML/migrations.
- **No committed secrets.** DB creds live in git-ignored `.env`.
- **Module boundaries (Nx):** `apps/web` MUST NOT import `apps/api` or `packages/db`. `api-client`→`contracts`; `apps/api`/`server`→`db`,`contracts`.
- **TypeScript `strict: true`; no `any`** in committed code unless justified inline.
- **Income sign convention:** `Account_Type` `Income` rows are stored **negative**; the service multiplies them by `-1` so income presents positive. `Cost of Goods Sold` and `Expense` rows are used as-is. The contract and UI only ever see natural signs.
- **Account-type scope (v1):** only `Income`, `Cost of Goods Sold`, `Expense`. No "Other Income/Expense".
- **Period model:** single calendar year; 12 monthly columns (Jan→Dec) + yearly total. Default = latest year with data.
- **Uncategorized entries:** included consistently in both line items and totals (Expense section), grouped under a synthetic account (`code = -1`, name "Uncategorized Expense").
- **Auth:** `/api/income-statement*` is `requireStaff` for v1.
- **Tests run with daemon disabled on Windows:** prefix Nx/vitest commands with `NX_DAEMON=false` (a concurrent-daemon `EADDRINUSE` crash was observed otherwise).
- **Commands run hooks normally** (do not pass `--no-verify`).
- **Spec:** `docs/superpowers/specs/2026-06-23-income-statement-design.md`.

---

## File Structure

```
packages/contracts/src/
  income-statement.ts            zod request + response + years schemas, inferred types
  income-statement.spec.ts       schema validation tests
  index.ts                       + export income-statement
packages/db/src/repositories/
  income-statement.ts            PlTxnRow, getTransactionsForYear(), getAvailableYears()
packages/db/src/
  index.ts                       + export repositories/income-statement
  income-statement.int.spec.ts   GATED reconciliation (clean output vs legacy procs)
packages/server/src/income-statement/
  types.ts                       PlTxnRow re-export alias for the service input (decoupling)
  service.ts                     buildIncomeStatement(rows, req)  — PURE
  service.spec.ts                unit tests
  routes.ts                      GET / and GET /years (zod-validated, requireStaff)
  routes.spec.ts                 app.request() + fake deps
packages/server/src/
  app.ts                         + mount /api/income-statement
packages/api-client/src/
  use-income-statement.ts        useIncomeStatement(), useIncomeStatementYears()
  use-income-statement.spec.ts   MSW
  index.ts                       + export hooks
apps/web/src/routes/profit-loss/
  ProfitLossPage.tsx             year selector + KPIs + table + states
  PLTable.tsx                    sectioned 12-month table
  Kpi.tsx                        KPI tile
  ProfitLossPage.spec.tsx        MSW: loading/error/empty/success
apps/web/src/router.tsx          wire /reports/profit-loss → ProfitLossPage
```

---

### Task 1: Contract (zod schemas + types)

**Files:**
- Create: `packages/contracts/src/income-statement.ts`
- Test: `packages/contracts/src/income-statement.spec.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces: `incomeStatementRequestSchema`, `incomeStatementYearsRequestSchema`, `incomeStatementSchema`, `incomeStatementYearsSchema`, and types `IncomeStatement`, `IncomeStatementRequest`, `IncomeStatementSection`, `IncomeStatementAccount`, `Bucketed`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/contracts/src/income-statement.spec.ts
import { describe, expect, it } from "vitest";
import {
  incomeStatementRequestSchema,
  incomeStatementSchema,
  incomeStatementYearsSchema,
} from "./income-statement";

const months = Array(12).fill(0);
const bucketed = { months, total: 0 };
const valid = {
  meta: { clientId: 2189, year: 2025, generatedAt: "2026-06-23T00:00:00.000Z" },
  sections: [
    { key: "income", label: "Income", accounts: [], subtotal: bucketed },
    { key: "cogs", label: "Cost of Goods Sold", accounts: [], subtotal: bucketed },
    { key: "expense", label: "Expenses", accounts: [], subtotal: bucketed },
  ],
  grossProfit: bucketed,
  netIncome: bucketed,
  kpis: { totalIncome: 0, grossProfit: 0, totalExpenses: 0, netIncome: 0 },
};

describe("income-statement contracts", () => {
  it("coerces string query params to numbers", () => {
    const r = incomeStatementRequestSchema.parse({ clientId: "2189", year: "2025" });
    expect(r).toEqual({ clientId: 2189, year: 2025 });
  });

  it("accepts a well-formed statement", () => {
    expect(() => incomeStatementSchema.parse(valid)).not.toThrow();
  });

  it("rejects a months array that is not length 12", () => {
    const bad = { ...valid, grossProfit: { months: [1, 2, 3], total: 6 } };
    expect(() => incomeStatementSchema.parse(bad)).toThrow();
  });

  it("validates the years payload", () => {
    expect(incomeStatementYearsSchema.parse({ years: [2025, 2024] })).toEqual({ years: [2025, 2024] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NX_DAEMON=false npx vitest run packages/contracts/src/income-statement.spec.ts`
Expected: FAIL — cannot resolve `./income-statement`.

- [ ] **Step 3: Write the schemas**

```ts
// packages/contracts/src/income-statement.ts
import { z } from "zod";

export const incomeStatementRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().gte(1990).lte(2999),
});
export type IncomeStatementRequest = z.infer<typeof incomeStatementRequestSchema>;

export const incomeStatementYearsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

const months12 = z.array(z.number()).length(12);
export const bucketedSchema = z.object({ months: months12, total: z.number() });
export type Bucketed = z.infer<typeof bucketedSchema>;

export const incomeStatementAccountSchema = z.object({
  code: z.number(),
  name: z.string(),
  category: z.string().nullable(),
  months: months12,
  total: z.number(),
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
    totalIncome: z.number(),
    grossProfit: z.number(),
    totalExpenses: z.number(),
    netIncome: z.number(),
  }),
});
export type IncomeStatement = z.infer<typeof incomeStatementSchema>;

export const incomeStatementYearsSchema = z.object({ years: z.array(z.number()) });
export type IncomeStatementYears = z.infer<typeof incomeStatementYearsSchema>;
```

- [ ] **Step 4: Export from the package index**

```ts
// packages/contracts/src/index.ts
export * from "./auth";
export * from "./clients";
export * from "./error";
export * from "./income-statement";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `NX_DAEMON=false npx vitest run packages/contracts/src/income-statement.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src/income-statement.ts packages/contracts/src/income-statement.spec.ts packages/contracts/src/index.ts
git commit -m "feat(contracts): income statement request + response schemas"
```

---

### Task 2: DB repository (thin typed Prisma queries)

**Files:**
- Create: `packages/db/src/repositories/income-statement.ts`
- Modify: `packages/db/src/index.ts`

**Interfaces:**
- Consumes: `prisma` from `../client`.
- Produces:
  - `UNCATEGORIZED_ACCOUNT_CODE = -1`
  - `interface PlTxnRow { accountCode: number; accountName: string; accountCategory: string | null; accountType: "Income" | "Cost of Goods Sold" | "Expense"; postedMonth: number; amount: number; }`
  - `incomeStatementRepository.getTransactionsForYear(userId: number, year: number): Promise<PlTxnRow[]>`
  - `incomeStatementRepository.getAvailableYears(userId: number): Promise<number[]>`

> **Note on testing:** like `clientsRepository`, this repository is a thin Prisma query verified by the gated integration test in Task 4 (no isolated unit test — there is no logic to unit-test without a DB). The pure logic lives in the service (Task 3), which is fully unit-tested.

- [ ] **Step 1: Write the repository**

```ts
// packages/db/src/repositories/income-statement.ts
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
        accountType: a.Account_Type as PlType,
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
```

- [ ] **Step 2: Export from the package index**

```ts
// packages/db/src/index.ts
export { prisma } from "./client";
export * from "./repositories/clients";
export * from "./repositories/users";
export * from "./repositories/income-statement";
```

- [ ] **Step 3: Typecheck the db package**

Run: `NX_DAEMON=false npx nx run db:typecheck` (or `npx tsc -p packages/db/tsconfig.lib.json --noEmit` if no typecheck target)
Expected: no type errors. (Functional verification happens in Task 4's gated integration test.)

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/repositories/income-statement.ts packages/db/src/index.ts
git commit -m "feat(db): income statement repository (transactions + available years)"
```

---

### Task 3: Pure aggregation service

**Files:**
- Create: `packages/server/src/income-statement/types.ts`
- Create: `packages/server/src/income-statement/service.ts`
- Test: `packages/server/src/income-statement/service.spec.ts`

**Interfaces:**
- Consumes: `PlTxnRow` from `@accounting-completed/db`; `IncomeStatement` from `@accounting-completed/contracts`.
- Produces: `buildIncomeStatement(rows: PlTxnRow[], req: { clientId: number; year: number; generatedAt: string }): IncomeStatement`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/server/src/income-statement/service.spec.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NX_DAEMON=false npx vitest run packages/server/src/income-statement/service.spec.ts`
Expected: FAIL — cannot resolve `./service`.

- [ ] **Step 3: Write the type alias**

```ts
// packages/server/src/income-statement/types.ts
// Re-export the repository row type so the pure service depends on a name, not on prisma.
export type { PlTxnRow } from "@accounting-completed/db";
```

- [ ] **Step 4: Write the service**

```ts
// packages/server/src/income-statement/service.ts
import type {
  Bucketed,
  IncomeStatement,
  IncomeStatementAccount,
  IncomeStatementSection,
} from "@accounting-completed/contracts";
import type { PlTxnRow } from "./types";

type SectionKey = "income" | "cogs" | "expense";

const SECTION_ORDER: Array<{ key: SectionKey; label: string; type: PlTxnRow["accountType"] }> = [
  { key: "income", label: "Income", type: "Income" },
  { key: "cogs", label: "Cost of Goods Sold", type: "Cost of Goods Sold" },
  { key: "expense", label: "Expenses", type: "Expense" },
];

const zeros = (): number[] => Array(12).fill(0);
const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0);
const addInto = (target: number[], src: number[]): void => {
  for (let i = 0; i < 12; i++) target[i] += src[i];
};
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const round2Arr = (a: number[]): number[] => a.map(round2);

export function buildIncomeStatement(
  rows: PlTxnRow[],
  req: { clientId: number; year: number; generatedAt: string },
): IncomeStatement {
  const sections: IncomeStatementSection[] = SECTION_ORDER.map(({ key, label, type }) => {
    const inType = rows.filter((r) => r.accountType === type);
    // group by accountCode
    const byCode = new Map<number, IncomeStatementAccount>();
    for (const r of inType) {
      let acc = byCode.get(r.accountCode);
      if (!acc) {
        acc = { code: r.accountCode, name: r.accountName, category: r.accountCategory, months: zeros(), total: 0 };
        byCode.set(r.accountCode, acc);
      }
      // Income is stored negative; present positive. COGS/Expense as-is.
      const value = key === "income" ? -r.amount : r.amount;
      acc.months[r.postedMonth - 1] += value;
    }
    const accounts = [...byCode.values()]
      .map((a) => ({ ...a, months: round2Arr(a.months), total: round2(sum(a.months)) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const subMonths = zeros();
    for (const a of accounts) addInto(subMonths, a.months);
    const subtotal: Bucketed = { months: round2Arr(subMonths), total: round2(sum(subMonths)) };
    return { key, label, accounts, subtotal };
  });

  const incomeSub = sections[0].subtotal.months;
  const cogsSub = sections[1].subtotal.months;
  const expenseSub = sections[2].subtotal.months;

  const gpMonths = zeros();
  const niMonths = zeros();
  for (let i = 0; i < 12; i++) {
    gpMonths[i] = incomeSub[i] - cogsSub[i];
    niMonths[i] = incomeSub[i] - cogsSub[i] - expenseSub[i];
  }
  const grossProfit: Bucketed = { months: round2Arr(gpMonths), total: round2(sum(gpMonths)) };
  const netIncome: Bucketed = { months: round2Arr(niMonths), total: round2(sum(niMonths)) };

  return {
    meta: { clientId: req.clientId, year: req.year, generatedAt: req.generatedAt },
    sections,
    grossProfit,
    netIncome,
    kpis: {
      totalIncome: sections[0].subtotal.total,
      grossProfit: grossProfit.total,
      totalExpenses: sections[2].subtotal.total,
      netIncome: netIncome.total,
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `NX_DAEMON=false npx vitest run packages/server/src/income-statement/service.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/income-statement/types.ts packages/server/src/income-statement/service.ts packages/server/src/income-statement/service.spec.ts
git commit -m "feat(server): pure income statement aggregation service"
```

---

### Task 4: Gated reconciliation integration test (the comparison effort)

**Files:**
- Create: `packages/db/src/income-statement.int.spec.ts`

**Interfaces:**
- Consumes: `prisma`, `incomeStatementRepository` from `./index`; `buildIncomeStatement` is duplicated logic risk, so import it from the server package is NOT allowed (db must not depend on server). Instead, this test imports the repository and runs the procs, then compares against a **locally inlined** minimal aggregation mirroring the service's documented rules. Keep the comparison at the section/total level.

> **Why here:** this is the only place the legacy procs are referenced. It is gated behind `RUN_DB_TESTS=1` exactly like `clients.int.spec.ts`, so normal `pnpm test` never runs it and production code never imports the procs.

- [ ] **Step 1: Write the gated reconciliation test**

```ts
// packages/db/src/income-statement.int.spec.ts
import { afterAll, describe, expect, it } from "vitest";
import { prisma, incomeStatementRepository, UNCATEGORIZED_ACCOUNT_CODE } from "./index";

const RUN = !!process.env.DATABASE_URL && process.env.RUN_DB_TESTS === "1";
const USER_ID = Number(process.env.RECON_USER_ID ?? 2189);
const YEAR = Number(process.env.RECON_YEAR ?? 2025);

// Legacy detail proc row (subset we compare on).
interface ProcRow {
  Account_Code: number;
  Account_Name: string;
  Type: string;
  Yearly_Total: number;
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

    const procRows = await prisma.$queryRawUnsafe<ProcRow[]>(
      "EXEC dbo.QBAutomation_ProfitLoss_TEST @UserId = ?, @DateFrom = ?, @DateTo = ?",
      USER_ID,
      from,
      to,
    );

    // Legacy yearly totals per type (income stored negative → flip to compare to ours).
    const procTotals = { Income: 0, "Cost of Goods Sold": 0, Expense: 0 } as Record<string, number>;
    for (const r of procRows) {
      const t = r.Type;
      if (t in procTotals) procTotals[t] += t === "Income" ? -r.Yearly_Total : r.Yearly_Total;
    }

    const rows = await incomeStatementRepository.getTransactionsForYear(USER_ID, YEAR);
    const ours = ourSectionTotals(rows);

    const report = (["Income", "Cost of Goods Sold", "Expense"] as const).map((t) => ({
      type: t,
      proc: Math.round(procTotals[t] * 100) / 100,
      ours: Math.round(ours[t] * 100) / 100,
      delta: Math.round((ours[t] - procTotals[t]) * 100) / 100,
    }));

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
```

- [ ] **Step 2: Run the gated test against the live test DB**

Run: `NX_DAEMON=false RUN_DB_TESTS=1 npx vitest run packages/db/src/income-statement.int.spec.ts`
Expected: PASS, and a `RECON_REPORT {...}` line in the output showing per-type `proc`/`ours`/`delta`. Record the deltas in the commit message or a notes file; this is the data for the parity decision.

- [ ] **Step 3: Confirm the default (skipped) path**

Run: `NX_DAEMON=false npx vitest run packages/db/src/income-statement.int.spec.ts`
Expected: test is SKIPPED (no `RUN_DB_TESTS`), proving normal CI never touches the procs.

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/income-statement.int.spec.ts
git commit -m "test(db): gated reconciliation of income statement vs legacy procs"
```

---

### Task 5: Hono route + mount

**Files:**
- Create: `packages/server/src/income-statement/routes.ts`
- Test: `packages/server/src/income-statement/routes.spec.ts`
- Modify: `packages/server/src/app.ts`

**Interfaces:**
- Consumes: `incomeStatementRequestSchema`, `incomeStatementYearsRequestSchema` from contracts; `buildIncomeStatement` from `./service`; `requireStaff` from `../middleware/request-context`; `PlTxnRow` from `./types`.
- Produces: `createIncomeStatementRoutes(deps: IncomeStatementDeps)` where
  `IncomeStatementDeps = { getTransactionsForYear(userId: number, year: number): Promise<PlTxnRow[]>; getAvailableYears(userId: number): Promise<number[]>; }`.
  Routes: `GET /` (query `clientId`,`year`) → `IncomeStatement`; `GET /years` (query `clientId`) → `{ years }`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/server/src/income-statement/routes.spec.ts
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import { requestContext } from "../middleware/request-context";
import { createIncomeStatementRoutes } from "./routes";
import { signSession } from "../auth/jwt";
import type { PlTxnRow } from "./types";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: PlTxnRow[] = [
  { accountCode: 4010, accountName: "Sales", accountCategory: null, accountType: "Income", postedMonth: 1, amount: -1000 },
];
const deps = {
  getTransactionsForYear: async () => rows,
  getAvailableYears: async () => [2025, 2024],
};

function appWith() {
  const app = new Hono();
  app.use("*", requestContext);
  return app.route("/api/income-statement", createIncomeStatementRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("income statement routes", () => {
  it("returns a statement for staff", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=2189&year=2025", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.year).toBe(2025);
    expect(body.sections.find((s: { key: string }) => s.key === "income").accounts[0].total).toBe(1000);
  });

  it("returns available years for staff", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement/years?clientId=2189", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ years: [2025, 2024] });
  });

  it("400s on missing query params", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=2189", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(400);
  });

  it("403s for non-staff", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=2189&year=2025", {
      headers: { Authorization: await bearer(customer) },
    });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NX_DAEMON=false npx vitest run packages/server/src/income-statement/routes.spec.ts`
Expected: FAIL — cannot resolve `./routes`.

- [ ] **Step 3: Write the routes**

```ts
// packages/server/src/income-statement/routes.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  incomeStatementRequestSchema,
  incomeStatementYearsRequestSchema,
  incomeStatementSchema,
  incomeStatementYearsSchema,
  type SessionUser,
} from "@accounting-completed/contracts";
import { requireStaff } from "../middleware/request-context";
import { buildIncomeStatement } from "./service";
import type { PlTxnRow } from "./types";

export interface IncomeStatementDeps {
  getTransactionsForYear(userId: number, year: number): Promise<PlTxnRow[]>;
  getAvailableYears(userId: number): Promise<number[]>;
}

export function createIncomeStatementRoutes(deps: IncomeStatementDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>()
    .get("/", requireStaff, zValidator("query", incomeStatementRequestSchema), async (c) => {
      const { clientId, year } = c.req.valid("query");
      const rows = await deps.getTransactionsForYear(clientId, year);
      const statement = buildIncomeStatement(rows, { clientId, year, generatedAt: new Date().toISOString() });
      return c.json(incomeStatementSchema.parse(statement));
    })
    .get("/years", requireStaff, zValidator("query", incomeStatementYearsRequestSchema), async (c) => {
      const { clientId } = c.req.valid("query");
      const years = await deps.getAvailableYears(clientId);
      return c.json(incomeStatementYearsSchema.parse({ years }));
    });
}
```

> **Note:** `new Date().toISOString()` is fine in the route (request time). Keep it out of the pure service so the service stays deterministic for tests.

- [ ] **Step 4: Mount in app.ts**

Modify `packages/server/src/app.ts` — add the import and the route mount in the chain:

```ts
// add with the other route imports
import { createIncomeStatementRoutes } from "./income-statement/routes";
// add to the db import
import { clientsRepository, usersRepository, incomeStatementRepository } from "@accounting-completed/db";
```

Change the chained `routes` block to:

```ts
const routes = app
  .route("/api/auth", createAuthRoutes({ findByUsername: usersRepository.findByUsername }))
  .route("/api/clients", createClientsRoutes({ list: clientsRepository.list }))
  .route("/api/income-statement", createIncomeStatementRoutes({
    getTransactionsForYear: incomeStatementRepository.getTransactionsForYear,
    getAvailableYears: incomeStatementRepository.getAvailableYears,
  }))
  .get("/health", (c) => c.json({ status: "ok" }));
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `NX_DAEMON=false npx vitest run packages/server/src/income-statement/routes.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Run the full server package tests (no regressions)**

Run: `NX_DAEMON=false npx vitest run packages/server`
Expected: all existing + new tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/income-statement/routes.ts packages/server/src/income-statement/routes.spec.ts packages/server/src/app.ts
git commit -m "feat(server): GET /api/income-statement + /years routes (staff-only)"
```

---

### Task 6: API client hooks

**Files:**
- Create: `packages/api-client/src/use-income-statement.ts`
- Test: `packages/api-client/src/use-income-statement.spec.ts`
- Modify: `packages/api-client/src/index.ts`

**Interfaces:**
- Consumes: `apiClient` from `./client`; contract schemas.
- Produces:
  - `useIncomeStatement(params: { clientId: number | null; year: number | null }): UseQueryResult<IncomeStatement>`
  - `useIncomeStatementYears(params: { clientId: number | null }): UseQueryResult<number[]>`

- [ ] **Step 1: Write the failing test (MSW)**

```ts
// packages/api-client/src/use-income-statement.spec.ts
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createElement, type ReactNode } from "react";
import { useIncomeStatement, useIncomeStatementYears } from "./use-income-statement";

const months = Array(12).fill(0);
const statement = {
  meta: { clientId: 2189, year: 2025, generatedAt: "2026-06-23T00:00:00.000Z" },
  sections: [
    { key: "income", label: "Income", accounts: [], subtotal: { months, total: 0 } },
    { key: "cogs", label: "Cost of Goods Sold", accounts: [], subtotal: { months, total: 0 } },
    { key: "expense", label: "Expenses", accounts: [], subtotal: { months, total: 0 } },
  ],
  grossProfit: { months, total: 0 },
  netIncome: { months, total: 0 },
  kpis: { totalIncome: 0, grossProfit: 0, totalExpenses: 0, netIncome: 0 },
};

const server = setupServer(
  http.get("*/api/income-statement", () => HttpResponse.json(statement)),
  http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025, 2024] })),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useIncomeStatement", () => {
  it("fetches the statement when clientId and year are set", async () => {
    const { result } = renderHook(() => useIncomeStatement({ clientId: 2189, year: 2025 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.meta.year).toBe(2025);
  });

  it("is disabled until clientId and year are both set", () => {
    const { result } = renderHook(() => useIncomeStatement({ clientId: null, year: null }), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches available years", async () => {
    const { result } = renderHook(() => useIncomeStatementYears({ clientId: 2189 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([2025, 2024]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NX_DAEMON=false npx vitest run packages/api-client/src/use-income-statement.spec.ts`
Expected: FAIL — cannot resolve `./use-income-statement`.

- [ ] **Step 3: Write the hooks**

```ts
// packages/api-client/src/use-income-statement.ts
import { useQuery } from "@tanstack/react-query";
import { incomeStatementSchema, incomeStatementYearsSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useIncomeStatement(params: { clientId: number | null; year: number | null }) {
  const { clientId, year } = params;
  return useQuery({
    queryKey: ["income-statement", clientId, year],
    enabled: clientId != null && year != null,
    queryFn: async () => {
      const r = await apiClient.api["income-statement"].$get({
        query: { clientId: String(clientId), year: String(year) },
      });
      if (!r.ok) throw new Error("Failed to load income statement");
      return incomeStatementSchema.parse(await r.json());
    },
  });
}

export function useIncomeStatementYears(params: { clientId: number | null }) {
  const { clientId } = params;
  return useQuery({
    queryKey: ["income-statement-years", clientId],
    enabled: clientId != null,
    queryFn: async () => {
      const r = await apiClient.api["income-statement"].years.$get({
        query: { clientId: String(clientId) },
      });
      if (!r.ok) throw new Error("Failed to load available years");
      return incomeStatementYearsSchema.parse(await r.json()).years;
    },
  });
}
```

- [ ] **Step 4: Export from the package index**

```ts
// packages/api-client/src/index.ts
export { apiClient, getToken, setToken } from "./client";
export { useMe, useLogin, useLogout } from "./use-auth";
export { useClients } from "./use-clients";
export { useIncomeStatement, useIncomeStatementYears } from "./use-income-statement";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `NX_DAEMON=false npx vitest run packages/api-client/src/use-income-statement.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/api-client/src/use-income-statement.ts packages/api-client/src/use-income-statement.spec.ts packages/api-client/src/index.ts
git commit -m "feat(api-client): income statement + years hooks"
```

---

### Task 7: Web page (KPIs + table + states) and route wiring

**Files:**
- Create: `apps/web/src/routes/profit-loss/Kpi.tsx`
- Create: `apps/web/src/routes/profit-loss/PLTable.tsx`
- Create: `apps/web/src/routes/profit-loss/ProfitLossPage.tsx`
- Test: `apps/web/src/routes/profit-loss/ProfitLossPage.spec.tsx`
- Modify: `apps/web/src/router.tsx`

**Interfaces:**
- Consumes: `useIncomeStatement`, `useIncomeStatementYears` from api-client; `useClient` from `../../app/client-context`; `IncomeStatement` types from contracts.
- Produces: `ProfitLossPage` default-free named export wired into the router.

- [ ] **Step 1: Write the Kpi tile**

```tsx
// apps/web/src/routes/profit-loss/Kpi.tsx
export function Kpi({ label, value }: { label: string; value: number }) {
  const formatted = value.toLocaleString(undefined, { style: "currency", currency: "USD" });
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-text-soft">{label}</div>
      <div className={["text-[20px] font-semibold tnum", value < 0 ? "text-destructive" : ""].join(" ")}>
        {formatted}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the PLTable**

```tsx
// apps/web/src/routes/profit-loss/PLTable.tsx
import { Fragment } from "react";
import type { IncomeStatement } from "@accounting-completed/contracts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Row({ label, months, total, bold }: { label: string; months: number[]; total: number; bold?: boolean }) {
  return (
    <tr className={bold ? "font-semibold border-t border-border" : ""}>
      <td className="px-3 py-1 text-left sticky left-0 bg-inherit">{label}</td>
      {months.map((m, i) => (
        <td key={i} className="px-3 py-1 text-right tnum">{money(m)}</td>
      ))}
      <td className="px-3 py-1 text-right tnum font-medium">{money(total)}</td>
    </tr>
  );
}

export function PLTable({ data }: { data: IncomeStatement }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="bg-muted text-text-soft text-[11px] uppercase tracking-wider">
            <th className="px-3 py-2 text-left sticky left-0 bg-muted">Account</th>
            {MONTHS.map((m) => <th key={m} className="px-3 py-2 text-right">{m}</th>)}
            <th className="px-3 py-2 text-right">Year</th>
          </tr>
        </thead>
        <tbody>
          {data.sections.map((section) => (
            <Fragment key={section.key}>
              <tr className="bg-secondary/50">
                <td className="px-3 py-1.5 font-medium" colSpan={14}>{section.label}</td>
              </tr>
              {section.accounts.map((a) => (
                <Row key={a.code} label={a.name} months={a.months} total={a.total} />
              ))}
              <Row label={`Total ${section.label}`} months={section.subtotal.months} total={section.subtotal.total} bold />
              {section.key === "cogs" && (
                <Row label="Gross Profit" months={data.grossProfit.months} total={data.grossProfit.total} bold />
              )}
            </Fragment>
          ))}
          <Row label="Net Income" months={data.netIncome.months} total={data.netIncome.total} bold />
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Write the page**

```tsx
// apps/web/src/routes/profit-loss/ProfitLossPage.tsx
import { useEffect, useState } from "react";
import { useIncomeStatement, useIncomeStatementYears } from "@accounting-completed/api-client";
import { useClient } from "../../app/client-context";
import { Kpi } from "./Kpi";
import { PLTable } from "./PLTable";

export function ProfitLossPage() {
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;

  const yearsQuery = useIncomeStatementYears({ clientId: numericClientId });
  const [year, setYear] = useState<number | null>(null);

  // Default to the latest available year once years load.
  useEffect(() => {
    if (year == null && yearsQuery.data && yearsQuery.data.length > 0) {
      setYear(yearsQuery.data[0]);
    }
  }, [year, yearsQuery.data]);

  const statementQuery = useIncomeStatement({ clientId: numericClientId, year });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-semibold">Profit &amp; Loss</h1>
        <label className="text-[13px] flex items-center gap-2">
          Year
          <select
            className="rounded-md border border-border bg-card px-2 py-1"
            value={year ?? ""}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={!yearsQuery.data || yearsQuery.data.length === 0}
          >
            {(yearsQuery.data ?? []).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      {statementQuery.isLoading && <div className="text-text-soft">Loading…</div>}
      {statementQuery.isError && (
        <div className="text-destructive">
          Failed to load. <button className="underline" onClick={() => statementQuery.refetch()}>Retry</button>
        </div>
      )}
      {statementQuery.isSuccess && (
        statementQuery.data.sections.every((s) => s.accounts.length === 0) ? (
          <div className="text-text-soft">No income statement data for this client and year.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Total Income" value={statementQuery.data.kpis.totalIncome} />
              <Kpi label="Gross Profit" value={statementQuery.data.kpis.grossProfit} />
              <Kpi label="Total Expenses" value={statementQuery.data.kpis.totalExpenses} />
              <Kpi label="Net Income" value={statementQuery.data.kpis.netIncome} />
            </div>
            <PLTable data={statementQuery.data} />
          </>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire the router**

Modify `apps/web/src/router.tsx`:

```tsx
// add to imports
import { ProfitLossPage } from "./routes/profit-loss/ProfitLossPage";
```

Replace the profit-loss line:

```tsx
{ path: "/reports/profit-loss", element: <ProfitLossPage />, handle: { title: "Profit & Loss", crumbs: ["Reports", "Profit & Loss"] } },
```

(Leave the `/reports/profit-loss/print` stub unchanged — print is deferred.)

- [ ] **Step 5: Write the page test (MSW)**

```tsx
// apps/web/src/routes/profit-loss/ProfitLossPage.spec.tsx
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { ClientContext } from "../../app/client-context";
import { ProfitLossPage } from "./ProfitLossPage";

const months = Array(12).fill(0);
const withData = {
  meta: { clientId: 2189, year: 2025, generatedAt: "2026-06-23T00:00:00.000Z" },
  sections: [
    { key: "income", label: "Income", accounts: [{ code: 4010, name: "Sales", category: null, months: [1000, ...Array(11).fill(0)], total: 1000 }], subtotal: { months: [1000, ...Array(11).fill(0)], total: 1000 } },
    { key: "cogs", label: "Cost of Goods Sold", accounts: [], subtotal: { months, total: 0 } },
    { key: "expense", label: "Expenses", accounts: [], subtotal: { months, total: 0 } },
  ],
  grossProfit: { months: [1000, ...Array(11).fill(0)], total: 1000 },
  netIncome: { months: [1000, ...Array(11).fill(0)], total: 1000 },
  kpis: { totalIncome: 1000, grossProfit: 1000, totalExpenses: 0, netIncome: 1000 },
};
const empty = { ...withData, sections: withData.sections.map((s) => ({ ...s, accounts: [], subtotal: { months, total: 0 } })) };

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ClientContext.Provider value={{ clientId: "2189", setClientId: () => {} }}>
        <ProfitLossPage />
      </ClientContext.Provider>
    </QueryClientProvider>,
  );
}

describe("ProfitLossPage", () => {
  it("renders KPIs and the table on success", async () => {
    server.use(
      http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025] })),
      http.get("*/api/income-statement", () => HttpResponse.json(withData)),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("Total Income")).toBeInTheDocument());
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("shows the empty state when there is no data", async () => {
    server.use(
      http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025] })),
      http.get("*/api/income-statement", () => HttpResponse.json(empty)),
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/No income statement data/i)).toBeInTheDocument(),
    );
  });

  it("shows an error state on failure", async () => {
    server.use(
      http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025] })),
      http.get("*/api/income-statement", () => new HttpResponse(null, { status: 500 })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText(/Failed to load/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 6: Run the page tests**

Run: `NX_DAEMON=false npx vitest run apps/web/src/routes/profit-loss/ProfitLossPage.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Manual smoke against the live API**

With `NX_DAEMON=false pnpm dev:api` and `NX_DAEMON=false pnpm dev` running, log in (demo staff login from memory), select a client (e.g. UserId 2189), open `/reports/profit-loss`. Expected: year selector defaults to the latest year, KPIs populate, table renders 12 months + Year column. Verify no console errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/routes/profit-loss/ apps/web/src/router.tsx
git commit -m "feat(web): income statement page (KPIs + 12-month table)"
```

---

## Final verification

- [ ] **Run the whole test suite**

Run: `NX_DAEMON=false npx nx run-many -t test`
Expected: all packages green (the gated reconciliation test stays skipped without `RUN_DB_TESTS=1`).

- [ ] **Build the affected projects**

Run: `NX_DAEMON=false npx nx run-many -t build`
Expected: clean build; `apps/web` and `apps/api` compile with the new module.

- [ ] **Capture the reconciliation deltas** (decision input)

Run the gated test (Task 4 Step 2) and paste the `RECON_REPORT` deltas into a short note or the PR description. Decide: deltas small/explained → accept the clean implementation; deltas large/unexpected → open a follow-up to investigate before the page is considered done.

---

## Self-review notes (author)

- **Spec coverage:** contract (Task 1), repo incl. uncategorized + years (Task 2), pure service with signs/sections/GP/NI (Task 3), reconciliation (Task 4), staff-only route + mount (Task 5), hooks (Task 6), page with states + router wiring (Task 7). Print, ranges, fiscal years, customer self-view = explicitly deferred per spec.
- **Decoupling:** procs referenced only in the gated Task 4 test; production code never imports them.
- **Type consistency:** `PlTxnRow` defined in Task 2 (db), re-exported via `./types` (Task 3) and consumed by service/route; `IncomeStatementDeps` method names match `incomeStatementRepository` method names used at the Task 5 mount.
- **Open items to resolve during execution:** confirm `$queryRawUnsafe('EXEC … @p = ?')` parameter binding under `@prisma/adapter-mssql` (Task 4 Step 2); if positional binding misbehaves, switch to interpolated `Prisma.sql`/tagged `$queryRaw` with named params.
```
