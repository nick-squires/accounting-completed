# Backend + Data Foundation — Design Spec

**Date:** 2026-06-22
**Repo:** `accounting-completed`
**Branch:** `feat/backend-data-foundation`
**Status:** Decisions partly locked; open questions in §10 still to explore before planning
**Supersedes (locally):** the "frontend only, mock data" decision in `2026-06-17-monorepo-conversion-design.md`. The income-statement *page* is deferred (see `docs/superpowers/plans/…-income-statement-page-DEFERRED.md`).

## 1. Goal

Stand up the **backend + data foundation** for the rebuild: a Node/TypeScript API that reads the **existing** MyAccountantsCloud database through a real ORM, exposes typed endpoints, and is consumed by a typed data-fetching layer in the React app — establishing the reusable patterns (DB access, contract, service/repository, API, data fetching, config, testing, CI) every later feature reuses.

**Proven by a real consumer, not a toy:** the foundation is validated end-to-end by the **clients list** — the existing `Users` table → Prisma → repository → contract → API → typed hook → the app's real client switcher. No income-statement work in this effort.

The bar is **foundation-grade on every layer** — not a minimum slice.

## 2. Database (existing; read-only; verified 2026-06-22)

- **Working credentials live in `MyAccountantsCloud/MacApi/Web.config` → `DefaultConnection`** — server `brandedcloudaccounting.database.windows.net,1433` (Azure SQL), DB `brandedcloudaccountingtest_shelby3`, user `application_login_prod`. (The legacy WebForms `BrandedCloudAccountingWebsite/Web.config` creds are stale → `ELOGIN`.)
- **No schema changes.** Prisma is used in **introspect-only** mode against this DB. The existing `MyAccountantsCloud/Mac.Database` SQL project remains the schema source of truth; any future additive change goes there, not via Prisma migrate (see §10).
- Connectivity, auth, and Prisma introspection were **verified** from the dev machine: `prisma db pull` introspected **38 models** (manageable), including `Users`. Network/firewall is open.
- Clients list query: `Users WHERE Is_Customer = 1 AND Is_Active = 1 AND Is_Locked = 0`, scoped by `Client_Id` (the accounting firm). Demo firm `Client_Id 69`.

## 3. Locked decisions

| Decision | Choice |
|---|---|
| Backend runtime | **Node + TypeScript**, **Hono** web server |
| ORM | **Prisma (latest stable, v7.8.0)** via the **`@prisma/adapter-mssql`** driver adapter (export `PrismaMssql`) + `prisma.config.ts`; introspect-only |
| Database | **Existing Azure SQL** (`brandedcloudaccountingtest_shelby3`), read-only, no schema changes |
| Contract / types | **zod schemas as single source of truth** (runtime validation + types) in `packages/contracts`, **plus Hono RPC (`hc<AppType>`)** for path/param type-safety — both, composed |
| Server structure | Hono app + routes + services + repositories live in a **library** (`packages/server`) that exports `AppType`; `apps/api` is a thin runtime that mounts it (keeps RPC type-sharing within Nx lib boundaries) |
| Data access | Repository pattern over Prisma; stored procs (future) via typed `$queryRaw` + zod result schemas |
| Frontend data layer | **React Query** hooks in `packages/api-client`, built on the Hono RPC client + contract validation |
| Proving consumer | **Clients list** end-to-end, wired into the real Sidebar/`ClientContext` switcher (replacing mock `CLIENTS`) |
| Scope | **Foundation only.** Income-statement page deferred. |

## 4. Prisma 7 setup (verified specifics)

- `schema.prisma`: `generator client { provider = "prisma-client"; output = "../generated/prisma" }` and `datasource db { provider = "sqlserver" }` — **no `url` in the datasource** (v7 change).
- `prisma.config.ts`: `defineConfig({ schema, migrations: { path }, datasource: { url: env("DATABASE_URL") } })` with `import "dotenv/config"`.
- `DATABASE_URL` format (SQL Server): `sqlserver://HOST:1433;database=DB;user=USER;password=PWD;encrypt=true;trustServerCertificate=true`.
- Runtime client: `new PrismaClient({ adapter: new PrismaMssql(sqlConfig) })` from `@prisma/adapter-mssql` (engine type is `client`; an adapter is mandatory in v7).
- Packages: `prisma`, `@prisma/client`, `@prisma/adapter-mssql`, `dotenv` (+ `@types/mssql`).
- **pnpm v11 gotcha:** approve build scripts (`pnpm.onlyBuiltDependencies` incl. `esbuild`, Prisma engines) or `prisma`/`nx` invocations fail the deps-status check.
- **Introspection workflow:** `prisma db pull` → commit `schema.prisma` (+ generated client is build-time via `prisma generate`, not committed).

