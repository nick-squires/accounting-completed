# Income Statement Page Implementation Plan — DEFERRED

> ⚠️ **DEFERRED / NOT THE CURRENT PLAN.** Scope was narrowed to the backend + data foundation only (see `docs/superpowers/specs/2026-06-22-backend-data-foundation-design.md`). The income-statement *page* is parked until the foundation lands. This file is kept for its still-valuable research — the legacy `QBAutomation_ProfitLoss*` proc mapping, sign convention, and section/totals logic. **Do NOT execute as-is:** its data layer predates the Prisma decision (it uses raw `mssql`), so its db/contracts/api tasks are superseded by the foundation plan. Revisit and rewrite the page-specific parts on top of the foundation when we build the income statement.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the legacy Income Statement (Profit & Loss) page as a working full-stack vertical slice — existing Azure SQL (read-only, via existing stored procs) → `packages/db` → Hono API (`apps/api`) → shared zod contract → React Query data layer → `ProfitLossPage` — establishing the reusable DB/contract/backend/data-fetching patterns every later report page will follow.

**Architecture:** A Hono (Node/TS) server reads the income statement from two existing stored procedures (`QBAutomation_ProfitLoss_TEST`, `QBAutomation_ProfitLoss_MonthlySum_TEST`) via an `mssql` pool. A service normalizes signs and assembles a report-generic `IncomeStatement` validated against a zod contract shared by server and client. The web app fetches it through a typed React Query hook and renders KPI tiles + a 12-month trend table with loading/error/empty states. The service depends on a repository **interface** purely as a test seam (no shipped mock, no flag).

**Tech Stack:** Node ≥20, TypeScript (strict), Hono + `@hono/node-server` + `@hono/zod-validator`, `mssql` (tedious), `zod`, `@tanstack/react-query`, MSW (tests), Vitest + React Testing Library, Nx (`@nx/node`, `@nx/js`, `@nx/react`, `@nx/vite`), pnpm.

## Global Constraints

- **Package scope:** all internal packages are `@accounting-completed/<name>`.
- **Node ≥ 20; pnpm ≥ 9.** TypeScript `strict: true`; no `any` in committed code unless justified inline.
- **No database changes.** The existing DB is read-only here. We only EXECUTE existing stored procedures. No `CREATE`/`ALTER`/`INSERT`/`UPDATE`/`DELETE`, no migrations that mutate the DB.
- **No committed secrets.** DB credentials live in a git-ignored `.env`; `.env.example` documents the variable names only.
- **Module boundaries (Nx tags):** `scope:db`→[], `scope:contracts`→[], `scope:api-client`→`scope:contracts`, `apps/api` (`scope:api`)→`scope:db`,`scope:contracts`, `apps/web`→adds `scope:api-client`. `apps/web` MUST NOT import `apps/api` or `packages/db`.
- **Income sign convention:** rows whose proc `Type` is `Income` or `Other Income` are stored negative; the service multiplies them by `-1` so income presents positive (mirrors `Profit_Loss.aspx.cs`). Expense/COGS rows are used as-is. Monthly-sum proc rows are already correctly signed — do NOT flip them.
- **Legacy source of truth:** `MyAccountantsCloud/BrandedCloudAccountingWebsite/Pages/Reports/Profit_Loss.aspx.cs` and the two `QBAutomation_ProfitLoss*` procs. **Working DB credentials are in `MyAccountantsCloud/MacApi/Web.config` `DefaultConnection`** — DB `brandedcloudaccountingtest_shelby3`, user `application_login_prod`. (The WebForms `BrandedCloudAccountingWebsite/Web.config` creds are STALE → `ELOGIN`; do not use them.) Both procs take `@UserId int, @DateFrom date, @DateTo date`. Demo client: `UserId 2189` ("Dr. Reuben Montemagni, A Chiropractic Corporation"), FY 2025; demo firm `Client_Id 69`. (Verified via connectivity spike, 2026-06-22.)
- **Feature bar:** functional fidelity to the legacy income statement; not pixel fidelity.

---

## File Structure

```
accounting-completed/
├── .env                                   (git-ignored) real DB creds
├── .env.example                           documents env var names
├── docs/superpowers/notes/
│   └── income-statement-proc-notes.md     Task 1 artifact: proc shape + demo userId
├── apps/
│   ├── api/                               NEW Hono server
│   │   ├── project.json                   tags ["type:app","scope:api"]
│   │   ├── tsconfig*.json
│   │   ├── vite.config.ts                 vitest config for this project
│   │   └── src/
│   │       ├── main.ts                    @hono/node-server bootstrap
│   │       ├── app.ts                     Hono app, mounts routes, exports AppType
│   │       ├── env.ts                     reads + validates DB/server env
│   │       ├── income-statement/
│   │       │   ├── repository.ts          IncomeStatementRepository interface + live impl
│   │       │   ├── repository.live.ts     live impl calling packages/db
│   │       │   ├── service.ts             buildIncomeStatement(repo, req)
│   │       │   ├── service.spec.ts        unit tests w/ inline fake repo
│   │       │   ├── route.ts               Hono route, zod-validated
│   │       │   └── route.spec.ts          route test via app.request() + fake repo
│   └── web/                               (existing) — modified
│       └── src/
│           ├── app/providers.tsx          + QueryClientProvider
│           └── routes/profit-loss/
│               ├── ProfitLossPage.tsx     NEW
│               ├── ProfitLossPage.spec.tsx NEW (MSW)
│               ├── PLTable.tsx            NEW
│               ├── Kpi.tsx                NEW
│               └── pl-table.css           NEW (scoped table styles)
└── packages/
    ├── db/                                NEW
    │   ├── project.json                   tags ["type:lib","scope:db"]
    │   └── src/
    │       ├── index.ts
    │       ├── pool.ts                     mssql pool from env
    │       ├── income-statement.ts         proc wrappers + raw row types
    │       └── income-statement.int.spec.ts integration test (live DB)
    ├── contracts/                         NEW
    │   ├── project.json                   tags ["type:lib","scope:contracts"]
    │   └── src/
    │       ├── index.ts
    │       ├── income-statement.ts         zod schemas + inferred types
    │       └── income-statement.spec.ts
    └── api-client/                        NEW
        ├── project.json                   tags ["type:lib","scope:api-client"]
        └── src/
            ├── index.ts
            ├── client.ts                   fetchIncomeStatement()
            ├── use-income-statement.ts     React Query hook
            └── use-income-statement.spec.ts (MSW)
```

---

### Task 1: Workspace dependencies + DB connectivity spike

**Files:**
- Modify: `package.json`, `.gitignore`
- Create: `.env`, `.env.example`, `docs/superpowers/notes/income-statement-proc-notes.md`
- Create (throwaway, deleted at end of task): `scripts/spike-proc.mjs`

**Interfaces:**
- Produces: confirmed DB connectivity; a documented note file recording (a) exact result-set column names/casing for both procs, (b) the set of `Type` string values present, (c) a real `userId` with non-empty data to use as the demo client, (d) a working start/end date range.

- [ ] **Step 1: Install dependencies**

Run:
```bash
pnpm add -w hono @hono/node-server @hono/zod-validator zod mssql @tanstack/react-query
pnpm add -Dw @nx/node @types/mssql msw
```
Expected: all added; `pnpm-lock.yaml` updated. (Floors only; take newer stable and note bumps in the commit.)

- [ ] **Step 2: Add `.env` and `.env.example`** (creds copied from `MyAccountantsCloud/Web.config` `DefaultConnection`)

`.env` — copy the real values from `MyAccountantsCloud/MacApi/Web.config` → `connectionStrings` → `DefaultConnection` (`Server`, `Database`, `User ID`, `password`). The DB is `brandedcloudaccountingtest_shelby3`. (The WebForms `BrandedCloudAccountingWebsite/Web.config` creds are stale — `ELOGIN`.) **Never commit this file or the literal credentials.**
```
MAC_DB_SERVER=<server host from Web.config, e.g. ...database.windows.net>
MAC_DB_PORT=1433
MAC_DB_NAME=<database name from Web.config DefaultConnection>
MAC_DB_USER=<User ID from Web.config>
MAC_DB_PASSWORD=<password from Web.config>
MAC_DB_ENCRYPT=true
API_PORT=3001
```
`.env.example` (same keys, empty/placeholder values, no real password):
```
MAC_DB_SERVER=
MAC_DB_PORT=1433
MAC_DB_NAME=
MAC_DB_USER=
MAC_DB_PASSWORD=
MAC_DB_ENCRYPT=true
API_PORT=3001
```

