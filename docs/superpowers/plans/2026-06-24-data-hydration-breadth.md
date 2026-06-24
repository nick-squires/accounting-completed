# Data-Hydration Breadth Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hydrate four dead/stub frontend pages (Transactions, Chart of Accounts, Dashboard activity feed, Balance Sheet) with real data from the existing database to demonstrate migration value.

**Architecture:** Each page is a vertical slice following the existing income-statement template: a Prisma repository (`packages/db`) → a Zod contract (`packages/contracts`) → a Hono route, optionally with a pure service for transforms (`packages/server`) → a React Query hook (`packages/api-client`) → the page (`apps/web`). Routes are staff-only and guard that the requested client belongs to the caller's firm. No schema changes, no mutations.

**Tech Stack:** TypeScript, Nx monorepo (pnpm), Prisma (SQL Server), Hono + `@hono/zod-validator`, Hono RPC client, TanStack Query, React 19, Vitest, Zod 4.

## Global Constraints

- **Package manager / runner:** pnpm + Nx. Test a project with `pnpm nx test <project>` (projects: `server`, `db`, `contracts`, `api-client`, `web`). Filter to one suite with `pnpm nx test <project> -- -t "<describe text>"`. Build/typecheck with `pnpm nx build <project>`.
- **Firm-scope guard:** every per-client route must call `requireStaff` and reject a client not in the caller's firm with **HTTP 404** (not 403), reusing the existing `incomeStatementRepository.clientInFirm(userId, firmClientId)` guard wired in `app.ts`.
- **Domain vocabulary:** "client" in the API/UI = a *customer of the firm* (a `Users` row with `Is_Customer`), scoped by that customer's `UserId`. The firm tenant is `firmClientId` / `Client_Id`. See `packages/contracts/DOMAIN.md`. Per-client data is queried by the customer's `UserId`; firm-wide data by `firmClientId`.
- **Money:** amounts come from Prisma `Decimal`; convert with `Number(x ?? 0)`. Zod money fields use `z.number().finite()` to reject NaN/Infinity.
- **Dates:** repositories return JS `Date`; routes/services serialize to ISO strings with `.toISOString()`. Year bucketing uses half-open UTC ranges `[year-01-01, (year+1)-01-01)`.
- **No fabricated data:** where data is absent, render a clean empty state (e.g. Dashboard "deadlines").
- **Mounting order:** new routes are added to the chained `app.route(...)` calls in `packages/server/src/app.ts` so `AppType` carries them for RPC inference. Each new repo is re-exported from `packages/db/src/index.ts`; each new contract from `packages/contracts/src/index.ts`; each new hook from `packages/api-client/src/index.ts`.

---

## Task 1: Transactions — backend slice

**Files:**
- Create: `packages/contracts/src/transactions.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/db/src/repositories/transactions.ts`
- Modify: `packages/db/src/index.ts`
- Create: `packages/server/src/transactions/types.ts`
- Create: `packages/server/src/transactions/service.ts`
- Create: `packages/server/src/transactions/routes.ts`
- Modify: `packages/server/src/app.ts`
- Test: `packages/server/src/transactions/service.spec.ts`
- Test: `packages/server/src/transactions/routes.spec.ts`

**Interfaces:**
- Consumes: `requireStaff` from `../middleware/request-context`; `signSession` from `../auth/jwt`; reused guard `incomeStatementRepository.clientInFirm`.
- Produces:
  - Contract types `Transaction`, `TransactionStatus`, `TransactionsResponse`, schemas `transactionsResponseSchema`, `transactionsYearsSchema`, `transactionsRequestSchema`, `transactionsYearsRequestSchema`.
  - `transactionsRepository.listForYear(userId, year): Promise<RawTxnRow[]>` and `.availableYears(userId): Promise<number[]>`.
  - Server `toTransactionsResponse(rows, meta)` and `deriveStatus(row)`.
  - Endpoints `GET /api/transactions?clientId&year` and `GET /api/transactions/years?clientId`.

- [ ] **Step 1: Write the contract**

Create `packages/contracts/src/transactions.ts`:

```typescript
import { z } from "zod";

export const transactionsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().gte(1990).lte(2999),
});
export type TransactionsRequest = z.infer<typeof transactionsRequestSchema>;

export const transactionsYearsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

export const transactionStatusSchema = z.enum(["review", "categorized", "excluded"]);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

const amount = z.number().finite();

export const transactionSchema = z.object({
  id: z.number(),
  postedDate: z.string(), // ISO
  payee: z.string().nullable(),
  memo: z.string().nullable(),
  amount,
  category: z.string().nullable(),
  checkNumber: z.string().nullable(),
  account: z.string().nullable(),
  status: transactionStatusSchema,
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionsResponseSchema = z.object({
  meta: z.object({ clientId: z.number(), year: z.number(), generatedAt: z.string() }),
  transactions: z.array(transactionSchema),
});
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;

export const transactionsYearsSchema = z.object({ years: z.array(z.number()) });
export type TransactionsYears = z.infer<typeof transactionsYearsSchema>;
```

Add to `packages/contracts/src/index.ts`:

```typescript
export * from "./transactions";
```

- [ ] **Step 2: Write the repository**

Create `packages/db/src/repositories/transactions.ts`:

```typescript
import { prisma } from "../client";

// Raw row: repository returns DB fields; status derivation lives in the server
// service so it can be unit-tested without a database.
export interface RawTxnRow {
  id: number;
  postedDate: Date;
  payee: string | null;
  memo: string | null;
  amount: number;
  categoryName: string | null;
  checkNumber: string | null;
  account: string | null;
  isApprove: boolean | null;
  isArchived: boolean;
  isActive: boolean | null;
  source: "ledger" | "uncategorized";
}

// Half-open UTC range [year-01-01, (year+1)-01-01)
function yearRange(year: number) {
  return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
}

export const transactionsRepository = {
  async listForYear(userId: number, year: number): Promise<RawTxnRow[]> {
    const range = yearRange(year);

    const txns = await prisma.accountTransaction.findMany({
      where: { UserId: userId, Posted_Date: range },
      select: {
        Transaction_Code: true,
        Posted_Date: true,
        Payee_Name: true,
        Memo: true,
        Amount: true,
        Category_Name: true,
        CheckNumber: true,
        Is_Approve: true,
        IsArchived: true,
        Is_Active: true,
        Accounts: { select: { Account_Name: true } },
      },
      orderBy: { Posted_Date: "desc" },
    });

    const unc = await prisma.uncategorizedEntries.findMany({
      where: { UserId: userId, Is_Active: true, Posted_Date: range },
      select: {
        Transaction_Code: true,
        Posted_Date: true,
        Payee_Name: true,
        Memo: true,
        Amount: true,
        Category_Name: true,
        CheckNumber: true,
        Accounts: { select: { Account_Name: true } },
      },
      orderBy: { Posted_Date: "desc" },
    });

    const rows: RawTxnRow[] = [];

    for (const t of txns) {
      if (!t.Posted_Date) continue;
      rows.push({
        id: t.Transaction_Code,
        postedDate: t.Posted_Date,
        payee: t.Payee_Name?.trim() || null,
        memo: t.Memo?.trim() || null,
        amount: Number(t.Amount ?? 0),
        categoryName: t.Category_Name?.trim() || null,
        checkNumber: t.CheckNumber?.trim() || null,
        account: t.Accounts?.Account_Name?.trim() || null,
        isApprove: t.Is_Approve,
        isArchived: t.IsArchived,
        isActive: t.Is_Active,
        source: "ledger",
      });
    }

    for (const u of unc) {
      if (!u.Posted_Date) continue;
      rows.push({
        id: u.Transaction_Code,
        postedDate: u.Posted_Date,
        payee: u.Payee_Name?.trim() || null,
        memo: u.Memo?.trim() || null,
        amount: Number(u.Amount ?? 0),
        categoryName: u.Category_Name?.trim() || null,
        checkNumber: u.CheckNumber?.trim() || null,
        account: u.Accounts?.Account_Name?.trim() || null,
        isApprove: null,
        isArchived: false,
        isActive: true,
        source: "uncategorized",
      });
    }

    return rows;
  },

  async availableYears(userId: number): Promise<number[]> {
    const txns = await prisma.accountTransaction.findMany({
      where: { UserId: userId, Posted_Date: { not: null } },
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

Add to `packages/db/src/index.ts`:

```typescript
export * from "./repositories/transactions";
```

- [ ] **Step 3: Write the server types re-export**

Create `packages/server/src/transactions/types.ts`:

```typescript
// Re-export the repository row type so the pure service depends on a name, not on prisma.
export type { RawTxnRow } from "@accounting-completed/db";
```

- [ ] **Step 4: Write the failing service test**

Create `packages/server/src/transactions/service.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { deriveStatus, toTransactionsResponse } from "./service";
import type { RawTxnRow } from "./types";

