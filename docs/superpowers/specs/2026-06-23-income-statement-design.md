# Income Statement (Profit & Loss) Page — Design Spec

**Date:** 2026-06-23
**Branch context:** builds on `feat/backend-data-foundation` (auth + clients + Prisma DB layer, all verified live)
**Supersedes the data layer of:** `docs/superpowers/plans/2026-06-22-income-statement-page-DEFERRED.md` (kept for its legacy proc research; its raw-`mssql` data layer is replaced here by Prisma).

## Goal

Rebuild the legacy Income Statement (Profit & Loss) as a working full-stack vertical slice on top of the Prisma foundation: existing Azure SQL (read-only) → `packages/db` (Prisma) → pure aggregation service → Hono API → shared zod contract → React Query hook → `ProfitLossPage`. This establishes the reusable **report** pattern (typed query → pure service → contract → hook → page) that every later report follows.

## Key decisions (locked during brainstorming)

1. **Decouple from the legacy stored procs.** Production code does **not** call `QBAutomation_ProfitLoss_TEST` / `_MonthlySum_TEST`. We own the logic in clean, typed code.
2. **Fidelity target: correct + cruft-free, not bug-for-bug.** We reproduce the numbers that matter; where the legacy procs are genuinely buggy, we do the right thing and document the difference.
3. **Reconciliation, not enslavement.** A dev-only gated test diffs our output against the legacy procs on real data. The size of the diff informs a one-time human judgment on whether to chase exact parity. The procs are referenced **only** in that test.
4. **Period model: single calendar year.** A year selector; 12 monthly columns + a yearly total. Default = the most recent year with data for the selected client. (Arbitrary date ranges and non-calendar fiscal years are explicitly out of scope for v1.)
5. **Aggregation in TypeScript (Approach B).** Prisma pulls the year's active transactions (thin typed query); a pure service buckets/sums/signs/totals. No SQL strings in the db package; business logic is unit-testable with zero DB.
6. **Auth: `requireStaff` + firm scoping for v1.** Staff pick a client via the existing switcher. The route reads `firmClientId` from the JWT (never from the query) and verifies the requested `clientId` belongs to that firm before returning any data — a staff user from firm A must not be able to read a client in firm B. Customer self-view ("a client sees their own P&L") is deferred.
7. **Print deferred.** The `/reports/profit-loss/print` stub stays a stub; print is a fast follow that reuses this slice's hook + table.

## Global constraints (inherited)

- **No database changes.** Existing DB is read-only. No DDL/DML/migrations. We only SELECT.
- **No committed secrets.** DB creds live in git-ignored `.env`.
- **Module boundaries (Nx):** `apps/web` must not import `apps/api` or `packages/db`. `api-client`→`contracts`; `api`→`db`,`contracts`.
- **Package scope:** `@accounting-completed/<name>`. TypeScript strict; no unjustified `any`.
- **Feature bar:** functional fidelity to the legacy income statement, not pixel fidelity.

## Legacy source of truth

- Page: `MyAccountantsCloud/BrandedCloudAccountingWebsite/Pages/Reports/Profit_Loss.aspx.cs`.
- Procs (research + reconciliation oracle only): `client-mac-skm-working/Mac.Database/dbo/Stored Procedures/QBAutomation_ProfitLoss_TEST.sql` and `QBAutomation_ProfitLoss_MonthlySum_TEST.sql`. Both take `@UserId int, @DateFrom date, @DateTo date`.
- Demo data: firm `Client_Id 69`; demo client `UserId 2189` ("Dr. Reuben Montemagni, A Chiropractic Corporation"), FY 2025. Test DB `brandedcloudaccountingtest_shelby3` (see memory: mac-test-db-connection).

### What the procs do (distilled), and what we change

