# Income Statement Vertical Slice — Design Spec

**Date:** 2026-06-22
**Repo:** `accounting-completed`
**Status:** Approved for planning
**Supersedes (locally):** the "frontend only, mock data" decision in `2026-06-17-monorepo-conversion-design.md`. This slice adds a real backend + live database read path. All other foundation decisions still hold.

## 1. Goal

Rebuild the legacy **Income Statement (Profit & Loss)** page as a working, full-stack vertical slice — database → backend → typed contract → data-fetching → page. The income statement is intentionally the first page because it is *derived* data, which forces us to build the real reusable layers rather than a one-off. The patterns established here are the template every later report page reuses (Balance Sheet, General Ledger, General Journal — all aggregations over the same ledger).

The bar is **functional fidelity to the legacy page**, not pixel fidelity to either the legacy markup or the prototype mockup. The prototype informs look/feel and component vocabulary; the legacy page defines the capabilities.

## 2. Source of truth

- **Legacy page:** `BrandedCloudAccountingWebsite/Pages/Reports/Profit_Loss.aspx` (+ `.aspx.cs`, `Scripts/Custom/profitloss_TEST.js`) in the `MyAccountantsCloud` repo. Titled "Income statement trend analysis."
- **Data is produced by existing stored procedures** in the existing Azure SQL database (no schema changes):
  - `QBAutomation_ProfitLoss_TEST(userId, startDate, endDate)` → per-account rows with monthly values (Jan–Dec), weekly columns, current-month total, yearly total. Columns include `Account_ID, Account_Code, Account_Name, Account_Category, Type, Jan…Dec, Current_Month_Total, Yearly_Total`.
  - `QBAutomation_ProfitLoss_MonthlySum_TEST(userId, startDate, endDate)` → section totals (income, expenses, gross profit, net income) by month + YTD.
- **Connection (verified 2026-06-22):** working credentials are in `MyAccountantsCloud/MacApi/Web.config` → `DefaultConnection` — DB `brandedcloudaccountingtest_shelby3` on `brandedcloudaccounting.database.windows.net` (Azure SQL), user `application_login_prod`. The legacy WebForms `BrandedCloudAccountingWebsite/Web.config` creds are stale (`ELOGIN`). Used read-only; network/firewall is open from the dev machine. Both procs take `@UserId int, @DateFrom date, @DateTo date`. Demo client `UserId 2189`, FY 2025; demo firm `Client_Id 69`.
- **Accounting sign convention:** income accounts are stored negated (credit = negative) in the legacy data; the service normalizes signs so income is presented positive (matches `Profit_Loss.aspx.cs` `* -1` handling).

## 3. Locked decisions

| Decision | Choice |
|---|---|
| Backend runtime | **Node + TypeScript**, **Hono** web server, in the monorepo at `apps/api` |
| Database | **Existing Azure SQL** (`brandedcloudaccountingtest`), **read-only, no schema changes** |
| DB access | `mssql` (tedious) connection pool; calls existing stored procedures |
| Data model | The existing general ledger feeds the report via existing procs — no new tables |
| Contract | **zod schemas as single source of truth** for request/response types *and* runtime validation, shared by server + client (`packages/contracts`) |
| Type sharing | Contract package is the shared type source; Hono RPC (`hc`) may layer on top, but the zod contract is canonical (keeps Nx lib boundaries clean) |
| Repository | One real implementation (calls procs). A thin **interface seam** exists only so the service is unit-testable with an in-test fake. **No shipped mock implementation, no runtime switch flag.** |
| "DB schema + migrations" layer | Establish typed proc bindings + convention: additive schema changes continue to live in the existing `Mac.Database` SQL project (schema source of truth). No Node-side mutations in this slice. |
| Feature bar | Functional fidelity to legacy; not pixel fidelity |

## 4. Target layout (new pieces)

```
accounting-completed/
├── apps/
│   ├── web/                         (existing)
│   └── api/                         NEW — Hono server (Node/TS)
│       ├── src/
│       │   ├── main.ts              server bootstrap (@hono/node-server)
│       │   ├── app.ts               Hono app + route mounting (+ exported AppType)
│       │   └── routes/
│       │       └── income-statement.ts   route → service, zod-validated I/O
│       └── project.json             tags: ["type:app", "scope:api"]
└── packages/
    ├── db/                          NEW — DB client + stored-proc bindings
    │   └── src/
    │       ├── pool.ts              mssql connection pool (config from env)
    │       └── procs/income-statement.ts   typed wrappers for the two procs
    ├── contracts/                   NEW — zod schemas + inferred types
    │   └── src/income-statement.ts  request/response schemas + types
    ├── api-client/                  NEW — typed fetch client + React Query hooks
    │   └── src/income-statement.ts  useIncomeStatement() hook
    ├── domain/  ui/  theme/  utils/ (existing)
```