## 5. Target layout (new pieces)

```
packages/
  db/                 Prisma schema + generated client + repository(ies)
    prisma/schema.prisma, prisma.config.ts, generated/
    src/{client.ts (PrismaClient singleton via PrismaMssql), repositories/clients.ts, index.ts}
  contracts/          zod schemas + inferred types (clients now)
  server/             Hono app, routes, services, repositories wiring; exports `app` + `AppType`
    src/{app.ts, routes/clients.ts, env.ts}
  api-client/         hc<AppType> typed client + React Query hooks (useClients)
apps/
  api/                thin runtime: @hono/node-server bootstrap importing packages/server
  web/                + QueryClientProvider, /api dev proxy, real client switcher wired to useClients
```
(`packages/db` depends on nothing else; `contracts` on nothing; `server` on `db`+`contracts`; `api-client` on `contracts` + type-only `server` (for `AppType`); `web` on `api-client`+`contracts`. `web` must not import `server`/`db`/`api` at runtime.)

## 6. Proving consumer — clients list (end-to-end)

`Users` (Prisma) → `ClientsRepository.list(firmClientId)` → `clients` service → Hono `GET /api/clients` (zod-validated, RPC-typed) → `useClients()` (React Query) → the **real Sidebar client switcher** lists live clients and drives `ClientContext`. This exercises every layer with real data.

## 7. Configuration & secrets

- DB connection via env (`DATABASE_URL` + the adapter's discrete `MAC_DB_*` if we keep the mssql config object). Git-ignored `.env`; `.env.example` documents keys; **no committed secrets** (the working creds live in memory + `MacApi/Web.config`).
- API base URL for the web app via `VITE_API_BASE_URL` (empty in dev; Vite proxies `/api` → Hono).

## 8. Module boundaries

New Nx scope tags + `enforce-module-boundaries` constraints: `scope:db`→[], `scope:contracts`→[], `scope:server`→[`scope:db`,`scope:contracts`], `scope:api-client`→[`scope:contracts`,`scope:server`(type-only)], `scope:api`→[`scope:server`], `scope:web`→adds [`scope:api-client`,`scope:contracts`].

## 9. Testing strategy (foundation)

- **Repository:** integration test against the live test DB (read-only).
- **Service/route:** unit/route tests with an in-test fake repository (deterministic; via `app.request()`).
- **Contract:** zod parse/round-trip.
- **Hook:** React Testing Library + **MSW** at the HTTP boundary.
- **e2e:** Playwright smoke that the client switcher lists real clients (or an MSW fixture if CI lacks DB access — see §10).

## 10. Open foundational questions (to explore before planning)

These are deliberately **not** decided yet — they shape the foundation and need discussion:

1. **Auth / identity / session** — there is none yet; firm `Client_Id` is hardcoded (69). How do real users authenticate, and how is "current firm/client" derived (vs. a query param)?
2. **Authorization / multi-tenancy** — role-based access (legacy `RoleAccess`), scoping every query to the caller's firm/clients.
3. **API error contract** — standard error shape, status mapping, validation-error format.
4. **Logging / observability** — structured logs, request logging, error tracking, correlation Ids.
5. **Config & secrets management** — env validation (zod), dev/prod split, secret storage (Key Vault?).
6. **Stored-proc convention** — a reusable typed wrapper for the many legacy report procs (Prisma raw + zod), since procs aren't first-class in Prisma.
7. **Migrations governance** — confirm Prisma stays introspect-only; the `Mac.Database` SQL project owns schema; drift/re-pull process.
8. **CI/CD + deployment** — Nx targets, `prisma generate` in CI, pnpm build approval, whether CI can reach the DB (Azure firewall), and where the Hono API is hosted.
9. **API structure / versioning** — `/api/v1`?, route organization, how the RPC client is exposed.
10. **Domain reconciliation** — the existing mock `packages/domain` types vs real DB-derived types.

## 11. Out of scope

- Income-statement page and its stored procs (deferred; research preserved in the DEFERRED plan + memory).
- Schema mutations / migrations against the existing DB.
- Anything in §10 not explicitly promoted into the foundation plan after discussion.