- **Source rows:** `AccountTransaction` (active, by `UserId`, in date range). Detail proc also folds in `UncategorizedEntries` as a synthetic "Uncategorized Expense" account; the monthly-sum proc does not (legacy inconsistency).
- **Pivot:** 12 month columns filtered to `YEAR(@DateTo)`; plus a 5-week current-month breakdown; plus yearly total.
- **Account filter:** `Account_Type IN ('Income','Expense','Cost of Goods Sold')`. No "Other Income/Expense" in the `_TEST` procs.
- **Signs:** detail returns raw sums (Income stored **negative**); monthly-sum `ABS()`es Income/Expense, computes `Net Income = Σ(Income+Expense+COGS)` and `Gross Profit = (Income+COGS)×−1`.

**Our deliberate differences (the "no-bug, no-cruft" choices):**
- **Drop** the 5-week current-month breakdown entirely (unused by the new UI).
- **Include uncategorized entries consistently** in both line items and totals (Expense section) — fixes the detail-vs-totals mismatch.
- **No weekly bucketing**, so the overlapping-`BETWEEN` double-count bug cannot occur.
- Sign normalization happens once in the service; the contract and UI only ever see natural signs.
- **Join on `Account_Code` (the NOT-NULL int PK), not `Account_ID`.** The legacy procs join transactions→accounts on `Account_ID` (a nullable, non-unique `VarChar`); we use the `Account_Code` FK relation instead. This is the cleaner, canonical key, but it means our row set can differ from the procs where `Account_ID` is null/mismatched — an **expected, documented** divergence the reconciliation must account for, not treat as an error.
- **Uncategorized synthetic account uses `code = -1`** (a clean-room sentinel; the **name** "Uncategorized Expense" matches legacy, the **code** intentionally does not — legacy uses the real account's `Account_Code`).

---

## File structure

```
packages/contracts/src/
  income-statement.ts            zod request + response schemas, inferred types
  income-statement.spec.ts       schema validation tests
packages/db/src/repositories/
  income-statement.ts            getTransactionsForYear(), getAvailableYears()
packages/db/src/
  income-statement.int.spec.ts   GATED reconciliation: clean output vs legacy procs (diff report)
packages/server/src/income-statement/
  types.ts                       PlTxnRow re-export (keeps the service runtime-pure)
  service.ts                     buildIncomeStatement(rows, req)  — PURE
  service.spec.ts                unit tests (fixtures)
  routes.ts                      GET /api/income-statement + /years (zod-validated, requireStaff + firm scope)
  routes.spec.ts                 app.request() + fake repo
packages/api-client/src/
  use-income-statement.ts        React Query hook
  use-income-statement.spec.ts   MSW
apps/web/src/routes/profit-loss/
  ProfitLossPage.tsx             year selector + KPIs + table + states
  PLTable.tsx                    sectioned 12-month table
  Kpi.tsx                        KPI tile
  ProfitLossPage.spec.tsx        MSW: loading/error/empty/success
apps/web/src/router.tsx          wire /reports/profit-loss stub → ProfitLossPage
```

---

## Contracts (`packages/contracts/src/income-statement.ts`)

**Request** (query params, coerced):
```ts
incomeStatementRequestSchema = {
  clientId: number (int, positive),   // = customer UserId from the switcher
  year:     number (int, e.g. 2025),
}
```

**Response:**
```ts
type Bucketed = { months: number[] /* length 12, Jan..Dec */, total: number };

IncomeStatement = {
  meta: { clientId: number, year: number, generatedAt: string /* ISO */ },
  sections: Array<{
    key: "income" | "cogs" | "expense",
    label: string,
    accounts: Array<{
      code: number,
      name: string,
      category: string | null,
      months: number[],   // length 12
      total: number,
    }>,
    subtotal: Bucketed,
  }>,
  grossProfit: Bucketed,   // income − cogs
  netIncome:   Bucketed,   // income − cogs − expenses
  kpis: { totalIncome: number, grossProfit: number, totalExpenses: number, netIncome: number },
};
```

- `months` arrays are always length 12 (zero-filled), Jan→Dec.
- All amounts are **natural presentation sign** (income +, expense +, COGS +, netIncome signed).
- Schema enforces `months.length === 12`. All amounts are `z.number().finite()` (reject `NaN`/`Infinity` from any float mishap). Types are `z.infer`-ed and shared server↔client.

## DB repository (`packages/db/src/repositories/income-statement.ts`)

Thin, typed Prisma queries (the test seam). No business logic.

- `clientInFirm(userId, firmClientId): Promise<boolean>`
  - `Users.findFirst({ UserId: userId, Client_Id: firmClientId, Is_Customer: true, Is_Active: true })`. The firm-scoping guard for the route. (AccountTransaction has no `Users` relation, so we can't fold the firm filter into the data query directly — hence an explicit membership check.)
- `getTransactionsForYear(userId, year): Promise<PlTxnRow[]>`
  - Joins `AccountTransaction` → `Accounts` via the `Account_Code` FK relation (see "deliberate differences"); `where` UserId, `Is_Active = true`, related `Account_Type IN ('Income','Expense','Cost of Goods Sold')`, `Posted_Date` in `[year-01-01, (year+1)-01-01)` (half-open UTC range). `Account_Type` is **trimmed** before the section match (legacy `RTRIM`s it; padded `NVarChar` values would otherwise silently drop rows).
  - Plus the uncategorized stream: active `UncategorizedEntries` for the user in range, projected to a synthetic Expense account (`code = -1`, name "Uncategorized Expense").
  - `PlTxnRow = { accountCode, accountName, accountCategory, accountType, postedMonth /* 1..12, UTC */, amount /* Decimal→number */ }`.
- `getAvailableYears(userId): Promise<number[]>`
  - Distinct `YEAR(Posted_Date)` across the same active, in-scope transactions (incl. uncategorized), descending. Drives the year selector and the default (first element). (v1 dedups in JS; a `SELECT DISTINCT YEAR(...)` raw query is a known cheaper follow-up.)

## Service (`packages/server/src/income-statement/service.ts`) — pure

`buildIncomeStatement(rows: PlTxnRow[], req: { clientId, year }): IncomeStatement`

1. Group rows by account (`accountCode`); bucket `amount` into `months[postedMonth-1]`.
2. Section by `accountType` (`Income`→income, `Cost of Goods Sold`→cogs, `Expense`→expense).
3. **Sign normalization:** multiply income amounts by −1 (legacy stores income negative) → income presents positive. COGS/Expense used as-is.
4. Section subtotals (month-wise + yearly). Sort accounts by name within a section; sections ordered income → cogs → expense.
5. `grossProfit = income − cogs`; `netIncome = income − cogs − expenses` (month-wise + yearly).
6. KPIs = yearly scalars.
7. Empty input → all sections present with empty `accounts` and zeroed subtotals/GP/NI/KPIs (drives the empty state; never an error).

## Route (`packages/server/src/income-statement/routes.ts`)

- `GET /api/income-statement` with `zValidator("query", incomeStatementRequestSchema)`. Also `GET /api/income-statement/years` with `clientId`.
- Middleware: `requireStaff` (v1). (Future customer self-view would relax this to `requireAuth` + "clientId must equal own userId unless staff".)
- **Firm scoping (both routes):** read `firmClientId` from `c.get("user")` (the token), then `if (!(await deps.clientInFirm(clientId, firmClientId))) throw new HTTPException(404, ...)` before fetching data. `clientId` from the query is never trusted on its own. A `404` (not `403`) avoids confirming the client exists in another firm.
- Handler: `repo.getTransactionsForYear(clientId, year)` → `buildIncomeStatement` → `incomeStatementSchema.parse(...)` → `c.json(...)`.
- Mounted `app.route("/api/income-statement", createIncomeStatementRoutes(deps))`; `AppType` picks it up automatically for RPC typing.

## API client (`packages/api-client/src/use-income-statement.ts`)

- `useIncomeStatement({ clientId, year, enabled })`: React Query, `queryKey: ["income-statement", clientId, year]`, calls the typed `hc<AppType>` client. Disabled until a client + year are selected.

## Web page (`apps/web/src/routes/profit-loss/`)

- `ProfitLossPage.tsx`: reads selected `clientId` from `ClientContext` (`useClient()`); a **year `<select>`** populated from available years (a small `useIncomeStatementYears` hook or a field on the response — see open question), default = latest; calls `useIncomeStatement`; renders:
  - **KPI tiles** (`Kpi.tsx`): Total Income, Gross Profit, Total Expenses, Net Income.
  - **`PLTable.tsx`**: sections (Income / COGS / Expenses) with account rows, section subtotals, then Gross Profit and Net Income rows; 12 month columns + Yearly Total column.
  - **States:** loading (skeleton), error (retry), empty (no data for client/year).
- Wire `router.tsx` `/reports/profit-loss` from `StubPage` to `ProfitLossPage`.
- The existing `packages/domain` `PROFIT_LOSS` mock is replaced by live data; contract-shaped fixtures back the MSW tests.

## Reconciliation (`packages/db/src/income-statement.int.spec.ts`) — gated, dev-only

- **Gate on the variables that actually drive the connection:** `RUN = process.env.RUN_DB_TESTS === "1" && !!process.env.MAC_DB_SERVER`. (Do **not** copy the `clients.int.spec.ts` `DATABASE_URL` gate — `DATABASE_URL` only feeds the Prisma CLI/`prisma.config.ts` and is empty in `.env.example`, so it would skip even when the DB is reachable.)
- **Oracle = proc 1 (`QBAutomation_ProfitLoss_TEST`) with uncategorized correctly mapped.** Critically, proc 1 tags uncategorized rows `Type = 'Uncategorized'` (not `'Expense'`), so the mirror must map `'Uncategorized' → Expense` before bucketing, to match our production convention. Comparing the two sides on the **same population** is the whole point — otherwise the Expense delta is just the uncategorized total and the report is meaningless.
- **Step 0: a 10-minute binding spike.** Confirm the exact working `prisma.$queryRawUnsafe('EXEC dbo.QBAutomation_ProfitLoss_TEST ...')` invocation under `@prisma/adapter-mssql` (positional `?` vs named `@p`) and write the verified form into the test. Don't ship a task whose core call is unproven.
- For `(UserId 2189, year 2025)`: EXEC proc 1 and build our totals from `getTransactionsForYear`; emit a **diff report** of per-type/section totals (and per-account where feasible) with absolute deltas.
- Expected, documented differences (do not flag as errors): the `Account_Code` vs `Account_ID` join key (some proc rows dropped/added), absence of weekly buckets. Apply a small tolerance (e.g. `|delta| < 0.01`) to absorb float/rounding noise.
- This is the comparison effort; its magnitude on the core totals drives the parity decision. **No production code path imports the procs.**

## Error / edge handling

| Case | Result |
|------|--------|
| Invalid/missing query params | 400 (zod) |
| Unauthenticated / not staff | 401 / 403 |
| `clientId` not in the caller's firm | 404 (no cross-firm disclosure) |
| Client in firm, but no transactions for the year | 200, empty sections (UI empty state) |
| Client has no years with data at all | 200 empty years; UI shows "no data for this client" |
| DB failure | 500 via existing error middleware |

## Testing

- **Service unit** (pure fixtures): sign-flip, month bucketing, subtotals, GP/NI, empty input, uncategorized inclusion.
- **Contract**: schema accept/reject; `months.length === 12` enforcement.
- **Route**: `app.request()` with a fake repo — 200 shape, 400 on bad/non-numeric params, 403 for non-staff, **404 for a client outside the caller's firm** (cross-firm guard).
- **Hook**: MSW success + error.
- **Page**: MSW-driven loading / error / empty / success.
- **Reconciliation**: gated integration diff (above).

## Out of scope (v1)

- Print view; arbitrary date ranges; non-calendar fiscal years; "Other Income/Other Expense" types; customer self-view; CSV/PDF export; comparison-to-prior-year columns.

## Open questions (non-blocking, resolve during planning)

1. **Available-years delivery:** resolved — a dedicated `GET /api/income-statement/years?clientId=` endpoint + `useIncomeStatementYears` hook, so the year selector populates before the full report is fetched.
2. **`$queryRawUnsafe` proc invocation** under `@prisma/adapter-mssql` — resolved into an explicit binding spike (Step 0 of the reconciliation task) rather than left open.