The income-statement **service** (route → service → repository) lives in `apps/api/src` for this slice; if a second report reuses service logic it can graduate to a package later (YAGNI now).

## 5. Module boundaries (Nx tags)

New scope constraints added to `eslint.config.mjs`:

- `scope:db` → depends on nothing (no other libs).
- `scope:contracts` → depends on nothing.
- `scope:api-client` → may depend on `scope:contracts` only.
- `apps/api` (`scope:api`) → may depend on `scope:db`, `scope:contracts`.
- `apps/web` → may additionally depend on `scope:api-client` (+ existing ui/domain/utils/theme).
- `apps/web` MUST NOT import from `apps/api` or `packages/db` directly — only through `api-client` + `contracts`.

## 6. Data flow

```
Azure SQL (existing procs)
  → packages/db (mssql pool + typed proc wrappers)
    → repository interface (apps/api)            ← in-test fake injected here for unit tests
      → income-statement service (sign-normalize, build sections, compute gross/net, % of income)
        → Hono route (validates request + response against contracts zod)
          → HTTP (JSON)
            → packages/api-client (typed fetch + React Query useIncomeStatement)
              → ProfitLossPage (KPI tiles + trend table + states)
```

## 7. Contract shape (sketch)

Request: `{ clientId: string; startDate: ISODate; endDate: ISODate }`.
Response: an `IncomeStatement` —
```
{
  client: { id, name },
  period: { startDate, endDate, currentMonth },
  sections: Array<{ id: "income"|"cogs"|"opex"|"other-income"|"other-expense",
                    label, accounts: Array<{ code, name, vals: number[12], ytd }>,
                    totals: number[12], ytd }>,
  grossProfit: { vals: number[12], ytd },
  netIncome:   { vals: number[12], ytd },
  meta: { basis: "accrual"|"cash", currency: "USD", lastRefreshed }
}
```
% of income is computed client-side from `ytd` values (presentation concern). The shape is report-generic enough to extend to comparison columns later.

## 8. Income statement feature scope

**In scope (functional, live-data):**
- **Real client picker** on the page, populated by a live clients-list endpoint (firm `Client_Id 69`), + start/end date range control.
- 12-month trend table: account rows grouped by section, section subtotals, **Gross Profit** (accent), **Net Income** (double-rule), YTD column, **% of income** column.
- Number formatting via `@accounting-completed/utils` `fmt`/`fmtPct` (zero → "—", negatives in parens, tabular nums); future/current-month styling.
- KPI tiles: Total income · Total expenses · Gross profit · Net income (YTD).
- **Loading / error / empty** states (real now that data is live).
- Refresh.

**Deferred (real legacy features → backlog, not silently dropped):**
- Drill-down from a cell/account to underlying transactions.
- Comparison columns (prior period / prior year, $ and % change).
- Footnotes / notes (DB-backed `FootNotes`).
- CSV/Excel export; the separate print route (`/reports/profit-loss/print`); weekly columns; per-month reconciliation checkboxes.

## 9. Testing

- **Repository:** integration test against the live `brandedcloudaccountingtest` DB (proc returns expected shape).
- **Service:** unit tests with an inline fake repository — deterministic, no network (sign normalization, gross/net math, % of income, section assembly, future-month handling).
- **Contract:** zod parse/round-trip tests.
- **Hook/page:** React Testing Library + **MSW** at the HTTP boundary (loading/error/empty/success); no DB.
- **e2e:** extend Playwright smoke so `/reports/profit-loss` renders the live table (or an MSW-backed fixture if CI lacks DB access).

## 10. Configuration & secrets

- DB connection comes from **env vars** (`MAC_DB_SERVER`, `MAC_DB_NAME`, `MAC_DB_USER`, `MAC_DB_PASSWORD`, `MAC_DB_ENCRYPT`) read by `packages/db`. A `.env.example` documents them; real `.env` is git-ignored. Do **not** commit credentials.
- Web app calls the API via a base URL env (`VITE_API_BASE_URL`), defaulting to the local Hono port in dev (Vite proxy).

## 11. Risks

- **Azure SQL firewall / network**: first task is a connectivity spike; if blocked, whitelist the dev IP before proceeding (developer confirms access).
- **A valid `userId` for the test DB**: the procs take a userId; we must identify a real client/user in the test data to exercise the live path. Captured as an early plan task.
- **Proc result shape drift**: the integration test pins the columns we rely on.

## 12. Out of scope

- No schema changes / migrations that mutate the existing DB.
- No auth/session rebuild (the slice assumes a selected client; real auth is a separate effort).
- No second report page (the pattern is proven here, applied later).
- Deferred features in §8.
