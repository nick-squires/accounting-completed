# Remove fake/static data from the site

**Date:** 2026-06-23
**Status:** Approved (design)

## Goal

Strip every fabricated value currently presented to users as if it were real
data. Where a real endpoint already exists, wire the UI to it. Where no endpoint
exists yet, show an honest empty/loading state while keeping the real UI shell.

This is a cleanup pass, not a feature build: no new feature backends are created.
The only backend change is one additive extension of the existing `/me` payload,
using data the database query already fetches.

## Principle

> Nothing fabricated may be shown as real. Prefer real data → then honest empty
> states → never a plausible-looking lie.

## Scope summary

Fake/static data lives in a few concentrated places. The ~12 generic "stub"
routes already render an honest `"{Title} — coming soon"` placeholder via
`apps/web/src/routes/_stub/StubPage.tsx` and contain **no fake data**, so they
are out of scope.

| Area | Fake data to remove |
|---|---|
| Backend `/me` | (enabler) no display name available → expose real name |
| Sidebar | mock identity "Scott Turner / Senior bookkeeper", mock `CLIENTS` fallback, nav badge counts 42/3/28 |
| Dashboard | 28 mock clients, activity feed, deadlines, "7 new feeds", "Good morning, Scott", "Thursday · May 28", `owner === "Scott T."` filter |
| Transactions | 15 mock transactions, tab counts (42/1284/18), "similar transactions" panel, "Atlas Coffee Roasters" header |
| Login | demo email prefill, fake testimonial, feature pills |
| `packages/domain/src/data/` | `PROFIT_LOSS` (unused), `WORKLOAD_CLIENTS`/`ACTIVITY`/`DEADLINES`, `TRANSACTIONS`, `CLIENTS` |

## Detailed design

### 1. Backend — expose real identity on `/me`

The `/me` route returns the JWT payload (`SessionUser`), currently
`{ userId, username, firmClientId, roles }` — no display name. The users repo
query (`packages/db/src/repositories/users.ts`) already selects `Full_Name` and
`Company_Name`, so exposing them is a minimal additive change.

- Add `fullName: string | null` and `companyName: string | null` to the
  `SessionUser` contract type (`packages/contracts`).
- Map them in `toSessionUser` (`packages/server/src/auth/routes.ts`):
  `fullName: u.Full_Name ?? null, companyName: u.Company_Name ?? null`.
- These flow through login → JWT → `/me` automatically.
- Update `packages/server/src/auth/routes.spec.ts` to assert the new fields.

### 2. Sidebar (`apps/web/src/layout/Sidebar.tsx`, `packages/domain/src/nav.ts`, `apps/web/src/app/providers.tsx`)

- **Identity** (footer name/initials/title, brand firm label): drive from real
  `useMe()`:
  - name = `me.fullName` (fall back to `me.username`),
  - initials = existing `deriveInitials(name)`,
  - firm label = `me.companyName` (fall back to existing generic "Cloud Accounting"),
  - role title = derived from `me.roles` (e.g. `isStaff` → "Firm staff",
    `isEmployee` → "Employee", else "Business owner").
  Stop reading `ROLES[...].user` / `ROLES[...].firm` for display.
- **`canSwitchClient`**: derive from `me.roles.isStaff` (consistent with the
  existing `isStaff` usage in this file).
- **Client switcher button**: for staff, show the real selected client from
  `useClients()`. While loading, show a neutral "Loading…"/skeleton rather than
  `CLIENTS[0]`. Remove the mock `CLIENTS` fallback entirely.
- **Nav badge counts**: remove the static `count: 42 / 3 / 28` fields from `NAV`
  in `nav.ts` (no real source → no badge rendered).
- **Initial client id** (`providers.tsx`): seed `clientId` as `null` instead of
  `CLIENTS[0].id`. The existing effect in `Sidebar.tsx` already promotes to the
  first real client once `useClients()` resolves.