const base: RawTxnRow = {
  id: 1, postedDate: new Date("2025-03-04T00:00:00.000Z"), payee: "Office Depot",
  memo: null, amount: -42.5, categoryName: null, checkNumber: null, account: "Checking",
  isApprove: null, isArchived: false, isActive: true, source: "ledger",
};

describe("deriveStatus", () => {
  it("marks uncategorized-source rows as review", () => {
    expect(deriveStatus({ ...base, source: "uncategorized" })).toBe("review");
  });
  it("marks archived rows as excluded", () => {
    expect(deriveStatus({ ...base, isArchived: true })).toBe("excluded");
  });
  it("marks inactive rows as excluded", () => {
    expect(deriveStatus({ ...base, isActive: false })).toBe("excluded");
  });
  it("marks rows with a category as categorized", () => {
    expect(deriveStatus({ ...base, categoryName: "Office Supplies" })).toBe("categorized");
  });
  it("marks approved rows as categorized", () => {
    expect(deriveStatus({ ...base, isApprove: true })).toBe("categorized");
  });
  it("marks bare ledger rows as review", () => {
    expect(deriveStatus(base)).toBe("review");
  });
});

describe("toTransactionsResponse", () => {
  it("maps rows to ISO-dated transactions with derived status", () => {
    const res = toTransactionsResponse([base], { clientId: 2189, year: 2025, generatedAt: "2025-06-01T00:00:00.000Z" });
    expect(res.meta).toEqual({ clientId: 2189, year: 2025, generatedAt: "2025-06-01T00:00:00.000Z" });
    expect(res.transactions[0]).toEqual({
      id: 1, postedDate: "2025-03-04T00:00:00.000Z", payee: "Office Depot", memo: null,
      amount: -42.5, category: null, checkNumber: null, account: "Checking", status: "review",
    });
  });
});
```

- [ ] **Step 5: Run the service test to verify it fails**

Run: `pnpm nx test server -- -t "deriveStatus"`
Expected: FAIL — `./service` cannot be resolved / `deriveStatus` is not exported.

- [ ] **Step 6: Write the service**

Create `packages/server/src/transactions/service.ts`:

```typescript
import type { Transaction, TransactionStatus, TransactionsResponse } from "@accounting-completed/contracts";
import type { RawTxnRow } from "./types";

export function deriveStatus(r: RawTxnRow): TransactionStatus {
  if (r.source === "uncategorized") return "review";
  if (r.isArchived || r.isActive === false) return "excluded";
  if ((r.categoryName && r.categoryName.length > 0) || r.isApprove) return "categorized";
  return "review";
}

export function toTransactionsResponse(
  rows: RawTxnRow[],
  meta: { clientId: number; year: number; generatedAt: string },
): TransactionsResponse {
  const transactions: Transaction[] = rows.map((r) => ({
    id: r.id,
    postedDate: r.postedDate.toISOString(),
    payee: r.payee,
    memo: r.memo,
    amount: r.amount,
    category: r.categoryName,
    checkNumber: r.checkNumber,
    account: r.account,
    status: deriveStatus(r),
  }));
  return { meta, transactions };
}
```

- [ ] **Step 7: Run the service test to verify it passes**

Run: `pnpm nx test server -- -t "deriveStatus"`
Expected: PASS (all `deriveStatus` + `toTransactionsResponse` cases).

- [ ] **Step 8: Write the route**

Create `packages/server/src/transactions/routes.ts`:

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  transactionsRequestSchema,
  transactionsYearsRequestSchema,
  transactionsResponseSchema,
  transactionsYearsSchema,
  type SessionUser,
} from "@accounting-completed/contracts";
import { HTTPException } from "hono/http-exception";
import { requireStaff } from "../middleware/request-context";
import { toTransactionsResponse } from "./service";
import type { RawTxnRow } from "./types";

export interface TransactionsDeps {
  clientInFirm(userId: number, firmClientId: number): Promise<boolean>;
  listForYear(userId: number, year: number): Promise<RawTxnRow[]>;
  availableYears(userId: number): Promise<number[]>;
}

async function assertClientInFirm(deps: TransactionsDeps, clientId: number, firmClientId: number) {
  if (!(await deps.clientInFirm(clientId, firmClientId))) {
    throw new HTTPException(404, { message: "Client not found" });
  }
}

export function createTransactionsRoutes(deps: TransactionsDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>()
    .get("/", requireStaff, zValidator("query", transactionsRequestSchema), async (c) => {
      const { clientId, year } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      await assertClientInFirm(deps, clientId, firmClientId);
      const rows = await deps.listForYear(clientId, year);
      const body = toTransactionsResponse(rows, { clientId, year, generatedAt: new Date().toISOString() });
      return c.json(transactionsResponseSchema.parse(body));
    })
    .get("/years", requireStaff, zValidator("query", transactionsYearsRequestSchema), async (c) => {
      const { clientId } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      await assertClientInFirm(deps, clientId, firmClientId);
      const years = await deps.availableYears(clientId);
      return c.json(transactionsYearsSchema.parse({ years }));
    });
}
```

- [ ] **Step 9: Wire the route in app.ts**

In `packages/server/src/app.ts`, add the import alongside the others:

```typescript
import { createTransactionsRoutes } from "./transactions/routes";
```

Add `transactionsRepository` to the existing `@accounting-completed/db` import:

```typescript
import { clientsRepository, usersRepository, incomeStatementRepository, transactionsRepository } from "@accounting-completed/db";
```

Add a `.route(...)` to the chained `routes` const (before `.get("/health", ...)`):

```typescript
  .route("/api/transactions", createTransactionsRoutes({
    clientInFirm: incomeStatementRepository.clientInFirm,
    listForYear: transactionsRepository.listForYear,
    availableYears: transactionsRepository.availableYears,
  }))
```

- [ ] **Step 10: Write the failing route test**

Create `packages/server/src/transactions/routes.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import { requestContext } from "../middleware/request-context";
import { createTransactionsRoutes } from "./routes";
import { signSession } from "../auth/jwt";
import type { RawTxnRow } from "./types";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: RawTxnRow[] = [
  { id: 10, postedDate: new Date("2025-02-01T00:00:00.000Z"), payee: "Acme", memo: null, amount: -25,
    categoryName: "Office Supplies", checkNumber: null, account: "Checking",
    isApprove: null, isArchived: false, isActive: true, source: "ledger" },
];

const deps = {
  clientInFirm: async (id: number) => id === 2189,
  listForYear: async () => rows,
  availableYears: async () => [2025, 2024],
};

function appWith() {
  return new Hono().use("*", requestContext).route("/api/transactions", createTransactionsRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("transactions routes", () => {
  it("returns transactions for staff", async () => {
    const res = await appWith().request("/api/transactions?clientId=2189&year=2025", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.year).toBe(2025);
    expect(body.transactions[0]).toMatchObject({ id: 10, status: "categorized", postedDate: "2025-02-01T00:00:00.000Z" });
  });

  it("returns available years for staff", async () => {
    const res = await appWith().request("/api/transactions/years?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ years: [2025, 2024] });
  });

  it("400s on a missing year", async () => {
    const res = await appWith().request("/api/transactions?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(400);
  });

  it("403s for non-staff", async () => {
    const res = await appWith().request("/api/transactions?clientId=2189&year=2025", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });

  it("404s when the client is not in the caller's firm", async () => {
    const res = await appWith().request("/api/transactions?clientId=9999&year=2025", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 11: Run the route test to verify it passes**

Run: `pnpm nx test server -- -t "transactions routes"`
Expected: PASS (5 cases).

- [ ] **Step 12: Verify contracts + full server suite + typecheck**

Run: `pnpm nx test contracts` then `pnpm nx test server` then `pnpm nx build server`
Expected: all PASS / build succeeds.

- [ ] **Step 13: Commit**

```bash
git add packages/contracts/src/transactions.ts packages/contracts/src/index.ts \
  packages/db/src/repositories/transactions.ts packages/db/src/index.ts \
  packages/server/src/transactions/ packages/server/src/app.ts