- [ ] **Step 3: Ensure `.env` is git-ignored**

Confirm `.gitignore` contains a line `.env` (add it if absent). Verify: `git check-ignore .env` prints `.env`.

- [ ] **Step 4: Write the spike script**

`scripts/spike-proc.mjs`:
```js
import "dotenv/config";
import mssql from "mssql";

const cfg = {
  server: process.env.MAC_DB_SERVER,
  port: Number(process.env.MAC_DB_PORT),
  database: process.env.MAC_DB_NAME,
  user: process.env.MAC_DB_USER,
  password: process.env.MAC_DB_PASSWORD,
  options: { encrypt: process.env.MAC_DB_ENCRYPT === "true", trustServerCertificate: true },
  connectionTimeout: 60000,
  requestTimeout: 120000,
};

const pool = await mssql.connect(cfg);

// 1) find candidate demo clients
const users = await pool.request().query(
  "SELECT TOP 10 UserId, Company_Name, Full_Name FROM Users WHERE Is_Customer = 1 AND Is_Active = 1 AND Is_Locked = 0 ORDER BY UserId"
);
console.log("USERS:", JSON.stringify(users.recordset, null, 2));

// 2) run the two procs for the first candidate and a full-year range
const userId = users.recordset[0]?.UserId;
const start = "01/01/2025";
const end = "12/31/2025";

const rows = await pool.request()
  .input("UserId", mssql.Int, userId)
  .input("DateFrom", mssql.Date, new Date(start))
  .input("DateTo", mssql.Date, new Date(end))
  .execute("QBAutomation_ProfitLoss_TEST");
console.log("PROFITLOSS COLUMNS:", Object.keys(rows.recordset[0] ?? {}));
console.log("PROFITLOSS TYPES:", [...new Set(rows.recordset.map(r => (r.Type ?? "").trim()))]);
console.log("PROFITLOSS SAMPLE:", JSON.stringify(rows.recordset.slice(0, 3), null, 2));

const sums = await pool.request()
  .input("UserId", mssql.Int, userId)
  .input("DateFrom", mssql.Date, new Date(start))
  .input("DateTo", mssql.Date, new Date(end))
  .execute("QBAutomation_ProfitLoss_MonthlySum_TEST");
console.log("MONTHLYSUM COLUMNS:", Object.keys(sums.recordset[0] ?? {}));
console.log("MONTHLYSUM TYPES:", [...new Set(sums.recordset.map(r => (r.Type ?? "").trim()))]);
console.log("MONTHLYSUM ROWS:", JSON.stringify(sums.recordset, null, 2));

await pool.close();
```
Note: `pnpm add -Dw dotenv` if not already present.

- [ ] **Step 5: Run the spike**

Run: `node scripts/spike-proc.mjs`
Expected: prints a list of users, the two procs' exact column names, the set of `Type` values, and sample rows.
- If it errors with a firewall/login message: the dev IP is not whitelisted on Azure SQL — whitelist it (Azure portal → SQL server → Networking) and re-run before continuing.
- Pick a `userId` whose proc output has non-zero account rows; that is the **demo client** for later tasks. (Confirmed by the 2026-06-22 spike: `UserId 2189`, FY 2025.)

- [ ] **Step 6: Record findings**

Create `docs/superpowers/notes/income-statement-proc-notes.md` capturing, verbatim from the spike output: exact column names + casing for both procs (especially the month columns and the current-month/yearly total columns), the exact `Type` string values, the chosen demo `userId` and its company name, and the date range used. Later tasks reference this file for exact identifiers.

- [ ] **Step 7: Remove the throwaway spike + commit**

Run: `git rm -f scripts/spike-proc.mjs 2>/dev/null; rm -f scripts/spike-proc.mjs`
```bash
git add package.json pnpm-lock.yaml .gitignore .env.example docs/superpowers/notes/income-statement-proc-notes.md
git commit -m "chore: add api/db deps; document income-statement proc shape"
```
(Confirm `.env` is NOT staged: `git status` must not list `.env`.)

---

### Task 2: `packages/db` — mssql pool + income-statement proc wrappers

**Files:**
- Create: `packages/db/project.json`, `packages/db/package.json`, `packages/db/tsconfig*.json`, `packages/db/vite.config.ts`, `packages/db/src/index.ts`, `packages/db/src/pool.ts`, `packages/db/src/income-statement.ts`, `packages/db/src/income-statement.int.spec.ts`
- Modify: `tsconfig.base.json` (path alias)

**Interfaces:**
- Produces:
  - `getPool(): Promise<sql.ConnectionPool>` — lazily-initialized shared mssql pool from env.
  - `type PlAccountRow` — one raw row of `QBAutomation_ProfitLoss_TEST` (fields named per Task 1 notes; the canonical set used downstream: `Account_Code: number`, `Account_Name: string`, `Account_Category: string | null`, `Type: string`, monthly `Jan…Dec: number`, `Yearly_Total: number`).
  - `type PlSumRow` — one raw row of `QBAutomation_ProfitLoss_MonthlySum_TEST` (`Type: string`, monthly `Jan…Dec: number`, `Yearly_Total: number`).
  - `fetchProfitLossRows(userId: number, startDate: Date, endDate: Date): Promise<PlAccountRow[]>`
  - `fetchProfitLossMonthlySums(userId: number, startDate: Date, endDate: Date): Promise<PlSumRow[]>`

- [ ] **Step 1: Generate the library**

Run:
```bash
pnpm exec nx g @nx/js:library db --directory=packages/db --bundler=none --unitTestRunner=vitest --no-interactive
```
Expected: `packages/db` created with `src/index.ts` + a vitest target. Set `package.json` name to `@accounting-completed/db`. Set `project.json` `tags` to `["type:lib","scope:db"]`. Add alias to `tsconfig.base.json`: `"@accounting-completed/db": ["packages/db/src/index.ts"]`.

- [ ] **Step 2: Implement the pool**

`packages/db/src/pool.ts`:
```ts
import sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({
      server: requireEnv("MAC_DB_SERVER"),
      port: Number(process.env.MAC_DB_PORT ?? 1433),
      database: requireEnv("MAC_DB_NAME"),
      user: requireEnv("MAC_DB_USER"),
      password: requireEnv("MAC_DB_PASSWORD"),
      options: {
        encrypt: process.env.MAC_DB_ENCRYPT !== "false",
        trustServerCertificate: true,
      },
      connectionTimeout: 60000,
      requestTimeout: 120000,
    }).connect();
  }
  return poolPromise;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
```

- [ ] **Step 3: Implement the proc wrappers**

`packages/db/src/income-statement.ts` (adjust field names to match Task 1 notes if they differ):
```ts
import sql from "mssql";
import { getPool } from "./pool";

export interface PlAccountRow {
  Account_Code: number;
  Account_Name: string;
  Account_Category: string | null;
  Type: string;
  Jan: number; Feb: number; Mar: number; Apr: number; May: number; Jun: number;
  July: number; Aug: number; Sep: number; Oct: number; Nov: number; Dec: number;
  Yearly_Total: number;
}

export interface PlSumRow {
  Type: string;
  Jan: number; Feb: number; Mar: number; Apr: number; May: number; Jun: number;
  July: number; Aug: number; Sep: number; Oct: number; Nov: number; Dec: number;
  Yearly_Total: number;
}

async function execProc<T>(name: string, userId: number, startDate: Date, endDate: Date): Promise<T[]> {
  const pool = await getPool();
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .input("DateFrom", sql.Date, startDate)
    .input("DateTo", sql.Date, endDate)
    .execute<T>(name);
  return result.recordset;
}

export function fetchProfitLossRows(userId: number, startDate: Date, endDate: Date): Promise<PlAccountRow[]> {
  return execProc<PlAccountRow>("QBAutomation_ProfitLoss_TEST", userId, startDate, endDate);
}

export function fetchProfitLossMonthlySums(userId: number, startDate: Date, endDate: Date): Promise<PlSumRow[]> {
  return execProc<PlSumRow>("QBAutomation_ProfitLoss_MonthlySum_TEST", userId, startDate, endDate);
}
```

