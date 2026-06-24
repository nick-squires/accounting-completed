# Data-Hydration Breadth Pass — Design

**Date:** 2026-06-24
**Status:** Approved (design); pending implementation plan

## Goal

Turn four dead/stub frontend pages into real, data-backed pages to demonstrate
the value of the migration to Scott. Optimize for **breadth over depth**: each
page becomes genuinely real, but shallow (read-only / light interactivity). No
new infrastructure, no database schema changes.

## Context

The rebuild (`apps/web` + `packages/{contracts,db,server,api-client}`) already
has a working vertical-slice pattern, exemplified by the income-statement
feature:

```
repository (packages/db)  ->  contract / zod schema (packages/contracts)
  ->  route (packages/server)  ->  react-query hook (packages/api-client)
  ->  page (apps/web)
```

Current data state:

- **Real:** Login, Dashboard (greeting + client list), Profit & Loss, Clients list.
- **Built but empty:** Transactions page (full UI, wired to nothing — shows
  "No transactions yet").
- **Stubs ("— coming soon"):** Bank feeds, Balance Sheet, General Ledger,
  General Journal, Chart of Accounts, Categories, Staff, Settings, Plans,
  System Health, etc.

Rich DB data exists but is unexposed: the full `AccountTransaction` ledger, the
`Accounts` table (balances, types, institutions), `AccountTransactionUpdateHistory`
(audit log), `UncategorizedEntries`, classes, profiles, subscriptions.

Every new endpoint follows the established conventions: staff-role required, and
the target client must belong to the caller's firm (the `clientInFirm` guard used
by income-statement).

## Domain note

"Client" is overloaded (see `packages/contracts/DOMAIN.md`): it means the **firm**
in the DB/auth layer and a **customer of the firm** in the API/UI layer. All
per-client data below is scoped by the customer's `UserId`; firm-wide data is
scoped by the caller's `firmClientId`.

## Scope — four pages

### 1. Transactions (flagship)

- **Repository:** `getTransactionsForYear(userId, year)` — active
  `AccountTransaction` rows, each tagged with a derived `status`:
  - `categorized` — has `Category_Name` (or `Is_Approve` true)
  - `excluded` — `IsArchived` true
  - `review` — otherwise; plus `UncategorizedEntries` rows unioned in as `review`
- **Contract:** `Transaction { id, postedDate, payee, memo, amount, category,
  checkNumber, account, status }`.
- **Endpoint:** `GET /api/transactions?clientId&year`. Default to the latest year
  with data (mirror the P&L years pattern).
- **Page:** render the real ledger in the existing table. **Tabs**
  (Review / Categorized / Excluded / All) filter by `status`. **Search box**
  filters client-side on payee/memo. No editing. (Decision: "real data, light
  interactivity" — all filtering client-side after one fetch.)

### 2. Chart of Accounts

- **Repository:** `list(userId)` — active `Accounts`, ordered by `Display_Position`.
- **Contract:** `Account { code, name, type, category, balance, bankAccountType,
  currency, status, institution? }`.
- **Endpoint:** `GET /api/accounts?clientId`.
- **Page:** replace the stub with a table grouped by `Account_Type`, balances
  shown with per-group subtotals.

### 3. Dashboard activity feed

- **Repository:** `recentActivity(firmClientId, limit)` — recent
  `AccountTransactionUpdateHistory` joined to the acting user, scoped to the
  firm's clients.
- **Contract:** `ActivityItem { when, actor, action, detail }` — e.g.
  "Recategorized *Office Depot* → Office Supplies".
- **Endpoint:** `GET /api/activity?limit=N`.
- **Page:** fill the empty "Recent activity" card on the Dashboard.
- **Deadlines card:** no deadline data exists in the DB — leave it as a clean
  empty state rather than fabricate data. (Approved.)

### 4. Balance Sheet — spike-gated

- **Spike first:** query distinct `Account_Type` values and check whether
  `Accounts.Balance` is populated and meaningful for asset/liability/equity
  accounts (vs. only bank-account balances).
- **If GL-style balances exist:** build a real statement — Assets / Liabilities /
  Equity sections with subtotals and an A = L + E check, paralleling the P&L page.
- **If only bank balances:** descope to an honest "Account Balances by Type"
  view (still real data, not labeled a reconciled statement).
- Report which path was taken before building the page. (Approved.)

## Non-goals

- No editing / mutations on any page (read-only or client-side filtering only).
- No server-side pagination/filtering for Transactions this pass (one fetch per
  year, filter in the browser).
- No fabricated data anywhere — empty states stay empty where data is absent
  (e.g. Dashboard deadlines).
- No unrelated refactoring of existing pages.

## Testing

- Each slice gets a route spec mirroring `packages/server/src/auth/routes.spec.ts`
  (auth/firm-scope guards + happy path), with repositories exercised.
- Page-level smoke tests where existing pages already have them.

## Sequencing

Transactions -> Chart of Accounts -> Dashboard activity -> Balance Sheet (spike).
Impact-per-effort order; the heaviest / riskiest page is last.

## Risks

- **Balance Sheet data shape** is the main unknown — mitigated by the up-front
  spike and the descope fallback.
- **Transaction volume** per year could be large for a fully client-side filter;
  acceptable for this demo pass, revisit with server-side filtering if needed.