git commit -m "feat(transactions): API + repository for client transaction ledger"
```

---

## Task 2: Transactions — frontend slice

**Files:**
- Create: `packages/api-client/src/use-transactions.ts`
- Modify: `packages/api-client/src/index.ts`
- Create: `apps/web/src/routes/transactions/filter.ts`
- Test: `apps/web/src/routes/transactions/filter.spec.ts`
- Modify: `apps/web/src/routes/transactions/TransactionsPage.tsx`

**Interfaces:**
- Consumes: `transactionsResponseSchema`, `transactionsYearsSchema`, type `Transaction` from contracts; `apiClient` from `./client`; `useClient` from `../../app/client-context`; `useMe`, `useClients` (already used by the page).
- Produces: `useTransactions({clientId, year})`, `useTransactionsYears({clientId})`; pure `filterTransactions(txns, tab, query)` and exported type `TxnTab`.

- [ ] **Step 1: Write the API hooks**

Create `packages/api-client/src/use-transactions.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { transactionsResponseSchema, transactionsYearsSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useTransactions(params: { clientId: number | null; year: number | null }) {
  const { clientId, year } = params;
  return useQuery({
    queryKey: ["transactions", clientId, year],
    enabled: clientId != null && year != null,
    queryFn: async () => {
      const r = await apiClient.api.transactions.$get({
        query: { clientId: String(clientId), year: String(year) },
      });
      if (!r.ok) throw new Error("Failed to load transactions");
      return transactionsResponseSchema.parse(await r.json());
    },
  });
}

export function useTransactionsYears(params: { clientId: number | null }) {
  const { clientId } = params;
  return useQuery({
    queryKey: ["transactions-years", clientId],
    enabled: clientId != null,
    queryFn: async () => {
      const r = await apiClient.api.transactions.years.$get({
        query: { clientId: String(clientId) },
      });
      if (!r.ok) throw new Error("Failed to load available years");
      return transactionsYearsSchema.parse(await r.json()).years;
    },
  });
}
```

Add to `packages/api-client/src/index.ts`:

```typescript
export { useTransactions, useTransactionsYears } from "./use-transactions";
```

- [ ] **Step 2: Write the failing filter test**

Create `apps/web/src/routes/transactions/filter.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { Transaction } from "@accounting-completed/contracts";
import { filterTransactions } from "./filter";

const t = (over: Partial<Transaction>): Transaction => ({
  id: 1, postedDate: "2025-01-01T00:00:00.000Z", payee: "Acme", memo: null, amount: -10,
  category: null, checkNumber: null, account: "Checking", status: "review", ...over,
});

const data: Transaction[] = [
  t({ id: 1, status: "review", payee: "Acme Tools" }),
  t({ id: 2, status: "categorized", payee: "Office Depot", category: "Office Supplies" }),
  t({ id: 3, status: "excluded", payee: "Refund", memo: "duplicate" }),
];

describe("filterTransactions", () => {
  it("returns everything for the 'all' tab with no query", () => {
    expect(filterTransactions(data, "all", "").map((x) => x.id)).toEqual([1, 2, 3]);
  });
  it("filters by tab status", () => {
    expect(filterTransactions(data, "categorized", "").map((x) => x.id)).toEqual([2]);
  });
  it("filters by case-insensitive payee/memo/category query", () => {
    expect(filterTransactions(data, "all", "office").map((x) => x.id)).toEqual([2]);
    expect(filterTransactions(data, "all", "DUPLICATE").map((x) => x.id)).toEqual([3]);
  });
  it("combines tab and query", () => {
    expect(filterTransactions(data, "review", "acme").map((x) => x.id)).toEqual([1]);
    expect(filterTransactions(data, "review", "office")).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the filter test to verify it fails**

Run: `pnpm nx test web -- -t "filterTransactions"`
Expected: FAIL — `./filter` cannot be resolved.

- [ ] **Step 4: Write the filter helper**

Create `apps/web/src/routes/transactions/filter.ts`:

```typescript
import type { Transaction } from "@accounting-completed/contracts";

export type TxnTab = "review" | "categorized" | "excluded" | "all";

export function filterTransactions(txns: Transaction[], tab: TxnTab, query: string): Transaction[] {
  const q = query.trim().toLowerCase();
  return txns.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    if (!q) return true;
    const hay = [t.payee, t.memo, t.category, String(t.amount)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
```

- [ ] **Step 5: Run the filter test to verify it passes**

Run: `pnpm nx test web -- -t "filterTransactions"`
Expected: PASS (4 cases).

- [ ] **Step 6: Rewrite the page to render real data**

Replace the entire contents of `apps/web/src/routes/transactions/TransactionsPage.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardFooter } from "@accounting-completed/ui";
import { useMe, useClients, useTransactions, useTransactionsYears } from "@accounting-completed/api-client";
import { cn } from "@accounting-completed/utils";
import { ICONS } from "../../layout/icons";
import { PageHeader } from "../../components/PageHeader";
import { useClient } from "../../app/client-context";
import { filterTransactions, type TxnTab } from "./filter";

const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function TransactionsPage() {
  const [tab, setTab] = useState<TxnTab>("review");
  const [q, setQ] = useState("");

  const { data: me } = useMe();
  const isStaff = me?.roles?.isStaff ?? false;
  const { data: clients } = useClients({ enabled: isStaff });
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;
  const clientName = isStaff
    ? clients?.find((c) => c.id === clientId)?.name
    : me?.companyName?.trim() || undefined;

  const yearsQuery = useTransactionsYears({ clientId: numericClientId });
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    if (year == null && yearsQuery.data && yearsQuery.data.length > 0) {
      setYear(yearsQuery.data[0]);
    }
  }, [year, yearsQuery.data]);

  const txnsQuery = useTransactions({ clientId: numericClientId, year });
  const all = txnsQuery.data?.transactions ?? [];
  const rows = useMemo(() => filterTransactions(all, tab, q), [all, tab, q]);

  const tabs: { v: TxnTab; l: string }[] = [
    { v: "review", l: "For review" },
    { v: "categorized", l: "Categorized" },
    { v: "excluded", l: "Excluded" },
    { v: "all", l: "All" },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        sub={clientName || undefined}
        actions={
          <>
            <Button>{ICONS.refresh}<span>Refresh feeds</span></Button>
            <Button>{ICONS.zap}<span>Rules</span></Button>
            <Button>{ICONS.download}<span>Export</span></Button>
            <Button variant="primary">{ICONS.plus}<span>Add transaction</span></Button>
          </>
        }
      />

      {/* Tab strip */}
      <div className="flex items-center justify-between gap-4 mb-4 border-b border-border">
        <div className="flex items-center gap-1">
          {tabs.map((opt) => (
            <button
              key={opt.v}
              onClick={() => setTab(opt.v)}
              className={cn(
                "px-3 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
                tab === opt.v
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.l}
            </button>
          ))}
        </div>
        <label className="text-[13px] flex items-center gap-2 pb-1.5">
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

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{ICONS.search}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search descriptions, memos, amounts…"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[90px]">Date</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Description</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[220px]">Category</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {txnsQuery.isLoading && (
              <tr><td colSpan={4} className="px-3 py-16 text-center text-text-soft">Loading…</td></tr>
            )}
            {txnsQuery.isError && (
              <tr><td colSpan={4} className="px-3 py-16 text-center text-destructive">
                Failed to load. <button className="underline" onClick={() => txnsQuery.refetch()}>Retry</button>
              </td></tr>
            )}
            {txnsQuery.isSuccess && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-16 text-center">
                  <div className="text-foreground font-medium text-[14px]">No transactions</div>
                  <div className="text-[13px] text-muted-foreground mt-1">
                    Nothing matches this tab or search for {year ?? "this year"}.
                  </div>
                </td>
              </tr>
            )}
            {txnsQuery.isSuccess && rows.map((tx) => (
              <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="px-3 py-2 text-text-soft whitespace-nowrap">{day(tx.postedDate)}</td>
                <td className="px-3 py-2">
                  <div className="text-foreground">{tx.payee ?? "—"}</div>
                  {tx.memo && <div className="text-[12px] text-text-soft">{tx.memo}</div>}
                </td>
                <td className="px-3 py-2 text-text-soft">{tx.category ?? "Uncategorized"}</td>
                <td className={cn("px-3 py-2 text-right tnum", tx.amount < 0 ? "text-destructive" : "")}>
                  {money(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <CardFooter>
          <div className="flex items-center justify-between w-full text-[12.5px] text-muted-foreground">
            <span>
              Showing <span className="font-mono text-foreground">{rows.length}</span>{" "}
              {rows.length === 1 ? "transaction" : "transactions"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Verify web tests + typecheck/build**

Run: `pnpm nx test web` then `pnpm nx build web`
Expected: PASS / build succeeds.

- [ ] **Step 8: Commit**

```bash
git add packages/api-client/src/use-transactions.ts packages/api-client/src/index.ts \
  apps/web/src/routes/transactions/filter.ts apps/web/src/routes/transactions/filter.spec.ts \
  apps/web/src/routes/transactions/TransactionsPage.tsx
git commit -m "feat(web): hydrate Transactions page with real ledger data"
```

---

## Task 3: Chart of Accounts — backend slice

**Files:**
- Create: `packages/contracts/src/accounts.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/db/src/repositories/accounts.ts`
- Modify: `packages/db/src/index.ts`
- Create: `packages/server/src/accounts/routes.ts`
- Modify: `packages/server/src/app.ts`
- Test: `packages/server/src/accounts/routes.spec.ts`

**Interfaces:**
- Consumes: `requireStaff`, `signSession`, reused `incomeStatementRepository.clientInFirm`.
- Produces: contract `Account`, `accountsResponseSchema`, `accountsRequestSchema`; `accountsRepository.list(userId): Promise<AccountRow[]>`; endpoint `GET /api/accounts?clientId`.

- [ ] **Step 1: Write the contract**

Create `packages/contracts/src/accounts.ts`:

```typescript
import { z } from "zod";

export const accountsRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

export const accountSchema = z.object({
  code: z.number(),
  name: z.string(),
  type: z.string().nullable(),
  category: z.string().nullable(),
  balance: z.number().finite().nullable(),
  bankAccountType: z.string().nullable(),
  currency: z.string().nullable(),
  status: z.string().nullable(),
});
export type Account = z.infer<typeof accountSchema>;

export const accountsResponseSchema = z.object({ accounts: z.array(accountSchema) });
export type AccountsResponse = z.infer<typeof accountsResponseSchema>;
```

Add to `packages/contracts/src/index.ts`:

```typescript
export * from "./accounts";
```

- [ ] **Step 2: Write the repository**

Create `packages/db/src/repositories/accounts.ts`:

```typescript
import { prisma } from "../client";

export interface AccountRow {
  Account_Code: number;
  Account_Name: string | null;
  Account_Type: string | null;
  Account_Category: string | null;
  Balance: number | null;
  Bank_Account_Type: string | null;
  Currency_Code: string | null;
  Account_Status: string | null;
}

export const accountsRepository = {
  async list(userId: number): Promise<AccountRow[]> {
    const rows = await prisma.accounts.findMany({
      where: { UserId: userId, Is_Active: true },
      select: {
        Account_Code: true,
        Account_Name: true,
        Account_Type: true,
        Account_Category: true,
        Balance: true,
        Bank_Account_Type: true,
        Currency_Code: true,
        Account_Status: true,
        Display_Position: true,
      },
      orderBy: [{ Display_Position: "asc" }, { Account_Name: "asc" }],
    });
    return rows.map((r) => ({
      Account_Code: r.Account_Code,
      Account_Name: r.Account_Name,
      Account_Type: r.Account_Type,
      Account_Category: r.Account_Category,
      Balance: r.Balance == null ? null : Number(r.Balance),
      Bank_Account_Type: r.Bank_Account_Type,
      Currency_Code: r.Currency_Code,
      Account_Status: r.Account_Status,
    }));
  },
};
```

Add to `packages/db/src/index.ts`:

```typescript
export * from "./repositories/accounts";
```

- [ ] **Step 3: Write the route**

Create `packages/server/src/accounts/routes.ts`:

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { accountsRequestSchema, accountsResponseSchema, type SessionUser } from "@accounting-completed/contracts";
import type { AccountRow } from "@accounting-completed/db";
import { HTTPException } from "hono/http-exception";
import { requireStaff } from "../middleware/request-context";

export interface AccountsDeps {
  clientInFirm(userId: number, firmClientId: number): Promise<boolean>;
  list(userId: number): Promise<AccountRow[]>;
}

export function createAccountsRoutes(deps: AccountsDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get(
    "/",
    requireStaff,
    zValidator("query", accountsRequestSchema),
    async (c) => {
      const { clientId } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      if (!(await deps.clientInFirm(clientId, firmClientId))) {
        throw new HTTPException(404, { message: "Client not found" });
      }
      const rows = await deps.list(clientId);
      return c.json(
        accountsResponseSchema.parse({
          accounts: rows.map((r) => ({
            code: r.Account_Code,
            name: r.Account_Name?.trim() || `Account ${r.Account_Code}`,
            type: r.Account_Type?.trim() || null,
            category: r.Account_Category?.trim() || null,
            balance: r.Balance,
            bankAccountType: r.Bank_Account_Type?.trim() || null,
            currency: r.Currency_Code?.trim() || null,
            status: r.Account_Status?.trim() || null,
          })),
        }),
      );
    },
  );
}
```

- [ ] **Step 4: Wire the route in app.ts**

Add the import:

```typescript
import { createAccountsRoutes } from "./accounts/routes";
```

Add `accountsRepository` to the `@accounting-completed/db` import, then add to the chained `routes`:

```typescript
  .route("/api/accounts", createAccountsRoutes({
    clientInFirm: incomeStatementRepository.clientInFirm,
    list: accountsRepository.list,
  }))
```

- [ ] **Step 5: Write the failing route test**

Create `packages/server/src/accounts/routes.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import type { AccountRow } from "@accounting-completed/db";
import { requestContext } from "../middleware/request-context";
import { createAccountsRoutes } from "./routes";
import { signSession } from "../auth/jwt";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: AccountRow[] = [
  { Account_Code: 1000, Account_Name: "Checking", Account_Type: "Asset", Account_Category: "Bank",
    Balance: 1234.56, Bank_Account_Type: "checking", Currency_Code: "USD", Account_Status: "active" },
];
const deps = {
  clientInFirm: async (id: number) => id === 2189,
  list: async () => rows,
};

function appWith() {
  return new Hono().use("*", requestContext).route("/api/accounts", createAccountsRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("accounts routes", () => {
  it("returns accounts for staff", async () => {
    const res = await appWith().request("/api/accounts?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      accounts: [{ code: 1000, name: "Checking", type: "Asset", category: "Bank", balance: 1234.56, bankAccountType: "checking", currency: "USD", status: "active" }],
    });
  });
  it("403s for non-staff", async () => {
    const res = await appWith().request("/api/accounts?clientId=2189", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });
  it("404s for a client outside the firm", async () => {
    const res = await appWith().request("/api/accounts?clientId=9999", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(404);
  });
  it("400s when clientId is missing", async () => {
    const res = await appWith().request("/api/accounts", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 6: Run the route test to verify it passes**

Run: `pnpm nx test server -- -t "accounts routes"`
Expected: PASS (4 cases). (TDD note: the route was written in Step 3; if the executor prefers strict red-first, temporarily comment out the `.route("/api/accounts" ...)` body — but since the route already exists, expect PASS here.)

- [ ] **Step 7: Verify contracts + server build**

Run: `pnpm nx test contracts` then `pnpm nx build server`
Expected: PASS / build succeeds.

- [ ] **Step 8: Commit**

```bash
git add packages/contracts/src/accounts.ts packages/contracts/src/index.ts \
  packages/db/src/repositories/accounts.ts packages/db/src/index.ts \
  packages/server/src/accounts/ packages/server/src/app.ts
git commit -m "feat(accounts): API + repository for chart of accounts"
```

---

## Task 4: Chart of Accounts — frontend slice

**Files:**
- Create: `packages/api-client/src/use-accounts.ts`
- Modify: `packages/api-client/src/index.ts`
- Create: `apps/web/src/routes/chart-of-accounts/groupAccounts.ts`
- Test: `apps/web/src/routes/chart-of-accounts/groupAccounts.spec.ts`
- Create: `apps/web/src/routes/chart-of-accounts/ChartOfAccountsPage.tsx`
- Modify: `apps/web/src/router.tsx`

**Interfaces:**
- Consumes: `accountsResponseSchema`, type `Account`; `apiClient`; `useClient`.
- Produces: `useAccounts({clientId})`; pure `groupAccountsByType(accounts): AccountGroup[]` with `AccountGroup = { type: string; accounts: Account[]; subtotal: number }`.

- [ ] **Step 1: Write the API hook**

Create `packages/api-client/src/use-accounts.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { accountsResponseSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useAccounts(params: { clientId: number | null }) {
  const { clientId } = params;
  return useQuery({
    queryKey: ["accounts", clientId],
    enabled: clientId != null,
    queryFn: async () => {
      const r = await apiClient.api.accounts.$get({ query: { clientId: String(clientId) } });
      if (!r.ok) throw new Error("Failed to load accounts");
      return accountsResponseSchema.parse(await r.json()).accounts;
    },
  });
}
```

Add to `packages/api-client/src/index.ts`:

```typescript
export { useAccounts } from "./use-accounts";
```

- [ ] **Step 2: Write the failing grouping test**

Create `apps/web/src/routes/chart-of-accounts/groupAccounts.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { Account } from "@accounting-completed/contracts";
import { groupAccountsByType } from "./groupAccounts";

const a = (over: Partial<Account>): Account => ({
  code: 1, name: "X", type: "Asset", category: null, balance: 0,
  bankAccountType: null, currency: "USD", status: "active", ...over,
});

describe("groupAccountsByType", () => {
  it("groups by type, sums balances, and orders groups by first appearance", () => {
    const groups = groupAccountsByType([
      a({ code: 1, type: "Asset", balance: 100 }),
      a({ code: 2, type: "Liability", balance: 40 }),
      a({ code: 3, type: "Asset", balance: 25 }),
    ]);
    expect(groups.map((g) => g.type)).toEqual(["Asset", "Liability"]);
    expect(groups[0].subtotal).toBe(125);
    expect(groups[0].accounts.map((x) => x.code)).toEqual([1, 3]);
    expect(groups[1].subtotal).toBe(40);
  });
  it("buckets null/empty types under 'Uncategorized' and treats null balance as 0", () => {
    const groups = groupAccountsByType([a({ code: 9, type: null, balance: null })]);
    expect(groups[0].type).toBe("Uncategorized");
    expect(groups[0].subtotal).toBe(0);
  });
});
```

- [ ] **Step 3: Run the grouping test to verify it fails**

Run: `pnpm nx test web -- -t "groupAccountsByType"`
Expected: FAIL — `./groupAccounts` cannot be resolved.

- [ ] **Step 4: Write the grouping helper**

Create `apps/web/src/routes/chart-of-accounts/groupAccounts.ts`:

```typescript
import type { Account } from "@accounting-completed/contracts";

export interface AccountGroup {
  type: string;
  accounts: Account[];
  subtotal: number;
}

export function groupAccountsByType(accounts: Account[]): AccountGroup[] {
  const order: string[] = [];
  const byType = new Map<string, AccountGroup>();
  for (const acc of accounts) {
    const type = acc.type?.trim() || "Uncategorized";
    let group = byType.get(type);
    if (!group) {
      group = { type, accounts: [], subtotal: 0 };
      byType.set(type, group);
      order.push(type);
    }
    group.accounts.push(acc);
    group.subtotal += acc.balance ?? 0;
  }
  return order.map((t) => byType.get(t)!);
}
```

- [ ] **Step 5: Run the grouping test to verify it passes**

Run: `pnpm nx test web -- -t "groupAccountsByType"`
Expected: PASS (2 cases).

- [ ] **Step 6: Write the page**

Create `apps/web/src/routes/chart-of-accounts/ChartOfAccountsPage.tsx`:

```tsx
import { useMemo } from "react";
import { Card } from "@accounting-completed/ui";
import { useAccounts } from "@accounting-completed/api-client";
import { useClient } from "../../app/client-context";
import { PageHeader } from "../../components/PageHeader";
import { groupAccountsByType } from "./groupAccounts";

const money = (n: number | null) =>
  n == null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function ChartOfAccountsPage() {
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;
  const accountsQuery = useAccounts({ clientId: numericClientId });
  const groups = useMemo(() => groupAccountsByType(accountsQuery.data ?? []), [accountsQuery.data]);

  return (
    <div>
      <PageHeader title="Chart of accounts" />

      {accountsQuery.isLoading && <div className="text-text-soft">Loading…</div>}
      {accountsQuery.isError && (
        <div className="text-destructive">
          Failed to load. <button className="underline" onClick={() => accountsQuery.refetch()}>Retry</button>
        </div>
      )}
      {accountsQuery.isSuccess && groups.length === 0 && (
        <div className="text-text-soft">No accounts for this client.</div>
      )}

      {accountsQuery.isSuccess && groups.length > 0 && (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={g.type} className="overflow-hidden">
              <table className="w-full text-[13.5px]">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">
                      {g.type}
                    </th>
                    <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[180px]">Category</th>
                    <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[160px]">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {g.accounts.map((acc) => (
                    <tr key={acc.code} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">{acc.name}</td>
                      <td className="px-3 py-2 text-text-soft">{acc.category ?? "—"}</td>
                      <td className="px-3 py-2 text-right tnum">{money(acc.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 border-t border-border font-medium">
                    <td className="px-3 py-2" colSpan={2}>Total {g.type}</td>
                    <td className="px-3 py-2 text-right tnum">{money(g.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Wire the route**

In `apps/web/src/router.tsx`, add the import:

```typescript
import { ChartOfAccountsPage } from "./routes/chart-of-accounts/ChartOfAccountsPage";
```

Replace the chart-of-accounts route line:

```typescript
          { path: "/setup/chart-of-accounts", element: <StubPage />, handle: { title: "Chart of accounts", crumbs: ["Setup", "Chart of accounts"] } },
```

with:

```typescript
          { path: "/setup/chart-of-accounts", element: <ChartOfAccountsPage />, handle: { title: "Chart of accounts", crumbs: ["Setup", "Chart of accounts"] } },
```

- [ ] **Step 8: Verify web tests + build**

Run: `pnpm nx test web` then `pnpm nx build web`
Expected: PASS / build succeeds.

- [ ] **Step 9: Commit**

```bash
git add packages/api-client/src/use-accounts.ts packages/api-client/src/index.ts \
  apps/web/src/routes/chart-of-accounts/ apps/web/src/router.tsx
git commit -m "feat(web): real Chart of Accounts page grouped by type"
```

---

## Task 5: Dashboard activity — backend slice

**Files:**
- Create: `packages/contracts/src/activity.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/db/src/repositories/activity.ts`
- Modify: `packages/db/src/index.ts`
- Create: `packages/server/src/activity/service.ts`
- Create: `packages/server/src/activity/routes.ts`
- Modify: `packages/server/src/app.ts`
- Test: `packages/server/src/activity/service.spec.ts`
- Test: `packages/server/src/activity/routes.spec.ts`

**Interfaces:**
- Consumes: `requireStaff`, `signSession`.
- Produces: contract `ActivityItem`, `activityResponseSchema`, `activityRequestSchema`; `activityRepository.recent(firmClientId, limit): Promise<ActivityRow[]>`; server `formatActivity(row): {action, detail}` and `toActivityItems(rows)`; endpoint `GET /api/activity?limit`.
- Note: this route is firm-wide (no `clientId`); it scopes by the caller's `firmClientId`, so there is no `clientInFirm` guard.

- [ ] **Step 1: Write the contract**

Create `packages/contracts/src/activity.ts`:

```typescript
import { z } from "zod";

export const activityRequestSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const activityItemSchema = z.object({
  id: z.number(),
  when: z.string(), // ISO
  actor: z.string().nullable(),
  action: z.string(),
  detail: z.string().nullable(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const activityResponseSchema = z.object({ items: z.array(activityItemSchema) });
export type ActivityResponse = z.infer<typeof activityResponseSchema>;
```

Add to `packages/contracts/src/index.ts`:

```typescript
export * from "./activity";
```

- [ ] **Step 2: Write the repository**

Create `packages/db/src/repositories/activity.ts`:

```typescript
import { prisma } from "../client";

export interface ActivityRow {
  id: number;
  when: Date;
  actor: string | null;
  updateType: string;
  oldPayee: string | null;
  newPayee: string | null;
  oldCategory: string | null;
  newCategory: string | null;
}

export const activityRepository = {
  async recent(firmClientId: number, limit: number): Promise<ActivityRow[]> {
    const rows = await prisma.accountTransactionUpdateHistory.findMany({
      where: { Users: { Client_Id: firmClientId } },
      orderBy: { CreatedDate: "desc" },
      take: limit,
      select: {
        AccountTransactionUpdateHistoryId: true,
        CreatedDate: true,
        TransactionUpdateType: true,
        Old_Payee_Name: true,
        New_Payee_Name: true,
        Old_Category_Name: true,
        New_Category_Name: true,
        Users: { select: { Full_Name: true, First_Name: true } },
      },
    });
    return rows.map((r) => ({
      id: r.AccountTransactionUpdateHistoryId,
      when: r.CreatedDate,
      actor: r.Users?.Full_Name?.trim() || r.Users?.First_Name?.trim() || null,
      updateType: r.TransactionUpdateType,
      oldPayee: r.Old_Payee_Name?.trim() || null,
      newPayee: r.New_Payee_Name?.trim() || null,
      oldCategory: r.Old_Category_Name?.trim() || null,
      newCategory: r.New_Category_Name?.trim() || null,
    }));
  },
};
```

Add to `packages/db/src/index.ts`:

```typescript
export * from "./repositories/activity";
```

- [ ] **Step 3: Write the failing service test**

Create `packages/server/src/activity/service.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { formatActivity, toActivityItems } from "./service";
import type { ActivityRow } from "@accounting-completed/db";

const base: ActivityRow = {
  id: 1, when: new Date("2025-05-01T12:00:00.000Z"), actor: "Jane Staff",
  updateType: "Update", oldPayee: null, newPayee: null, oldCategory: null, newCategory: null,
};

describe("formatActivity", () => {
  it("describes a recategorization", () => {
    const r = formatActivity({ ...base, oldPayee: "Office Depot", oldCategory: "Uncategorized", newCategory: "Office Supplies" });
    expect(r.action).toBe("Recategorized");
    expect(r.detail).toBe("Office Depot: Uncategorized → Office Supplies");
  });
  it("describes a payee rename", () => {
    const r = formatActivity({ ...base, oldPayee: "AMZN", newPayee: "Amazon" });
    expect(r.action).toBe("Renamed payee");
    expect(r.detail).toBe("AMZN → Amazon");
  });
  it("falls back to the raw update type", () => {
    const r = formatActivity({ ...base, updateType: "Approved", newPayee: "Acme" });
    expect(r.action).toBe("Approved");
    expect(r.detail).toBe("Acme");
  });
});

describe("toActivityItems", () => {
  it("maps rows to items with ISO timestamps", () => {
    const items = toActivityItems([{ ...base, newPayee: "Acme" }]);
    expect(items[0]).toMatchObject({ id: 1, when: "2025-05-01T12:00:00.000Z", actor: "Jane Staff" });
  });
});
```

- [ ] **Step 4: Run the service test to verify it fails**

Run: `pnpm nx test server -- -t "formatActivity"`
Expected: FAIL — `./service` cannot be resolved.

- [ ] **Step 5: Write the service**

Create `packages/server/src/activity/service.ts`:

```typescript
import type { ActivityItem } from "@accounting-completed/contracts";
import type { ActivityRow } from "@accounting-completed/db";

export function formatActivity(r: ActivityRow): { action: string; detail: string | null } {
  if (r.oldCategory !== r.newCategory && (r.newCategory || r.oldCategory)) {
    const subject = r.newPayee || r.oldPayee || "Transaction";
    return { action: "Recategorized", detail: `${subject}: ${r.oldCategory || "—"} → ${r.newCategory || "—"}` };
  }
  if (r.oldPayee !== r.newPayee && (r.newPayee || r.oldPayee)) {
    return { action: "Renamed payee", detail: `${r.oldPayee || "—"} → ${r.newPayee || "—"}` };
  }
  return { action: r.updateType || "Updated transaction", detail: r.newPayee || r.oldPayee || null };
}

export function toActivityItems(rows: ActivityRow[]): ActivityItem[] {
  return rows.map((r) => {
    const { action, detail } = formatActivity(r);
    return { id: r.id, when: r.when.toISOString(), actor: r.actor, action, detail };
  });
}
```

- [ ] **Step 6: Run the service test to verify it passes**

Run: `pnpm nx test server -- -t "formatActivity"`
Expected: PASS.

- [ ] **Step 7: Write the route**

Create `packages/server/src/activity/routes.ts`:

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { activityRequestSchema, activityResponseSchema, type SessionUser } from "@accounting-completed/contracts";
import type { ActivityRow } from "@accounting-completed/db";
import { requireStaff } from "../middleware/request-context";
import { toActivityItems } from "./service";

export interface ActivityDeps {
  recent(firmClientId: number, limit: number): Promise<ActivityRow[]>;
}

const DEFAULT_LIMIT = 12;

export function createActivityRoutes(deps: ActivityDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get(
    "/",
    requireStaff,
    zValidator("query", activityRequestSchema),
    async (c) => {
      const { limit } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      const rows = await deps.recent(firmClientId, limit ?? DEFAULT_LIMIT);
      return c.json(activityResponseSchema.parse({ items: toActivityItems(rows) }));
    },
  );
}
```

- [ ] **Step 8: Wire the route in app.ts**

Add the import:

```typescript
import { createActivityRoutes } from "./activity/routes";
```

Add `activityRepository` to the `@accounting-completed/db` import, then add to the chained `routes`:

```typescript
  .route("/api/activity", createActivityRoutes({ recent: activityRepository.recent }))
```

- [ ] **Step 9: Write the failing route test**

Create `packages/server/src/activity/routes.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import type { ActivityRow } from "@accounting-completed/db";
import { requestContext } from "../middleware/request-context";
import { createActivityRoutes } from "./routes";
import { signSession } from "../auth/jwt";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: ActivityRow[] = [
  { id: 5, when: new Date("2025-05-01T12:00:00.000Z"), actor: "Jane", updateType: "Update",
    oldPayee: "AMZN", newPayee: "Amazon", oldCategory: null, newCategory: null },
];

function appWith(captured: { firm?: number; limit?: number }) {
  const deps = {
    recent: async (firm: number, limit: number) => { captured.firm = firm; captured.limit = limit; return rows; },
  };
  return new Hono().use("*", requestContext).route("/api/activity", createActivityRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("activity routes", () => {
  it("returns firm-scoped items for staff with the default limit", async () => {
    const captured: { firm?: number; limit?: number } = {};
    const res = await appWith(captured).request("/api/activity", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    expect(captured.firm).toBe(69);
    expect(captured.limit).toBe(12);
    const body = await res.json();
    expect(body.items[0]).toMatchObject({ id: 5, action: "Renamed payee", detail: "AMZN → Amazon" });
  });
  it("honors an explicit limit", async () => {
    const captured: { firm?: number; limit?: number } = {};
    await appWith(captured).request("/api/activity?limit=5", { headers: { Authorization: await bearer(staff) } });
    expect(captured.limit).toBe(5);
  });
  it("403s for non-staff", async () => {
    const res = await appWith({}).request("/api/activity", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });
  it("401s without a token", async () => {
    const res = await appWith({}).request("/api/activity");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 10: Run the route test to verify it passes**

Run: `pnpm nx test server -- -t "activity routes"`
Expected: PASS (4 cases).

- [ ] **Step 11: Verify contracts + server build**

Run: `pnpm nx test contracts` then `pnpm nx build server`
Expected: PASS / build succeeds.

- [ ] **Step 12: Commit**

```bash
git add packages/contracts/src/activity.ts packages/contracts/src/index.ts \
  packages/db/src/repositories/activity.ts packages/db/src/index.ts \
  packages/server/src/activity/ packages/server/src/app.ts
git commit -m "feat(activity): firm-scoped recent activity API from audit history"
```

---

## Task 6: Dashboard activity — frontend slice

**Files:**
- Create: `packages/api-client/src/use-activity.ts`
- Modify: `packages/api-client/src/index.ts`
- Modify: `apps/web/src/routes/dashboard/DashboardPage.tsx`

**Interfaces:**
- Consumes: `activityResponseSchema`, type `ActivityItem`; `apiClient`.
- Produces: `useActivity({limit})`.

- [ ] **Step 1: Write the API hook**

Create `packages/api-client/src/use-activity.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { activityResponseSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useActivity(params?: { limit?: number; enabled?: boolean }) {
  const limit = params?.limit;
  return useQuery({
    queryKey: ["activity", limit ?? null],
    enabled: params?.enabled ?? true,
    queryFn: async () => {
      const r = await apiClient.api.activity.$get({ query: limit ? { limit: String(limit) } : {} });
      if (!r.ok) throw new Error("Failed to load activity");
      return activityResponseSchema.parse(await r.json()).items;
    },
  });
}
```

Add to `packages/api-client/src/index.ts`:

```typescript
export { useActivity } from "./use-activity";
```

- [ ] **Step 2: Render the activity feed on the Dashboard**

In `apps/web/src/routes/dashboard/DashboardPage.tsx`:

Add `useActivity` to the existing api-client import:

```typescript
import { useMe, useClients, useActivity } from "@accounting-completed/api-client";
```

Inside `DashboardPage`, after the `useClients` line, add:

```typescript
  const { data: activity } = useActivity({ enabled: isStaff, limit: 8 });
```

Add this relative-time helper just above the `DashboardPage` function (next to `greetingFor`):

```tsx
function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
```

Replace the Activity card block:

```tsx
          {/* Activity feed */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <EmptyState title="No recent activity" sub="Recent changes across your clients will appear here." />
          </Card>
```

with:

```tsx
          {/* Activity feed */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            {activity && activity.length > 0 ? (
              <ul className="divide-y divide-border">
                {activity.map((item) => (
                  <li key={item.id} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-medium text-foreground">{item.action}</span>
                      <span className="text-[11.5px] text-text-soft whitespace-nowrap">{relTime(item.when)}</span>
                    </div>
                    {item.detail && <div className="text-[12.5px] text-text-soft mt-0.5">{item.detail}</div>}
                    {item.actor && <div className="text-[11.5px] text-text-soft mt-0.5">by {item.actor}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No recent activity" sub="Recent changes across your clients will appear here." />
            )}
          </Card>
```

- [ ] **Step 3: Verify web tests + build**

Run: `pnpm nx test web` then `pnpm nx build web`
Expected: PASS / build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/api-client/src/use-activity.ts packages/api-client/src/index.ts \
  apps/web/src/routes/dashboard/DashboardPage.tsx
git commit -m "feat(web): live activity feed on the dashboard"
```

---

## Task 7: Balance Sheet — data spike

**Goal:** Determine whether `Accounts.Account_Type` / `Accounts.Balance` carry GL-style asset/liability/equity semantics (which would support a reconciled statement) or only bank-account balances. The result decides the page's labeling; the implementation in Tasks 8–9 is the safe "Account Balances by Type" baseline either way.

**Files:**
- Create (temporary): `packages/db/src/repositories/balance-sheet.spike.spec.ts`

**Prerequisite:** a `.env` with the Azure SQL connection string must be present for the `db` project (the same credentials the app already uses). The spike reads the live DB.

- [ ] **Step 1: Write the spike probe**

Create `packages/db/src/repositories/balance-sheet.spike.spec.ts`:

```typescript
import { describe, it } from "vitest";
import { prisma } from "../client";

const PL_TYPES = ["Income", "Cost of Goods Sold", "Expense"];

describe("account types spike", () => {
  it("lists balance-sheet account types and balance population", async () => {
    const rows = await prisma.accounts.findMany({
      where: { Is_Active: true },
      select: { Account_Type: true, Balance: true },
    });
    const byType = new Map<string, { count: number; withBalance: number; sum: number }>();
    for (const r of rows) {
      const type = (r.Account_Type?.trim() || "(null)");
      if (PL_TYPES.includes(type)) continue;
      const e = byType.get(type) ?? { count: 0, withBalance: 0, sum: 0 };
      e.count += 1;
      if (r.Balance != null) { e.withBalance += 1; e.sum += Number(r.Balance); }
      byType.set(type, e);
    }
    // eslint-disable-next-line no-console
    console.log("BALANCE-SHEET ACCOUNT TYPES:", JSON.stringify([...byType.entries()], null, 2));
  }, 60_000);
});
```

- [ ] **Step 2: Run the spike and read the output**

Run: `pnpm nx test db -- -t "account types spike"`
Expected: console output listing distinct non-P&L `Account_Type` values with counts, how many have a non-null `Balance`, and the summed balance per type.

Record the answer in the commit message / notes for Task 8:
- **GL-style** if you see classic `Asset` / `Liability` / `Equity` types with populated balances → Task 9 may additionally label super-sections (Assets / Liabilities / Equity) and show an A = L + E check.
- **Bank-only / mixed** → keep the neutral "Account Balances by Type" framing from Tasks 8–9 as-is. Do not fabricate a reconciliation.

- [ ] **Step 3: Delete the spike file (do not commit it)**

```bash
rm packages/db/src/repositories/balance-sheet.spike.spec.ts
```

- [ ] **Step 4: Commit the recorded finding**

```bash
git commit --allow-empty -m "chore(balance-sheet): record account-type spike finding [GL-style|bank-only]"
```

(Replace the bracketed text with the observed result.)

---

## Task 8: Balance Sheet — backend slice

**Files:**
- Create: `packages/contracts/src/balance-sheet.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/db/src/repositories/balance-sheet.ts`
- Modify: `packages/db/src/index.ts`
- Create: `packages/server/src/balance-sheet/service.ts`
- Create: `packages/server/src/balance-sheet/routes.ts`
- Modify: `packages/server/src/app.ts`
- Test: `packages/server/src/balance-sheet/service.spec.ts`
- Test: `packages/server/src/balance-sheet/routes.spec.ts`

**Interfaces:**
- Consumes: `requireStaff`, `signSession`, reused `incomeStatementRepository.clientInFirm`.
- Produces: contract `BalanceSheet`, `balanceSheetSchema`, `balanceSheetRequestSchema`; `balanceSheetRepository.accountBalances(userId): Promise<BalanceRow[]>`; server `buildBalanceSheet(rows, meta)`; endpoint `GET /api/balance-sheet?clientId`.

- [ ] **Step 1: Write the contract**

Create `packages/contracts/src/balance-sheet.ts`:

```typescript
import { z } from "zod";

export const balanceSheetRequestSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

const amount = z.number().finite();

export const balanceSheetAccountSchema = z.object({
  code: z.number(),
  name: z.string(),
  balance: amount,
});
export type BalanceSheetAccount = z.infer<typeof balanceSheetAccountSchema>;

export const balanceSheetGroupSchema = z.object({
  type: z.string(),
  accounts: z.array(balanceSheetAccountSchema),
  subtotal: amount,
});
export type BalanceSheetGroup = z.infer<typeof balanceSheetGroupSchema>;

export const balanceSheetSchema = z.object({
  meta: z.object({ clientId: z.number(), generatedAt: z.string() }),
  groups: z.array(balanceSheetGroupSchema),
  total: amount,
});
export type BalanceSheet = z.infer<typeof balanceSheetSchema>;
```

Add to `packages/contracts/src/index.ts`:

```typescript
export * from "./balance-sheet";
```

- [ ] **Step 2: Write the repository**

Create `packages/db/src/repositories/balance-sheet.ts`:

```typescript
import { prisma } from "../client";

const PL_TYPES = ["Income", "Cost of Goods Sold", "Expense"];

export interface BalanceRow {
  code: number;
  name: string;
  type: string;
  balance: number;
}

export const balanceSheetRepository = {
  async accountBalances(userId: number): Promise<BalanceRow[]> {
    const rows = await prisma.accounts.findMany({
      where: {
        UserId: userId,
        Is_Active: true,
        NOT: { Account_Type: { in: PL_TYPES } },
      },
      select: {
        Account_Code: true,
        Account_Name: true,
        Account_Type: true,
        Balance: true,
        Display_Position: true,
      },
      orderBy: [{ Display_Position: "asc" }, { Account_Name: "asc" }],
    });
    return rows.map((r) => ({
      code: r.Account_Code,
      name: r.Account_Name?.trim() || `Account ${r.Account_Code}`,
      type: r.Account_Type?.trim() || "Uncategorized",
      balance: r.Balance == null ? 0 : Number(r.Balance),
    }));
  },
};
```

Add to `packages/db/src/index.ts`:

```typescript
export * from "./repositories/balance-sheet";
```

- [ ] **Step 3: Write the failing service test**

Create `packages/server/src/balance-sheet/service.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildBalanceSheet } from "./service";
import type { BalanceRow } from "@accounting-completed/db";

const rows: BalanceRow[] = [
  { code: 1000, name: "Checking", type: "Asset", balance: 1000 },
  { code: 1010, name: "Savings", type: "Asset", balance: 500 },
  { code: 2000, name: "Credit Card", type: "Liability", balance: -250 },
];

describe("buildBalanceSheet", () => {
  it("groups by type with subtotals and a grand total, preserving first-seen order", () => {
    const bs = buildBalanceSheet(rows, { clientId: 2189, generatedAt: "2025-06-01T00:00:00.000Z" });
    expect(bs.groups.map((g) => g.type)).toEqual(["Asset", "Liability"]);
    expect(bs.groups[0].subtotal).toBe(1500);
    expect(bs.groups[0].accounts.map((a) => a.code)).toEqual([1000, 1010]);
    expect(bs.groups[1].subtotal).toBe(-250);
    expect(bs.total).toBe(1250);
    expect(bs.meta).toEqual({ clientId: 2189, generatedAt: "2025-06-01T00:00:00.000Z" });
  });

  it("rounds to cents", () => {
    const bs = buildBalanceSheet(
      [{ code: 1, name: "A", type: "Asset", balance: 0.1 }, { code: 2, name: "B", type: "Asset", balance: 0.2 }],
      { clientId: 1, generatedAt: "x" },
    );
    expect(bs.groups[0].subtotal).toBe(0.3);
    expect(bs.total).toBe(0.3);
  });
});
```

- [ ] **Step 4: Run the service test to verify it fails**

Run: `pnpm nx test server -- -t "buildBalanceSheet"`
Expected: FAIL — `./service` cannot be resolved.

- [ ] **Step 5: Write the service**

Create `packages/server/src/balance-sheet/service.ts`:

```typescript
import type { BalanceSheet, BalanceSheetGroup } from "@accounting-completed/contracts";
import type { BalanceRow } from "@accounting-completed/db";

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function buildBalanceSheet(
  rows: BalanceRow[],
  meta: { clientId: number; generatedAt: string },
): BalanceSheet {
  const order: string[] = [];
  const byType = new Map<string, BalanceSheetGroup>();
  for (const r of rows) {
    let group = byType.get(r.type);
    if (!group) {
      group = { type: r.type, accounts: [], subtotal: 0 };
      byType.set(r.type, group);
      order.push(r.type);
    }
    group.accounts.push({ code: r.code, name: r.name, balance: round2(r.balance) });
    group.subtotal = round2(group.subtotal + r.balance);
  }
  const groups = order.map((t) => byType.get(t)!);
  const total = round2(groups.reduce((sum, g) => sum + g.subtotal, 0));
  return { meta, groups, total };
}
```

- [ ] **Step 6: Run the service test to verify it passes**

Run: `pnpm nx test server -- -t "buildBalanceSheet"`
Expected: PASS.

- [ ] **Step 7: Write the route**

Create `packages/server/src/balance-sheet/routes.ts`:

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { balanceSheetRequestSchema, balanceSheetSchema, type SessionUser } from "@accounting-completed/contracts";
import type { BalanceRow } from "@accounting-completed/db";
import { HTTPException } from "hono/http-exception";
import { requireStaff } from "../middleware/request-context";
import { buildBalanceSheet } from "./service";

export interface BalanceSheetDeps {
  clientInFirm(userId: number, firmClientId: number): Promise<boolean>;
  accountBalances(userId: number): Promise<BalanceRow[]>;
}

export function createBalanceSheetRoutes(deps: BalanceSheetDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get(
    "/",
    requireStaff,
    zValidator("query", balanceSheetRequestSchema),
    async (c) => {
      const { clientId } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      if (!(await deps.clientInFirm(clientId, firmClientId))) {
        throw new HTTPException(404, { message: "Client not found" });
      }
      const rows = await deps.accountBalances(clientId);
      const body = buildBalanceSheet(rows, { clientId, generatedAt: new Date().toISOString() });
      return c.json(balanceSheetSchema.parse(body));
    },
  );
}
```

- [ ] **Step 8: Wire the route in app.ts**

Add the import:

```typescript
import { createBalanceSheetRoutes } from "./balance-sheet/routes";
```

Add `balanceSheetRepository` to the `@accounting-completed/db` import, then add to the chained `routes`:

```typescript
  .route("/api/balance-sheet", createBalanceSheetRoutes({
    clientInFirm: incomeStatementRepository.clientInFirm,
    accountBalances: balanceSheetRepository.accountBalances,
  }))
```

- [ ] **Step 9: Write the failing route test**

Create `packages/server/src/balance-sheet/routes.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import type { BalanceRow } from "@accounting-completed/db";
import { requestContext } from "../middleware/request-context";
import { createBalanceSheetRoutes } from "./routes";
import { signSession } from "../auth/jwt";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: BalanceRow[] = [
  { code: 1000, name: "Checking", type: "Asset", balance: 1000 },
  { code: 2000, name: "Card", type: "Liability", balance: -250 },
];
const deps = {
  clientInFirm: async (id: number) => id === 2189,
  accountBalances: async () => rows,
};

function appWith() {
  return new Hono().use("*", requestContext).route("/api/balance-sheet", createBalanceSheetRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("balance sheet routes", () => {
  it("returns grouped balances for staff", async () => {
    const res = await appWith().request("/api/balance-sheet?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(750);
    expect(body.groups.map((g: { type: string }) => g.type)).toEqual(["Asset", "Liability"]);
  });
  it("403s for non-staff", async () => {
    const res = await appWith().request("/api/balance-sheet?clientId=2189", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });
  it("404s for a client outside the firm", async () => {
    const res = await appWith().request("/api/balance-sheet?clientId=9999", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(404);
  });
  it("400s when clientId is missing", async () => {
    const res = await appWith().request("/api/balance-sheet", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 10: Run the route test to verify it passes**

Run: `pnpm nx test server -- -t "balance sheet routes"`
Expected: PASS (4 cases).

- [ ] **Step 11: Verify contracts + server build**

Run: `pnpm nx test contracts` then `pnpm nx build server`
Expected: PASS / build succeeds.

- [ ] **Step 12: Commit**

```bash
git add packages/contracts/src/balance-sheet.ts packages/contracts/src/index.ts \
  packages/db/src/repositories/balance-sheet.ts packages/db/src/index.ts \
  packages/server/src/balance-sheet/ packages/server/src/app.ts
git commit -m "feat(balance-sheet): API + repository for account balances by type"
```

---

## Task 9: Balance Sheet — frontend slice

**Files:**
- Create: `packages/api-client/src/use-balance-sheet.ts`
- Modify: `packages/api-client/src/index.ts`
- Create: `apps/web/src/routes/balance-sheet/BalanceSheetPage.tsx`
- Modify: `apps/web/src/router.tsx`

**Interfaces:**
- Consumes: `balanceSheetSchema`, type `BalanceSheet`; `apiClient`; `useClient`.
- Produces: `useBalanceSheet({clientId})`.
- Spike note: if Task 7 found GL-style types, you may relabel the page heading from "Account balances" to "Balance Sheet" with Assets/Liabilities/Equity emphasis; the data shape is unchanged.

- [ ] **Step 1: Write the API hook**

Create `packages/api-client/src/use-balance-sheet.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { balanceSheetSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useBalanceSheet(params: { clientId: number | null }) {
  const { clientId } = params;
  return useQuery({
    queryKey: ["balance-sheet", clientId],
    enabled: clientId != null,
    queryFn: async () => {
      const r = await apiClient.api["balance-sheet"].$get({ query: { clientId: String(clientId) } });
      if (!r.ok) throw new Error("Failed to load balance sheet");
      return balanceSheetSchema.parse(await r.json());
    },
  });
}
```

Add to `packages/api-client/src/index.ts`:

```typescript
export { useBalanceSheet } from "./use-balance-sheet";
```

- [ ] **Step 2: Write the page**

Create `apps/web/src/routes/balance-sheet/BalanceSheetPage.tsx`:

```tsx
import { Card } from "@accounting-completed/ui";
import { useBalanceSheet } from "@accounting-completed/api-client";
import { useClient } from "../../app/client-context";
import { PageHeader } from "../../components/PageHeader";

const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function BalanceSheetPage() {
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;
  const bsQuery = useBalanceSheet({ clientId: numericClientId });

  return (
    <div>
      <PageHeader title="Balance Sheet" />

      {bsQuery.isLoading && <div className="text-text-soft">Loading…</div>}
      {bsQuery.isError && (
        <div className="text-destructive">
          Failed to load. <button className="underline" onClick={() => bsQuery.refetch()}>Retry</button>
        </div>
      )}
      {bsQuery.isSuccess && bsQuery.data.groups.length === 0 && (
        <div className="text-text-soft">No account balances for this client.</div>
      )}

      {bsQuery.isSuccess && bsQuery.data.groups.length > 0 && (
        <div className="space-y-6">
          {bsQuery.data.groups.map((g) => (
            <Card key={g.type} className="overflow-hidden">
              <table className="w-full text-[13.5px]">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">{g.type}</th>
                    <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[180px]">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {g.accounts.map((acc) => (
                    <tr key={acc.code} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">{acc.name}</td>
                      <td className="px-3 py-2 text-right tnum">{money(acc.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 border-t border-border font-medium">
                    <td className="px-3 py-2">Total {g.type}</td>
                    <td className="px-3 py-2 text-right tnum">{money(g.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </Card>
          ))}

          <div className="flex items-center justify-between px-3 py-3 border-t-2 border-border font-semibold text-[14px]">
            <span>Net balance</span>
            <span className="tnum">{money(bsQuery.data.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire the route**

In `apps/web/src/router.tsx`, add the import:

```typescript
import { BalanceSheetPage } from "./routes/balance-sheet/BalanceSheetPage";
```

Replace the balance-sheet route line:

```typescript
          { path: "/reports/balance-sheet", element: <StubPage />, handle: { title: "Balance Sheet", crumbs: ["Reports", "Balance Sheet"] } },
```

with:

```typescript
          { path: "/reports/balance-sheet", element: <BalanceSheetPage />, handle: { title: "Balance Sheet", crumbs: ["Reports", "Balance Sheet"] } },
```

- [ ] **Step 4: Verify web tests + build**

Run: `pnpm nx test web` then `pnpm nx build web`
Expected: PASS / build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-client/src/use-balance-sheet.ts packages/api-client/src/index.ts \
  apps/web/src/routes/balance-sheet/ apps/web/src/router.tsx
git commit -m "feat(web): Balance Sheet page (account balances by type)"
```

---

## Task 10: Full-stack verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `pnpm nx run-many -t test`
Expected: all projects PASS.

- [ ] **Step 2: Build everything**

Run: `pnpm nx run-many -t build`
Expected: all projects build successfully (confirms RPC types line up end-to-end).

- [ ] **Step 3: Manual smoke (dev server)**

Run: `pnpm dev:api` in one terminal and `pnpm dev` in another. Log in with the staff demo account, pick a client, and verify:
- `/transactions` — rows load; tabs filter by status; search narrows results; year selector switches data.
- `/setup/chart-of-accounts` — accounts grouped by type with per-group totals.
- `/dashboard` — Activity card shows recent changes; Deadlines card remains a clean empty state.
- `/reports/balance-sheet` — balances grouped by type with subtotals and a net total.

- [ ] **Step 4: Final commit (if any smoke fixes were needed)**

```bash
git add -A
git commit -m "chore: verification fixes for data-hydration breadth pass"
```

---

## Self-Review Notes

- **Spec coverage:** Transactions (Tasks 1–2), Chart of Accounts (Tasks 3–4), Dashboard activity + deadlines-stay-empty (Tasks 5–6), Balance Sheet spike + build (Tasks 7–9). Testing strategy (route specs mirroring `routes.spec.ts` + pure service/helper unit tests) and sequencing match the spec. ✓
- **Firm-scoping:** every per-client route (transactions, accounts, balance-sheet) reuses `incomeStatementRepository.clientInFirm` and 404s cross-firm; activity is firm-wide by `firmClientId` with no client param. ✓
- **Type consistency:** repository row types (`RawTxnRow`, `AccountRow`, `ActivityRow`, `BalanceRow`) are re-exported from `@accounting-completed/db` and consumed by name in server services/routes and their specs; contract types feed the hooks and pages. ✓
- **No placeholders:** every code/test step contains complete code and an exact run command with expected result. The only deliberately exploratory step (Task 7 spike) ships concrete probe code and a delete step so it never lands in the repo. ✓