- **`ROLES`**: trim to the policy fields still referenced, or remove if fully
  unused after the above. Keep the `Role` type / `navForRole` / `GROUPS`
  machinery (structural, not user-visible fake data).
- Update `Sidebar.spec.tsx` to assert real `/me`-driven identity and the absence
  of static counts.

### 3. Dashboard (`apps/web/src/routes/dashboard/DashboardPage.tsx`)

- **Greeting**: real — time-of-day from the current hour, the current date, and
  the real user `fullName` from `useMe()`.
- **Workload card**: wire to real `useClients()`. Render the real client list
  (name + initials) and drop the fabricated `openTasks` / `owner` / `industry` /
  `sparkline` / `flag`. Loading skeleton while fetching; empty state if none.
- **KPI tiles + metric subtitle**: **removed.** The four tiles (needs review,
  open tasks, new bank items, books up to date) and the "N open items across M
  clients … need review today" subtitle have no data source. Replace the
  subtitle with a real one driven by the client count (e.g. "Managing N
  clients"), or a neutral line.
- **Deadlines + Activity cards**: no endpoint → honest empty states
  ("No upcoming deadlines", "No recent activity") inside the existing card
  shells.
- Remove the `WORKLOAD_CLIENTS` / `ACTIVITY` / `DEADLINES` imports and the
  `owner === "Scott T."` filter logic.

### 4. Transactions (`apps/web/src/routes/transactions/TransactionsPage.tsx`)

- Remove the `TRANSACTIONS` mock import, the hardcoded tab counts
  (42 / 1284 / 18 / 1344), the inline "similar transactions" array, and the
  "Atlas Coffee Roasters · 42 to review" header text.
- Keep the real shell: tabs (without counts), search/filters, table columns, and
  the existing "Nothing selected" detail-panel empty state.
- Header uses the real selected client name (client context + `useClients()`).
- Empty table body → "No transactions yet" empty state.
- No `/transactions` endpoint is built — out of scope.

### 5. Dead code / mock data cleanup (`packages/domain/src/data/`)

- Delete `profit-loss.ts` (`PROFIT_LOSS` — already unused; the P&L page uses the
  real `useIncomeStatement()` API).
- Delete `dashboard.ts`, `transactions.ts`, and `clients.ts` once unreferenced,
  along with their now-unused type exports (`WorkloadClient`, `ActivityItem`,
  `DeadlineItem`, `Transaction`, `TxnConfidence`, and the mock `Client` shape if
  unused).
- Update the `packages/domain` barrel/exports accordingly.

### 6. Login (`apps/web/src/routes/login/LoginPage.tsx`)

- Clear the demo email prefill — the email field starts empty.
- Remove the fake "Adelina Costa" testimonial and tidy the resulting layout gap.
- Remove the "Bank feeds / Auto-categorize / Multi-client / Audit trail" feature
  pills.
- Update `LoginPage.spec.tsx` to match.

## Out of scope

- The 12 generic stub routes (already honest "coming soon" placeholders).
- New feature endpoints: `/transactions`, `/activity`, `/deadlines`,
  bank-feed counts, etc.
- The role-switcher machinery (`Role` type, `navForRole`) beyond removing the
  unused mock identity personas.

## Testing

- `packages/server/src/auth/routes.spec.ts`: assert `/me` returns `fullName` /
  `companyName`.
- `Sidebar.spec.tsx`: assert identity comes from `/me` (not the old mock
  "Scott Turner" / "Records in Order" / "ST"); assert no static nav counts.
- `DashboardPage.spec.tsx` (new/updated): real greeting, client list from
  `useClients()`, empty states for deadlines/activity, no fabricated KPI tiles.
- `TransactionsPage.spec.tsx`: empty-state body, no mock counts, real client
  name in header.
- `LoginPage.spec.tsx`: empty email, no testimonial, no feature pills.

## Definition of done

- No fabricated value is rendered as real anywhere in `apps/web`.
- `packages/domain/src/data/` mock files are deleted; no dangling imports.
- All updated specs pass; typecheck and lint clean across the workspace.