`packages/db/src/index.ts`:
```ts
export { getPool } from "./pool";
export * from "./income-statement";
```

- [ ] **Step 4: Write the integration test** (uses the demo `userId` from the notes file)

`packages/db/src/income-statement.int.spec.ts`:
```ts
import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { getPool } from "./pool";
import { fetchProfitLossRows, fetchProfitLossMonthlySums } from "./income-statement";

const DEMO_USER_ID = Number(process.env.MAC_DEMO_USER_ID ?? 0); // set in .env from Task 1 notes
const START = new Date("2025-01-01");
const END = new Date("2025-12-31");

describe.skipIf(!DEMO_USER_ID)("income-statement procs (integration)", () => {
  afterAll(async () => { (await getPool()).close(); });

  it("returns account rows with a Type and yearly total", async () => {
    const rows = await fetchProfitLossRows(DEMO_USER_ID, START, END);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(typeof rows[0].Type).toBe("string");
    expect(typeof rows[0].Yearly_Total).toBe("number");
  });

  it("returns monthly summary rows including Net Income", async () => {
    const sums = await fetchProfitLossMonthlySums(DEMO_USER_ID, START, END);
    const types = sums.map((s) => s.Type.trim());
    expect(types).toContain("Income");
    expect(types).toContain("Gross Profit");
  });
});
```
Add `MAC_DEMO_USER_ID=2189` to `.env`.

- [ ] **Step 5: Run the integration test**

Run: `pnpm exec nx run db:test`
Expected: PASS (or SKIPPED if `MAC_DEMO_USER_ID` unset — set it to run live). Adjust the `PlAccountRow`/`PlSumRow` field names if the spike notes showed different casing/spelling.

- [ ] **Step 6: Commit**

```bash
git add packages/db tsconfig.base.json .env.example
git commit -m "feat(db): mssql pool + income-statement stored-proc wrappers"
```

---

### Task 3: `packages/contracts` — zod schemas + inferred types

**Files:**
- Create: `packages/contracts/project.json`, `package.json`, `tsconfig*.json`, `vite.config.ts`, `src/index.ts`, `src/income-statement.ts`, `src/income-statement.spec.ts`
- Modify: `tsconfig.base.json`

**Interfaces:**
- Produces (from `@accounting-completed/contracts`):
  - `incomeStatementRequestSchema` (zod) + `type IncomeStatementRequest = { clientId: string; startDate: string; endDate: string }` (dates ISO `YYYY-MM-DD`).
  - `incomeStatementSchema` (zod) + `type IncomeStatement` with shape:
    `{ client: { id: string; name: string }, period: { startDate: string; endDate: string; currentMonth: number }, sections: SectionT[], grossProfit: LineT, netIncome: LineT, meta: { basis: "accrual"|"cash"; currency: string; lastRefreshed: string } }`
    where `LineT = { vals: number[]; ytd: number }`, `SectionT = { id: SectionId; label: string; accounts: AccountT[]; totals: number[]; ytd: number }`, `AccountT = { code: string; name: string; category: string | null; vals: number[]; ytd: number }`, `SectionId = "income"|"cogs"|"opex"|"other-income"|"other-expense"`.

- [ ] **Step 1: Generate the library**

Run:
```bash
pnpm exec nx g @nx/js:library contracts --directory=packages/contracts --bundler=none --unitTestRunner=vitest --no-interactive
```
Set `package.json` name `@accounting-completed/contracts`; `project.json` tags `["type:lib","scope:contracts"]`; add `tsconfig.base.json` alias `"@accounting-completed/contracts": ["packages/contracts/src/index.ts"]`. Add `zod` dep to this package's `package.json`.

- [ ] **Step 2: Write the failing test**

`packages/contracts/src/income-statement.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { incomeStatementRequestSchema, incomeStatementSchema } from "./income-statement";

describe("incomeStatementRequestSchema", () => {
  it("accepts a valid request", () => {
    const r = incomeStatementRequestSchema.parse({ clientId: "42", startDate: "2025-01-01", endDate: "2025-12-31" });
    expect(r.clientId).toBe("42");
  });
  it("rejects a bad date", () => {
    expect(() => incomeStatementRequestSchema.parse({ clientId: "42", startDate: "nope", endDate: "2025-12-31" })).toThrow();
  });
});

describe("incomeStatementSchema", () => {
  it("validates a minimal statement", () => {
    const v = incomeStatementSchema.parse({
      client: { id: "42", name: "Atlas" },
      period: { startDate: "2025-01-01", endDate: "2025-12-31", currentMonth: 5 },
      sections: [{ id: "income", label: "Income", accounts: [], totals: Array(12).fill(0), ytd: 0 }],
      grossProfit: { vals: Array(12).fill(0), ytd: 0 },
      netIncome: { vals: Array(12).fill(0), ytd: 0 },
      meta: { basis: "accrual", currency: "USD", lastRefreshed: "2026-06-22T00:00:00.000Z" },
    });
    expect(v.sections[0].id).toBe("income");
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm exec nx run contracts:test`
Expected: FAIL — `./income-statement` not found.

- [ ] **Step 4: Implement the schemas**

`packages/contracts/src/income-statement.ts`:
```ts
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const incomeStatementRequestSchema = z.object({
  clientId: z.string().min(1),
  startDate: isoDate,
  endDate: isoDate,
});
export type IncomeStatementRequest = z.infer<typeof incomeStatementRequestSchema>;

export const sectionIdSchema = z.enum(["income", "cogs", "opex", "other-income", "other-expense"]);
export type SectionId = z.infer<typeof sectionIdSchema>;

const lineSchema = z.object({ vals: z.array(z.number()).length(12), ytd: z.number() });
const accountSchema = z.object({
  code: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  vals: z.array(z.number()).length(12),
  ytd: z.number(),
});
const sectionSchema = z.object({
  id: sectionIdSchema,
  label: z.string(),
  accounts: z.array(accountSchema),
  totals: z.array(z.number()).length(12),
  ytd: z.number(),
});

export const incomeStatementSchema = z.object({
  client: z.object({ id: z.string(), name: z.string() }),
  period: z.object({ startDate: isoDate, endDate: isoDate, currentMonth: z.number().int().min(1).max(12) }),
  sections: z.array(sectionSchema),
  grossProfit: lineSchema,
  netIncome: lineSchema,
  meta: z.object({ basis: z.enum(["accrual", "cash"]), currency: z.string(), lastRefreshed: z.string() }),
});
export type IncomeStatement = z.infer<typeof incomeStatementSchema>;
export type IncomeStatementSection = z.infer<typeof sectionSchema>;
export type IncomeStatementAccount = z.infer<typeof accountSchema>;
export type IncomeStatementLine = z.infer<typeof lineSchema>;
```

`packages/contracts/src/index.ts`:
```ts
export * from "./income-statement";
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm exec nx run contracts:test`
Expected: PASS — all 4 assertions green.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts tsconfig.base.json
git commit -m "feat(contracts): income statement zod schemas + types"
```

---

### Task 4: Scaffold the Hono API app (`apps/api`)

**Files:**
- Create: `apps/api/project.json`, `apps/api/tsconfig*.json`, `apps/api/vite.config.ts`, `apps/api/src/main.ts`, `apps/api/src/app.ts`, `apps/api/src/env.ts`
- Modify: root `package.json` (scripts)

**Interfaces:**
- Produces: `nx run api:serve` running a Hono server on `API_PORT` (default 3001) with `GET /health` → `{ status: "ok" }`; an exported `app` (Hono instance) and `type AppType = typeof app` from `apps/api/src/app.ts`.

- [ ] **Step 1: Generate the node app**

Run:
```bash
pnpm exec nx g @nx/node:application api --directory=apps/api --framework=none --unitTestRunner=vitest --no-interactive
```
Expected: `apps/api` created with a `serve`/`build` target. Set `project.json` tags `["type:app","scope:api"]`. (If `@nx/node` flags differ, adapt; the deliverable is a buildable/serveable Node project at `apps/api`.)

- [ ] **Step 2: Env loader**

`apps/api/src/env.ts`:
```ts
import "dotenv/config";

export const env = {
  port: Number(process.env.API_PORT ?? 3001),
};
```

- [ ] **Step 3: Hono app with health route**

`apps/api/src/app.ts`:
```ts
import { Hono } from "hono";
import { cors } from "hono/cors";

export const app = new Hono();

app.use("*", cors());
app.get("/health", (c) => c.json({ status: "ok" }));

export type AppType = typeof app;
```

- [ ] **Step 4: Server bootstrap**

`apps/api/src/main.ts`:
```ts
import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";

serve({ fetch: app.fetch, port: env.port });
console.log(`api listening on http://localhost:${env.port}`);
```

- [ ] **Step 5: Add root dev scripts**

In root `package.json` `scripts`, add:
```json
"dev:api": "nx run api:serve",
"dev:all": "nx run-many -t serve dev --projects=api,web"
```
(Keep existing `dev` as `nx run web:dev`.)

- [ ] **Step 6: Verify it serves**

Run: `pnpm exec nx run api:serve` (start), then in another shell `curl -s http://localhost:3001/health`
Expected: `{"status":"ok"}`. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add apps/api package.json project.json nx.json tsconfig.base.json pnpm-lock.yaml
git commit -m "feat(api): scaffold hono server with health route"
```

---

### Task 5: Repository interface + service (TDD with inline fake repo)

**Files:**
- Create: `apps/api/src/income-statement/repository.ts`, `repository.live.ts`, `service.ts`, `service.spec.ts`
- Reference: `docs/superpowers/notes/income-statement-proc-notes.md` (exact `Type` strings)

**Interfaces:**
- Consumes: `PlAccountRow`, `PlSumRow`, `fetchProfitLossRows`, `fetchProfitLossMonthlySums` from `@accounting-completed/db`; `IncomeStatement`, `IncomeStatementRequest` from `@accounting-completed/contracts`.
- Produces:
  - `interface IncomeStatementRepository { getRows(userId, start, end): Promise<PlAccountRow[]>; getMonthlySums(userId, start, end): Promise<PlSumRow[]>; }`
  - `liveIncomeStatementRepository: IncomeStatementRepository` (wraps the db package).
  - `buildIncomeStatement(repo: IncomeStatementRepository, req: IncomeStatementRequest, clientName: string): Promise<IncomeStatement>`.

- [ ] **Step 1: Define the repository interface + live impl**

`apps/api/src/income-statement/repository.ts`:
```ts
import type { PlAccountRow, PlSumRow } from "@accounting-completed/db";

export interface IncomeStatementRepository {
  getRows(userId: number, start: Date, end: Date): Promise<PlAccountRow[]>;
  getMonthlySums(userId: number, start: Date, end: Date): Promise<PlSumRow[]>;
}
```

`apps/api/src/income-statement/repository.live.ts`:
```ts
import { fetchProfitLossRows, fetchProfitLossMonthlySums } from "@accounting-completed/db";
import type { IncomeStatementRepository } from "./repository";

export const liveIncomeStatementRepository: IncomeStatementRepository = {
  getRows: fetchProfitLossRows,
  getMonthlySums: fetchProfitLossMonthlySums,
};
```

- [ ] **Step 2: Write the failing service test** (inline fake repo; `Type` strings per legacy mapping)

`apps/api/src/income-statement/service.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { PlAccountRow, PlSumRow } from "@accounting-completed/db";
import type { IncomeStatementRepository } from "./repository";
import { buildIncomeStatement } from "./service";

const months = (jan = 0) => ({ Jan: jan, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, July: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0, Yearly_Total: jan });

function fakeRepo(rows: PlAccountRow[], sums: PlSumRow[]): IncomeStatementRepository {
  return { getRows: async () => rows, getMonthlySums: async () => sums };
}

describe("buildIncomeStatement", () => {
  it("flips the sign of income accounts so income presents positive", async () => {
    const rows: PlAccountRow[] = [
      { Account_Code: 4010, Account_Name: "Sales", Account_Category: null, Type: "Income", ...months(-1000) },
      { Account_Code: 5010, Account_Name: "COGS", Account_Category: null, Type: "Cost of Goods Sold", ...months(400) },
    ];
    const sums: PlSumRow[] = [
      { Type: "Income", ...months(1000) },
      { Type: "Gross Profit", ...months(600) },
      { Type: "Net Income", ...months(600) },
    ];
    const st = await buildIncomeStatement(fakeRepo(rows, sums), { clientId: "1", startDate: "2025-01-01", endDate: "2025-05-31" }, "Atlas");
    const income = st.sections.find((s) => s.id === "income")!;
    expect(income.accounts[0].vals[0]).toBe(1000); // -(-1000)
    const cogs = st.sections.find((s) => s.id === "cogs")!;
    expect(cogs.accounts[0].vals[0]).toBe(400); // unchanged
  });

  it("derives currentMonth from endDate and reads totals from the monthly-sum proc", async () => {
    const sums: PlSumRow[] = [
      { Type: "Income", ...months(1000) },
      { Type: "Gross Profit", ...months(600) },
      { Type: "Net Income", ...months(600) },
    ];
    const st = await buildIncomeStatement(fakeRepo([], sums), { clientId: "1", startDate: "2025-01-01", endDate: "2025-05-31" }, "Atlas");
    expect(st.period.currentMonth).toBe(5);
    expect(st.grossProfit.ytd).toBe(600);
    expect(st.netIncome.ytd).toBe(600);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm exec nx run api:test`
Expected: FAIL — `./service` not found.

- [ ] **Step 4: Implement the service**

`apps/api/src/income-statement/service.ts`:
```ts
import type { PlAccountRow, PlSumRow } from "@accounting-completed/db";
import type { IncomeStatement, IncomeStatementRequest, SectionId } from "@accounting-completed/contracts";
import type { IncomeStatementRepository } from "./repository";

const MONTH_KEYS = ["Jan","Feb","Mar","Apr","May","Jun","July","Aug","Sep","Oct","Nov","Dec"] as const;

// proc Type string -> our SectionId (+ display label + whether income-signed)
const SECTION_MAP: Record<string, { id: SectionId; label: string; income: boolean }> = {
  "Income": { id: "income", label: "Income", income: true },
  "Cost of Goods Sold": { id: "cogs", label: "Cost of Goods Sold", income: false },
  "Expense": { id: "opex", label: "Operating Expenses", income: false },
  "Other Income": { id: "other-income", label: "Other Income", income: true },
  "Other Expense": { id: "other-expense", label: "Other Expenses", income: false },
};
const SECTION_ORDER: SectionId[] = ["income", "cogs", "opex", "other-income", "other-expense"];

function rowVals(row: PlAccountRow | PlSumRow, flip: boolean): number[] {
  const sign = flip ? -1 : 1;
  return MONTH_KEYS.map((k) => (Number((row as Record<string, number>)[k]) || 0) * sign);
}
function sumVals(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}
function sumRowFor(sums: PlSumRow[], type: string): { vals: number[]; ytd: number } {
  const row = sums.find((s) => s.Type.trim() === type);
  if (!row) return { vals: Array(12).fill(0), ytd: 0 };
  const vals = rowVals(row, false);
  return { vals, ytd: Number(row.Yearly_Total) || 0 };
}

export async function buildIncomeStatement(
  repo: IncomeStatementRepository,
  req: IncomeStatementRequest,
  clientName: string,
): Promise<IncomeStatement> {
  const userId = Number(req.clientId);
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  const [rows, sums] = await Promise.all([
    repo.getRows(userId, start, end),
    repo.getMonthlySums(userId, start, end),
  ]);

  // group account rows into sections
  const sections = SECTION_ORDER.map((id) => {
    const meta = Object.values(SECTION_MAP).find((m) => m.id === id)!;
    const matched = rows.filter((r) => SECTION_MAP[r.Type.trim()]?.id === id);
    const accounts = matched.map((r) => {
      const vals = rowVals(r, meta.income);
      return {
        code: String(r.Account_Code),
        name: r.Account_Name,
        category: r.Account_Category,
        vals,
        ytd: meta.income ? -(Number(r.Yearly_Total) || 0) : (Number(r.Yearly_Total) || 0),
      };
    });
    const totals = accounts.reduce<number[]>((acc, a) => sumVals(acc, a.vals), Array(12).fill(0));
    const ytd = accounts.reduce((s, a) => s + a.ytd, 0);
    return { id, label: meta.label, accounts, totals, ytd };
  }).filter((s) => s.accounts.length > 0);

  const grossProfit = sumRowFor(sums, "Gross Profit");
  // legacy emits "Net Income" (final) — fall back to "Net Income (Or Loss)" if absent
  const netIncome = sums.some((s) => s.Type.trim() === "Net Income")
    ? sumRowFor(sums, "Net Income")
    : sumRowFor(sums, "Net Income (Or Loss)");

  return {
    client: { id: req.clientId, name: clientName },
    period: { startDate: req.startDate, endDate: req.endDate, currentMonth: end.getMonth() + 1 },
    sections,
    grossProfit,
    netIncome,
    meta: { basis: "accrual", currency: "USD", lastRefreshed: new Date().toISOString() },
  };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm exec nx run api:test`
Expected: PASS — both service tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/income-statement
git commit -m "feat(api): income statement repository seam + service (sign + sections)"
```

---

### Task 6: Hono route `/api/income-statement` (zod-validated)

**Files:**
- Create: `apps/api/src/income-statement/route.ts`, `route.spec.ts`
- Modify: `apps/api/src/app.ts` (mount the route)

**Interfaces:**
- Consumes: `buildIncomeStatement`, `liveIncomeStatementRepository`, `incomeStatementRequestSchema`, `incomeStatementSchema`.
- Produces: `GET /api/income-statement?clientId&startDate&endDate` → validated `IncomeStatement` JSON; a factory `createIncomeStatementRoute(repo, resolveClientName?)` so tests inject a fake repo; mounted on `app`, so `AppType` includes it.

- [ ] **Step 1: Write the failing route test** (fake repo via the factory)

`apps/api/src/income-statement/route.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { IncomeStatementRepository } from "./repository";
import { createIncomeStatementRoute } from "./route";

const months = (jan = 0) => ({ Jan: jan, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, July: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0, Yearly_Total: jan });
const repo: IncomeStatementRepository = {
  getRows: async () => [{ Account_Code: 4010, Account_Name: "Sales", Account_Category: null, Type: "Income", ...months(-1000) }],
  getMonthlySums: async () => [{ Type: "Income", ...months(1000) }, { Type: "Gross Profit", ...months(1000) }, { Type: "Net Income", ...months(1000) }],
};

const app = new Hono().route("/api/income-statement", createIncomeStatementRoute(repo, async () => "Atlas"));

describe("GET /api/income-statement", () => {
  it("returns a validated income statement", async () => {
    const res = await app.request("/api/income-statement?clientId=1&startDate=2025-01-01&endDate=2025-05-31");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.client.name).toBe("Atlas");
    expect(body.sections[0].accounts[0].vals[0]).toBe(1000);
  });
  it("400s on a bad request", async () => {
    const res = await app.request("/api/income-statement?clientId=1&startDate=bad&endDate=2025-05-31");
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec nx run api:test`
Expected: FAIL — `./route` not found.

- [ ] **Step 3: Implement the route factory**

`apps/api/src/income-statement/route.ts`:
```ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { incomeStatementRequestSchema, incomeStatementSchema } from "@accounting-completed/contracts";
import type { IncomeStatementRepository } from "./repository";
import { buildIncomeStatement } from "./service";

type ResolveClientName = (clientId: string) => Promise<string>;

export function createIncomeStatementRoute(
  repo: IncomeStatementRepository,
  resolveClientName: ResolveClientName = async (id) => `Client ${id}`,
) {
  return new Hono().get("/", zValidator("query", incomeStatementRequestSchema), async (c) => {
    const req = c.req.valid("query");
    const name = await resolveClientName(req.clientId);
    const statement = await buildIncomeStatement(repo, req, name);
    return c.json(incomeStatementSchema.parse(statement));
  });
}
```

- [ ] **Step 4: Mount it on the app**

In `apps/api/src/app.ts`, add:
```ts
import { createIncomeStatementRoute } from "./income-statement/route";
import { liveIncomeStatementRepository } from "./income-statement/repository.live";
// after app.get("/health", ...):
app.route("/api/income-statement", createIncomeStatementRoute(liveIncomeStatementRepository));
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm exec nx run api:test`
Expected: PASS — both route tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src
git commit -m "feat(api): GET /api/income-statement route with zod validation"
```

---

### Task 7: `packages/api-client` — typed client + React Query hook (TDD with MSW)

**Files:**
- Create: `packages/api-client/project.json`, `package.json`, `tsconfig*.json`, `vite.config.ts`, `src/index.ts`, `src/client.ts`, `src/use-income-statement.ts`, `src/use-income-statement.spec.ts`, `src/test-setup.ts`
- Modify: `tsconfig.base.json`

**Interfaces:**
- Consumes: `IncomeStatement`, `IncomeStatementRequest`, `incomeStatementSchema` from `@accounting-completed/contracts`.
- Produces:
  - `fetchIncomeStatement(params: IncomeStatementRequest, baseUrl?: string): Promise<IncomeStatement>` (validates response with the contract schema).
  - `useIncomeStatement(params: IncomeStatementRequest | null)` — React Query hook; disabled when `params` is null.
  - `incomeStatementQueryKey(params)`.

- [ ] **Step 1: Generate the library**

Run:
```bash
pnpm exec nx g @nx/react:library api-client --directory=packages/api-client --bundler=none --unitTestRunner=vitest --component=false --no-interactive
```
Set name `@accounting-completed/api-client`; tags `["type:lib","scope:api-client"]`; alias `"@accounting-completed/api-client": ["packages/api-client/src/index.ts"]`. Add deps `@tanstack/react-query`; the package depends on `@accounting-completed/contracts`.

- [ ] **Step 2: Implement the fetch client**

`packages/api-client/src/client.ts`:
```ts
import { incomeStatementSchema, type IncomeStatement, type IncomeStatementRequest } from "@accounting-completed/contracts";

const DEFAULT_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "";

export async function fetchIncomeStatement(params: IncomeStatementRequest, baseUrl = DEFAULT_BASE): Promise<IncomeStatement> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${baseUrl}/api/income-statement?${qs}`);
  if (!res.ok) throw new Error(`Income statement request failed: ${res.status}`);
  return incomeStatementSchema.parse(await res.json());
}
```

- [ ] **Step 3: Implement the hook**

`packages/api-client/src/use-income-statement.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import type { IncomeStatementRequest } from "@accounting-completed/contracts";
import { fetchIncomeStatement } from "./client";

export function incomeStatementQueryKey(params: IncomeStatementRequest) {
  return ["income-statement", params.clientId, params.startDate, params.endDate] as const;
}

export function useIncomeStatement(params: IncomeStatementRequest | null) {
  return useQuery({
    queryKey: params ? incomeStatementQueryKey(params) : ["income-statement", "disabled"],
    queryFn: () => fetchIncomeStatement(params as IncomeStatementRequest),
    enabled: params !== null,
  });
}
```

`packages/api-client/src/index.ts`:
```ts
export * from "./client";
export * from "./use-income-statement";
```

- [ ] **Step 4: Write the failing hook test** (MSW + a QueryClient wrapper)

`packages/api-client/src/use-income-statement.spec.ts`:
```ts
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { useIncomeStatement } from "./use-income-statement";

const sample = {
  client: { id: "1", name: "Atlas" },
  period: { startDate: "2025-01-01", endDate: "2025-05-31", currentMonth: 5 },
  sections: [{ id: "income", label: "Income", accounts: [], totals: Array(12).fill(0), ytd: 0 }],
  grossProfit: { vals: Array(12).fill(0), ytd: 0 },
  netIncome: { vals: Array(12).fill(0), ytd: 0 },
  meta: { basis: "accrual", currency: "USD", lastRefreshed: "2026-06-22T00:00:00.000Z" },
};

const server = setupServer(
  http.get("*/api/income-statement", () => HttpResponse.json(sample)),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useIncomeStatement", () => {
  it("fetches and validates the statement", async () => {
    const { result } = renderHook(() => useIncomeStatement({ clientId: "1", startDate: "2025-01-01", endDate: "2025-05-31" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.client.name).toBe("Atlas");
  });
});
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm exec nx run api-client:test`
Expected: PASS. (If the vitest config needs jsdom, set `environment: "jsdom"` in `packages/api-client/vite.config.ts` test block.)

- [ ] **Step 6: Commit**

```bash
git add packages/api-client tsconfig.base.json pnpm-lock.yaml
git commit -m "feat(api-client): typed income statement fetch + react-query hook"
```

---

### Task 8: Wire React Query provider + API base URL into the web app

**Files:**
- Modify: `apps/web/src/app/providers.tsx`, `apps/web/vite.config.ts`
- Create: `apps/web/.env.development` (or document `VITE_API_BASE_URL`)

**Interfaces:**
- Consumes: `@tanstack/react-query`.
- Produces: a `QueryClientProvider` wrapping the app so `useIncomeStatement` works; a Vite dev proxy so `/api/*` reaches the Hono server.

- [ ] **Step 1: Add QueryClientProvider**

`apps/web/src/app/providers.tsx`:
```tsx
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CLIENTS, type Role } from "@accounting-completed/domain";
import { RoleContext } from "./role-context";
import { ClientContext } from "./client-context";

export function AppProviders({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("staff");
  const [clientId, setClientId] = useState(CLIENTS[0].id);
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <RoleContext.Provider value={{ role, setRole }}>
        <ClientContext.Provider value={{ clientId, setClientId }}>{children}</ClientContext.Provider>
      </RoleContext.Provider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Add the dev proxy** to `apps/web/vite.config.ts` (inside `defineConfig`'s `server` block; create the block if absent):
```ts
  server: {
    // existing host/port keys stay
    proxy: { "/api": { target: "http://localhost:3001", changeOrigin: true } },
  },
```
With the proxy, `VITE_API_BASE_URL` stays empty (same-origin `/api`).

- [ ] **Step 3: Verify the app still boots**

Run: `pnpm exec nx run web:dev`
Expected: app compiles and `/dashboard` still renders (no behavior change yet). Stop.

- [ ] **Step 4: Commit**

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "feat(web): add react-query provider + /api dev proxy"
```

---

### Task 8.5: Real clients list (db query → contract → route → hook)

Establishes the same vertical pattern for a plain `SELECT` (not a stored proc), and gives the page a real client picker. Scoped to a firm via `Client_Id` (no auth yet; default firm `69`).

**Files:**
- Create: `packages/db/src/clients.ts`; modify `packages/db/src/index.ts`
- Create: `packages/contracts/src/clients.ts`; modify `packages/contracts/src/index.ts`
- Create: `apps/api/src/clients/route.ts`, `apps/api/src/clients/route.spec.ts`; modify `apps/api/src/app.ts`
- Create: `packages/api-client/src/clients.ts`; modify `packages/api-client/src/index.ts`

**Interfaces:**
- Produces:
  - db: `fetchClients(firmClientId: number): Promise<ClientRow[]>`, `ClientRow = { UserId: number; Company_Name: string | null; Full_Name: string }`.
  - contracts: `clientsResponseSchema` + `type ClientSummary = { id: string; name: string }`.
  - api: `GET /api/clients?firmClientId=69` → `ClientSummary[]`; factory `createClientsRoute(list?)`.
  - api-client: `fetchClients(firmClientId?, baseUrl?)`, `useClients(firmClientId?)`.

- [ ] **Step 1: db query** — `packages/db/src/clients.ts`:
```ts
import sql from "mssql";
import { getPool } from "./pool";

export interface ClientRow { UserId: number; Company_Name: string | null; Full_Name: string; }

export async function fetchClients(firmClientId: number): Promise<ClientRow[]> {
  const pool = await getPool();
  const result = await pool.request()
    .input("ClientId", sql.Int, firmClientId)
    .query<ClientRow>(
      "SELECT UserId, Company_Name, Full_Name FROM Users WHERE Client_Id = @ClientId AND Is_Customer = 1 AND Is_Active = 1 AND Is_Locked = 0 ORDER BY Company_Name, Full_Name"
    );
  return result.recordset;
}
```
Add to `packages/db/src/index.ts`: `export * from "./clients";`

- [ ] **Step 2: contract** — `packages/contracts/src/clients.ts`:
```ts
import { z } from "zod";
export const clientSummarySchema = z.object({ id: z.string(), name: z.string() });
export const clientsResponseSchema = z.array(clientSummarySchema);
export type ClientSummary = z.infer<typeof clientSummarySchema>;
```
Add to `packages/contracts/src/index.ts`: `export * from "./clients";`

- [ ] **Step 3: route + failing test** — `apps/api/src/clients/route.ts`:
```ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { clientsResponseSchema } from "@accounting-completed/contracts";
import { fetchClients, type ClientRow } from "@accounting-completed/db";

const querySchema = z.object({ firmClientId: z.coerce.number().int().default(69) });
type ListClients = (firmClientId: number) => Promise<ClientRow[]>;

export function createClientsRoute(list: ListClients = fetchClients) {
  return new Hono().get("/", zValidator("query", querySchema), async (c) => {
    const { firmClientId } = c.req.valid("query");
    const rows = await list(firmClientId);
    const clients = rows.map((r) => ({ id: String(r.UserId), name: (r.Company_Name?.trim() || r.Full_Name) }));
    return c.json(clientsResponseSchema.parse(clients));
  });
}
```
`apps/api/src/clients/route.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createClientsRoute } from "./route";

const app = new Hono().route("/api/clients", createClientsRoute(async () => [
  { UserId: 2189, Company_Name: "Dr. Reuben Montemagni, A Chiropractic Corporation", Full_Name: "Montemagni" },
  { UserId: 2243, Company_Name: "", Full_Name: "Amos, Jim" },
]));

describe("GET /api/clients", () => {
  it("maps rows to {id,name}, falling back to full name when company is blank", async () => {
    const res = await app.request("/api/clients?firmClientId=69");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0]).toEqual({ id: "2189", name: "Dr. Reuben Montemagni, A Chiropractic Corporation" });
    expect(body[1]).toEqual({ id: "2243", name: "Amos, Jim" });
  });
});
```
Run `pnpm exec nx run api:test` → fails (no `./route`), then passes after the file exists.

- [ ] **Step 4: mount** in `apps/api/src/app.ts`:
```ts
import { createClientsRoute } from "./clients/route";
// after the income-statement route:
app.route("/api/clients", createClientsRoute());
```

- [ ] **Step 5: api-client hook** — `packages/api-client/src/clients.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { clientsResponseSchema, type ClientSummary } from "@accounting-completed/contracts";

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "";

export async function fetchClients(firmClientId = 69, baseUrl = BASE): Promise<ClientSummary[]> {
  const res = await fetch(`${baseUrl}/api/clients?firmClientId=${firmClientId}`);
  if (!res.ok) throw new Error(`Clients request failed: ${res.status}`);
  return clientsResponseSchema.parse(await res.json());
}

export function useClients(firmClientId = 69) {
  return useQuery({ queryKey: ["clients", firmClientId], queryFn: () => fetchClients(firmClientId) });
}
```
Add to `packages/api-client/src/index.ts`: `export * from "./clients";`

- [ ] **Step 6: run + commit**

Run: `pnpm exec nx run-many -t test --projects=api,contracts,api-client`
Expected: PASS.
```bash
git add packages/db packages/contracts apps/api packages/api-client
git commit -m "feat: real clients list (db select -> contract -> route -> hook)"
```

---

### Task 9: Build `ProfitLossPage` (KPI tiles + trend table + states) and wire the route

**Files:**
- Create: `apps/web/src/routes/profit-loss/ProfitLossPage.tsx`, `PLTable.tsx`, `Kpi.tsx`, `pl-table.css`, `ProfitLossPage.spec.tsx`
- Modify: `apps/web/src/router.tsx` (swap `StubPage` → `ProfitLossPage` for `/reports/profit-loss`)
- Delete: `Profit & Loss.html`

**Interfaces:**
- Consumes: `useIncomeStatement`, `useClients` from `@accounting-completed/api-client`; `Card`, `CardHeader`, `CardTitle`, `CardFooter`, `Button`, `Input` from `@accounting-completed/ui`; `fmt`, `fmtPct` from `@accounting-completed/utils`; `ICONS` from `../../layout/icons`; `PageHeader` from `../../components/PageHeader`.
- Produces: `ProfitLossPage` rendered at `/reports/profit-loss`.

- [ ] **Step 1: Add scoped table CSS**

`apps/web/src/routes/profit-loss/pl-table.css` — port the `.pl-table` rules from `Profit & Loss.html`'s `<style>` block verbatim (the sticky first column, section/subtotal/gross/total row styling, `num`/`zero`/`neg`/`future`/`ytd`/`pct` cells, month header styles). Keep the class names (`pl-table`, `account-c`, `month-h`, `is-current`, `ytd-h`, `pct-h`, `section`, `subtotal`, `gross`, `total`, `num`, `zero`, `neg`, `future`, `pct`).

- [ ] **Step 2: KPI tile component**

`apps/web/src/routes/profit-loss/Kpi.tsx`:
```tsx
import { Card, Sparkline } from "@accounting-completed/ui";

export interface KpiProps { label: string; value: string; delta?: string; deltaLabel?: string; dir?: "up" | "down"; spark?: number[]; sparkColor?: string; }

export function Kpi({ label, value, delta, deltaLabel, dir = "up", spark, sparkColor }: KpiProps) {
  return (
    <Card>
      <div className="p-5 relative overflow-hidden">
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-soft mb-3">{label}</div>
        <div className="font-mono tnum text-[28px] leading-none font-medium tracking-tight mb-3">
          <span className="text-text-soft text-[0.7em] mr-1">$</span>{value}
        </div>
        {delta && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className={dir === "up" ? "text-positive font-mono tnum font-medium" : "text-destructive font-mono tnum font-medium"}>{delta}</span>
            <span>vs {deltaLabel}</span>
          </div>
        )}
        {spark && <div className="absolute right-4 top-4 opacity-70"><Sparkline values={spark} color={sparkColor} /></div>}
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Trend table component**

`apps/web/src/routes/profit-loss/PLTable.tsx`:
```tsx
import { useMemo } from "react";
import { fmt, fmtPct, cn } from "@accounting-completed/utils";
import type { IncomeStatement } from "@accounting-completed/contracts";
import "./pl-table.css";

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function numCell(val: number, current: number, monthIdx: number, isYtd = false) {
  const cls = ["num"];
  if (monthIdx + 1 > current) cls.push("future");
  if (val === 0) cls.push("zero");
  if (val < 0) cls.push("neg");
  if (isYtd) cls.push("ytd");
  return <td key={isYtd ? "ytd" : `m${monthIdx}`} className={cls.join(" ")}>{fmt(val)}</td>;
}

export function PLTable({ data }: { data: IncomeStatement }) {
  const current = data.period.currentMonth;
  const incomeYtd = useMemo(() => data.sections.find((s) => s.id === "income")?.ytd ?? 0, [data]);
  const pct = (n: number) => (incomeYtd ? n / incomeYtd : 0);

  return (
    <div className="overflow-auto">
      <table className="pl-table">
        <thead>
          <tr>
            <th className="account-h">Account</th>
            {MONTHS.map((m, i) => (
              <th key={m} className={cn("month-h", i + 1 === current && "is-current")} style={{ minWidth: 84 }}>{m} <span className="opacity-60">{data.period.endDate.slice(2, 4)}</span></th>
            ))}
            <th className="ytd-h" style={{ minWidth: 100 }}>YTD</th>
            <th className="pct-h">% Inc.</th>
          </tr>
        </thead>
        <tbody>
          {data.sections.map((sec) => (
            <SectionRows key={sec.id} sec={sec} current={current} pct={pct} />
          ))}
          <tr className="total">
            <td className="account-c">Net income</td>
            {data.netIncome.vals.map((v, i) => numCell(v, current, i))}
            <td className="num ytd">{fmt(data.netIncome.ytd)}</td>
            <td className="pct">{fmtPct(pct(data.netIncome.ytd))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  function SectionRows({ sec, current, pct }: { sec: IncomeStatement["sections"][number]; current: number; pct: (n: number) => number }) {
    const isGross = false;
    return (
      <>
        <tr className="section"><td className="account-c">{sec.label}</td>{Array.from({ length: 14 }).map((_, i) => <td key={i} />)}</tr>
        {sec.accounts.map((a) => (
          <tr key={a.code} className="account-row">
            <td className="account-c"><span className="text-text-soft font-mono text-[11px] mr-2.5">{a.code}</span>{a.name}</td>
            {a.vals.map((v, i) => numCell(v, current, i))}
            {numCell(a.ytd, current, 0, true)}
            <td className="pct">{fmtPct(pct(a.ytd))}</td>
          </tr>
        ))}
        <tr className={cn(isGross ? "gross" : "subtotal")}>
          <td className="account-c">Total {sec.label}</td>
          {sec.totals.map((v, i) => numCell(v, current, i))}
          {numCell(sec.ytd, current, 0, true)}
          <td className="pct">{sec.id === "income" ? "100.0%" : fmtPct(pct(sec.ytd))}</td>
        </tr>
        {sec.id === "cogs" && (
          <tr className="gross">
            <td className="account-c">Gross profit</td>
            {data.grossProfit.vals.map((v, i) => numCell(v, current, i))}
            <td className="num ytd">{fmt(data.grossProfit.ytd)}</td>
            <td className="pct">{fmtPct(pct(data.grossProfit.ytd))}</td>
          </tr>
        )}
      </>
    );
  }
}
```
Note: `cn` must be exported from `@accounting-completed/utils` (it is). Keep the gross-profit row emitted right after the COGS subtotal, matching the legacy order.

- [ ] **Step 4: The page (with date range + states)**

`apps/web/src/routes/profit-loss/ProfitLossPage.tsx`:
```tsx
import { useState } from "react";
import { useIncomeStatement, useClients } from "@accounting-completed/api-client";
import { Card, CardHeader, CardTitle, CardFooter, Button, Input } from "@accounting-completed/ui";
import { ICONS } from "../../layout/icons";
import { PageHeader } from "../../components/PageHeader";
import { Kpi } from "./Kpi";
import { PLTable } from "./PLTable";

const usd = (n: number) => Math.round(n).toLocaleString("en-US");

export function ProfitLossPage() {
  const { data: clients } = useClients();
  const [clientId, setClientId] = useState("2189"); // demo client (Montemagni); switcher below lists real firm clients
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const query = useIncomeStatement({ clientId, startDate, endDate });
  const clientName = clients?.find((c) => c.id === clientId)?.name ?? query.data?.client.name ?? "…";

  const totals = query.data
    ? {
        income: query.data.sections.find((s) => s.id === "income")?.ytd ?? 0,
        expenses: (query.data.sections.find((s) => s.id === "cogs")?.ytd ?? 0) + (query.data.sections.find((s) => s.id === "opex")?.ytd ?? 0),
        gross: query.data.grossProfit.ytd,
        net: query.data.netIncome.ytd,
      }
    : null;

  return (
    <div>
      <PageHeader
        title="Income statement trend analysis"
        sub={`${clientName} · ${startDate} → ${endDate}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-8 rounded-md border border-border bg-card px-2 text-[13px]">
              {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[150px]" />
            <span className="text-text-soft">→</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[150px]" />
            <Button onClick={() => query.refetch()}>{ICONS.refresh}<span>Refresh</span></Button>
          </div>
        }
      />

      {totals && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Kpi label="Total income · YTD" value={usd(totals.income)} />
          <Kpi label="Total expenses · YTD" value={usd(totals.expenses)} />
          <Kpi label="Gross profit · YTD" value={usd(totals.gross)} />
          <Kpi label="Net income · YTD" value={usd(totals.net)} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Income statement</CardTitle>
        </CardHeader>
        {query.isLoading && <div className="p-10 text-center text-muted-foreground">Loading income statement…</div>}
        {query.isError && <div className="p-10 text-center text-destructive">Couldn’t load the income statement. <button className="underline" onClick={() => query.refetch()}>Retry</button></div>}
        {query.isSuccess && query.data.sections.length === 0 && <div className="p-10 text-center text-muted-foreground">No activity for this period.</div>}
        {query.isSuccess && query.data.sections.length > 0 && <PLTable data={query.data} />}
        <CardFooter>
          <span className="text-[12.5px] text-muted-foreground">{query.data ? `Last refreshed ${new Date(query.data.meta.lastRefreshed).toLocaleTimeString()} · ${query.data.meta.basis} basis` : ""}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
```
Note: the page owns client selection via `useClients` (real DB clients for firm `69`), defaulting `clientId` to demo client `2189`. The global Sidebar client switcher still uses mock domain `CLIENTS`; rewiring it to real clients is deferred (Follow-on #5).

- [ ] **Step 5: Write the page test (MSW)**

`apps/web/src/routes/profit-loss/ProfitLossPage.spec.tsx`:
```tsx
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { ProfitLossPage } from "./ProfitLossPage";

const sample = {
  client: { id: "1", name: "Atlas Coffee" },
  period: { startDate: "2025-01-01", endDate: "2025-12-31", currentMonth: 5 },
  sections: [{ id: "income", label: "Income", accounts: [{ code: "4010", name: "Sales", category: null, vals: [1000,0,0,0,0,0,0,0,0,0,0,0], ytd: 1000 }], totals: [1000,0,0,0,0,0,0,0,0,0,0,0], ytd: 1000 }],
  grossProfit: { vals: [1000,0,0,0,0,0,0,0,0,0,0,0], ytd: 1000 },
  netIncome: { vals: [1000,0,0,0,0,0,0,0,0,0,0,0], ytd: 1000 },
  meta: { basis: "accrual", currency: "USD", lastRefreshed: "2026-06-22T00:00:00.000Z" },
};
const server = setupServer(
  http.get("*/api/clients", () => HttpResponse.json([{ id: "2189", name: "Atlas Coffee" }])),
  http.get("*/api/income-statement", () => HttpResponse.json(sample)),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ProfitLossPage />
    </QueryClientProvider>
  );
}

describe("ProfitLossPage", () => {
  it("renders the client name and a KPI value after load", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Atlas Coffee/)).toBeTruthy());
    expect(screen.getByText("Total income · YTD")).toBeTruthy();
  });
  it("renders the Sales account row", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Sales")).toBeTruthy());
  });
});
```

- [ ] **Step 6: Wire the route + run the page test**

In `apps/web/src/router.tsx`: `import { ProfitLossPage } from "./routes/profit-loss/ProfitLossPage";` and change the `/reports/profit-loss` child to `element: <ProfitLossPage />` (keep its `handle`).

Run: `pnpm exec nx run web:test`
Expected: PASS — both page tests green.

- [ ] **Step 7: Verify live in the browser** (API + web running)

Run `pnpm exec nx run api:serve` and `pnpm exec nx run web:dev`; open `/reports/profit-loss`.
Expected: KPI tiles + trend table populated from the live DB for the demo client; date inputs refetch; loading/error states behave when the API is stopped.

- [ ] **Step 8: Delete the legacy mockup + commit**

```bash
git rm "Profit & Loss.html"
git add apps/web
git commit -m "feat(web): port income statement page to live data; remove legacy html"
```

---

### Task 10: Module-boundary tags, lint constraints, and full verification gate

**Files:**
- Modify: `eslint.config.mjs` (add depConstraints for new scopes), each new `project.json` (confirm tags), `apps/web/project.json` (no tag change; web already `scope:web`)
- Modify: `apps/web-e2e` smoke spec (extend)

**Interfaces:**
- Produces: enforced boundaries (`web` cannot import `api`/`db`); all targets green.

- [ ] **Step 1: Add dep constraints**

In `eslint.config.mjs` `@nx/enforce-module-boundaries` `depConstraints`, add:
```js
{ sourceTag: "scope:db", onlyDependOnLibsWithTags: [] },
{ sourceTag: "scope:contracts", onlyDependOnLibsWithTags: [] },
{ sourceTag: "scope:api-client", onlyDependOnLibsWithTags: ["scope:contracts"] },
{ sourceTag: "scope:api", onlyDependOnLibsWithTags: ["scope:db", "scope:contracts"] },
{ sourceTag: "scope:web", onlyDependOnLibsWithTags: ["scope:ui", "scope:domain", "scope:utils", "scope:theme", "scope:api-client", "scope:contracts"] },
```
(Merge with the existing `scope:web` entry rather than duplicating — extend its allowed list.)

- [ ] **Step 2: Run lint to confirm boundaries hold**

Run: `pnpm exec nx run-many -t lint`
Expected: PASS — no boundary violations (web reaches the API only through `api-client`/`contracts`).

- [ ] **Step 3: Extend the e2e smoke**

Add to the Playwright smoke spec a test that navigates to `/reports/profit-loss` and asserts the heading "Income statement trend analysis" is visible. If CI has no DB access, intercept `**/api/income-statement` with a fixture via `page.route` so the assertion is deterministic.

- [ ] **Step 4: Full verification gate**

Run: `pnpm exec nx run-many -t lint test build` and `pnpm exec nx run web-e2e:e2e`
Expected: all green. (The `db:test` integration test runs live or skips per `MAC_DEMO_USER_ID`.)

- [ ] **Step 5: Commit**

```bash
git add eslint.config.mjs apps
git commit -m "chore: enforce module boundaries for api/db/contracts; extend e2e smoke"
```

---

## Follow-on work (separate plans)

Deferred legacy features, each its own plan, reusing the layers established here:
1. **Drill-down** — click a cell/account → transactions for that account + period (new proc/endpoint + reuse of the data-fetching pattern).
2. **Comparison columns** — prior period / prior year, $ and % change (the legacy `GetProfitLossStatement` shape).
3. **Footnotes/notes** — DB-backed `FootNotes` (first WRITE path — revisit the read-only constraint).
4. **Export + print route** — CSV/Excel + `/reports/profit-loss/print`.
5. **Global client switcher + auth** — the income statement page now lists real clients (firm `69`); rewire the Sidebar/`ClientContext` switcher to real clients app-wide, and add real auth/session (currently none; firm id is hardcoded).

## Self-Review notes

- **Spec coverage:** stack (T1,T4), existing-DB read via procs (T1,T2), no DB changes (constraints + T2 read-only), zod contract single-source (T3), repository seam no-mock (T5), Hono route + shared types (T6), data-fetching layer/React Query (T7,T8), page with states (T9), module boundaries (T10), testing split — integration/unit/MSW/e2e (T2,T5,T6,T7,T9,T10), secrets in env (T1), feature scope §8 in-scope items (T9), deferred items listed (Follow-on). 
- **Known execution risks:** (a) exact proc column casing/spelling — resolved by the Task 1 spike, with `PlAccountRow`/`PlSumRow` adjusted to match; (b) `@nx/node`/`@nx/js` generator flags can drift — each generator step states its expected deliverable so the executor adapts; (c) the demo `clientId` must be a real `UserId` — handled via Task 1 notes + the Task 9 default-value note; the real client switcher is deferred.
- **Type consistency:** `IncomeStatement`/section/account/line shapes are defined once in T3 and consumed unchanged in T5/T6/T7/T9; `IncomeStatementRepository` signature is identical across T5/T6; `useIncomeStatement` param/return match the contract.
