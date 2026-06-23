# Backend + Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the backend + data foundation — a Hono (Node/TS) API on Azure App Service that reads the existing Azure SQL DB through Prisma 7, authenticates users with first-party credentials (MD5-verify → JWT cookie), and is consumed by a typed React Query data layer — proven end-to-end by a real login + a live clients list wired into the app's client switcher.

**Architecture:** Prisma 7 (introspect-only, `@prisma/adapter-mssql`) in `packages/db` with repositories. zod contracts in `packages/contracts` (single source of truth for types + runtime validation). A Hono app in `packages/server` (routes, services, auth, error/log middleware) exporting `AppType`; `apps/api` is a thin Azure-ready runtime. `packages/api-client` exposes a Hono RPC (`hc<AppType>`) client + React Query hooks. The web app gets a real login + protected routes + a live client switcher.

**Tech Stack:** Node ≥20, TypeScript strict, Hono + `@hono/node-server` + `@hono/zod-validator` + `hono/jwt` + `hono/cookie`, Prisma 7.8 + `@prisma/client` + `@prisma/adapter-mssql`, zod, pino, `@tanstack/react-query`, MSW, Vitest + RTL, Nx (`@nx/node`,`@nx/js`,`@nx/react`,`@nx/vite`), pnpm.

## Global Constraints

- **Package scope:** `@accounting-completed/<name>`. Node ≥20, pnpm ≥9. TypeScript `strict`; no `any` unless justified inline.
- **No DB schema changes.** Prisma is **introspect-only**; the only DB traffic is reads (and credential verification). No migrations against the existing DB.
- **No committed secrets.** `.env` is git-ignored; `.env.example` documents keys. Working DB creds live in `MyAccountantsCloud/MacApi/Web.config` + the project memory.
- **DB (verified):** server `brandedcloudaccounting.database.windows.net,1433`, DB `brandedcloudaccountingtest_shelby3`, user `application_login_prod` (from `MacApi/Web.config`). 38 models introspect cleanly incl. `Users`. Demo firm `Client_Id 69`.
- **Auth:** verify password as **MD5 uppercase-hex** (`FormsAuthentication.HashPasswordForStoringInConfigFile(pwd,"md5")`) against `Users.Password`; issue a signed JWT returned as a **Bearer token** (client sends `Authorization: Bearer <token>`; **no cookie**). Token stored client-side in localStorage (pass-1 tradeoff). **No role gating except `/api/clients` is staff-only** (privacy); derive firm (`Client_Id`) from the token. Logout is client-side; no server revocation.
- **Module boundaries:** `scope:db`→[], `scope:contracts`→[], `scope:server`→[`scope:db`,`scope:contracts`], `scope:api-client`→[`scope:contracts`] (+ type-only `server` for `AppType`), `scope:api`→[`scope:server`], `scope:web`→adds [`scope:api-client`,`scope:contracts`]. `web` must not import `server`/`db`/`api` at runtime.
- **Hosting:** Azure App Service (long-lived Node). Single Prisma pool.
- **pnpm v11:** approve build scripts (`pnpm.onlyBuiltDependencies`) for `esbuild`, `@prisma/client`, `@prisma/engines`, `prisma` — else `nx`/`prisma` fail the deps-status check.

---

## File Structure

```
packages/
  db/        prisma/{schema.prisma}, prisma.config.ts, generated/prisma/, src/{client.ts,repositories/{clients.ts,users.ts},index.ts}, src/*.int.spec.ts
  contracts/ src/{auth.ts,clients.ts,error.ts,index.ts}, src/*.spec.ts
  server/    src/{app.ts,env.ts,logger.ts,middleware/{error.ts,request-context.ts},auth/{password.ts,jwt.ts,routes.ts},clients/routes.ts,index.ts}, src/**/*.spec.ts
  api-client/ src/{client.ts,use-auth.ts,use-clients.ts,index.ts}, src/*.spec.ts
apps/
  api/  src/main.ts, project.json
  web/  src/app/providers.tsx (+QueryClient), src/routes/login/LoginPage.tsx (real auth), src/app/RequireAuth.tsx, src/layout/Sidebar.tsx (real clients), vite.config.ts (+proxy)
```

---

### Task 1: Workspace deps, pnpm build approval, env

**Files:** Modify `package.json`, `.gitignore`; Create `.env`, `.env.example`.

- [ ] **Step 1: Install deps**
```bash
pnpm add -w hono @hono/node-server @hono/zod-validator zod @prisma/client @prisma/adapter-mssql @tanstack/react-query pino dotenv
pnpm add -Dw prisma @nx/node @types/mssql msw pino-pretty
```
Take latest stable (Prisma 7.8+). Note bumps in the commit.

- [ ] **Step 2: Approve pnpm builds** — add to root `package.json`:
```json
"pnpm": { "onlyBuiltDependencies": ["esbuild", "@prisma/client", "@prisma/engines", "prisma"] }
```
Run `pnpm install` → no `ERR_PNPM_IGNORED_BUILDS`.

- [ ] **Step 3: `.env`** (copy real values from `MyAccountantsCloud/MacApi/Web.config` → `DefaultConnection`; never commit):
```
DATABASE_URL="sqlserver://brandedcloudaccounting.database.windows.net:1433;database=brandedcloudaccountingtest_shelby3;user=<user>;password=<password>;encrypt=true;trustServerCertificate=true"
MAC_DB_SERVER=brandedcloudaccounting.database.windows.net
MAC_DB_PORT=1433
MAC_DB_NAME=brandedcloudaccountingtest_shelby3
MAC_DB_USER=<user>
MAC_DB_PASSWORD=<password>
MAC_DB_ENCRYPT=true
JWT_SECRET=<generate a long random string>
API_PORT=3001
```
`.env.example`: same keys, empty values. Confirm `.gitignore` contains `.env` (`git check-ignore .env`).

- [ ] **Step 4: Commit**
```bash
git add package.json pnpm-lock.yaml .gitignore .env.example
git commit -m "chore: add api/db/auth deps + pnpm build approval"
```

---

### Task 2: `packages/db` — Prisma 7 (adapter-mssql) + repositories

**Files:** Create `packages/db/{project.json,package.json,tsconfig*.json,vite.config.ts,prisma.config.ts,prisma/schema.prisma}`, `src/{client.ts,repositories/clients.ts,repositories/users.ts,index.ts,clients.int.spec.ts}`; Modify `tsconfig.base.json`, `.gitignore`.

**Interfaces:**
- Produces: `prisma` (PrismaClient singleton); `ClientRow`, `UserRow` types; `clientsRepository.list(firmClientId: number): Promise<ClientRow[]>`; `usersRepository.findByUsername(username: string): Promise<UserRow | null>`.

- [ ] **Step 1: Generate lib** — `pnpm exec nx g @nx/js:library db --directory=packages/db --bundler=none --unitTestRunner=vitest --no-interactive`. Set name `@accounting-completed/db`, tags `["type:lib","scope:db"]`. Add alias `"@accounting-completed/db": ["packages/db/src/index.ts"]` to `tsconfig.base.json`. Add `prisma/generated/` to `.gitignore`.

- [ ] **Step 2: Prisma schema + config**

`packages/db/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlserver"
}
```
`packages/db/prisma.config.ts`:
```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

- [ ] **Step 3: Introspect + generate** (run from `packages/db`):
```bash
pnpm exec prisma db pull
pnpm exec prisma generate
```
Expected: ~38 models written incl. `model Users`; client generated into `generated/prisma`. Confirm the `Users` field names (`UserId`, `UserName`, `Password`, `Client_Id`, `RoleId`, `Is_Customer`, `Is_Staff`, `Is_Employee`, `Is_Admin`, `Company_Name`, `Full_Name`, `Is_Active`, `Is_Locked`) — adjust later code to the exact casing the generator emits.

- [ ] **Step 4: PrismaClient singleton** — `packages/db/src/client.ts`:
```ts
import "dotenv/config";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaMssql({
  server: process.env.MAC_DB_SERVER!,
  port: Number(process.env.MAC_DB_PORT ?? 1433),
  database: process.env.MAC_DB_NAME!,
  user: process.env.MAC_DB_USER!,
  password: process.env.MAC_DB_PASSWORD!,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: process.env.MAC_DB_ENCRYPT !== "false", trustServerCertificate: true },
});

export const prisma = new PrismaClient({ adapter });
```

- [ ] **Step 5: Repositories** — `packages/db/src/repositories/clients.ts`:
```ts
import { prisma } from "../client";

export interface ClientRow { UserId: number; Company_Name: string | null; Full_Name: string; }

export const clientsRepository = {
  list(firmClientId: number): Promise<ClientRow[]> {
    return prisma.users.findMany({
      where: { Client_Id: firmClientId, Is_Customer: true, Is_Active: true, Is_Locked: false },
      select: { UserId: true, Company_Name: true, Full_Name: true },
      orderBy: [{ Company_Name: "asc" }, { Full_Name: "asc" }],
    });
  },
};
```
`packages/db/src/repositories/users.ts`:
```ts
import { prisma } from "../client";

export interface UserRow {
  UserId: number; UserName: string | null; Password: string | null; Client_Id: number | null;
  RoleId: number | null; Is_Staff: boolean | null; Is_Customer: boolean | null;
  Is_Employee: boolean | null; Is_Admin: boolean | null; Full_Name: string | null; Company_Name: string | null;
}

export const usersRepository = {
  findByUsername(username: string): Promise<UserRow | null> {
    return prisma.users.findFirst({
      where: { UserName: username, Is_Active: true, Is_Locked: false },
      select: { UserId: true, UserName: true, Password: true, Client_Id: true, RoleId: true,
        Is_Staff: true, Is_Customer: true, Is_Employee: true, Is_Admin: true, Full_Name: true, Company_Name: true },
    });
  },
};
```
`packages/db/src/index.ts`:
```ts
export { prisma } from "./client";
export * from "./repositories/clients";
export * from "./repositories/users";
```

- [ ] **Step 6: Integration test** — `packages/db/src/clients.int.spec.ts`:
```ts
import { afterAll, describe, expect, it } from "vitest";
import { prisma, clientsRepository, usersRepository } from "./index";

const RUN = !!process.env.DATABASE_URL && process.env.RUN_DB_TESTS === "1";

describe.skipIf(!RUN)("db repositories (integration, firm 69)", () => {
  afterAll(async () => { await prisma.$disconnect(); });
  it("lists real clients for the demo firm", async () => {
    const rows = await clientsRepository.list(69);
    expect(rows.length).toBeGreaterThan(0);
    expect(typeof rows[0].UserId).toBe("number");
  });
  it("finds a known user row shape (or null)", async () => {
    const u = await usersRepository.findByUsername("__no_such_user__");
    expect(u).toBeNull();
  });
});
```
Run `RUN_DB_TESTS=1 pnpm exec nx run db:test` → PASS (or skipped). Adjust field casing if generate differed.

- [ ] **Step 7: Commit** — `git add packages/db tsconfig.base.json .gitignore package.json pnpm-lock.yaml && git commit -m "feat(db): prisma 7 mssql adapter + clients/users repositories"`

---

### Task 3: `packages/contracts` — zod schemas (auth, clients, error)

**Files:** Create lib + `src/{auth.ts,clients.ts,error.ts,index.ts,auth.spec.ts}`; Modify `tsconfig.base.json`.

**Interfaces:** `loginRequestSchema` + `LoginRequest`; `sessionUserSchema` + `SessionUser` (`{ userId; username; firmClientId; roles: { isStaff; isCustomer; isEmployee; isAdmin } }`); `loginResponseSchema` + `LoginResponse` (`{ token: string; user: SessionUser }`); `clientsResponseSchema` + `ClientSummary`; `apiErrorSchema` + `ApiError` (`{ error: { code; message; details? } }`).

- [ ] **Step 1: Generate lib** (`@nx/js:library contracts … --bundler=none --unitTestRunner=vitest`); name `@accounting-completed/contracts`, tags `["type:lib","scope:contracts"]`; alias; add `zod` dep.

- [ ] **Step 2: Failing test** — `src/auth.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { loginRequestSchema, sessionUserSchema } from "./auth";

describe("auth contracts", () => {
  it("accepts valid login", () => expect(loginRequestSchema.parse({ username: "a", password: "b" }).username).toBe("a"));
  it("rejects empty username", () => expect(() => loginRequestSchema.parse({ username: "", password: "b" })).toThrow());
  it("validates a session user", () => {
    const u = sessionUserSchema.parse({ userId: 1, username: "a", firmClientId: 69, roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false } });
    expect(u.firmClientId).toBe(69);
  });
});
```
Run `nx run contracts:test` → FAIL.

- [ ] **Step 3: Implement** — `src/auth.ts`:
```ts
import { z } from "zod";
export const loginRequestSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const sessionUserSchema = z.object({
  userId: z.number().int(),
  username: z.string(),
  firmClientId: z.number().int().nullable(),
  roles: z.object({ isStaff: z.boolean(), isCustomer: z.boolean(), isEmployee: z.boolean(), isAdmin: z.boolean() }),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const loginResponseSchema = z.object({ token: z.string(), user: sessionUserSchema });
export type LoginResponse = z.infer<typeof loginResponseSchema>;
```
`src/clients.ts`:
```ts
import { z } from "zod";
export const clientSummarySchema = z.object({ id: z.string(), name: z.string() });
export const clientsResponseSchema = z.array(clientSummarySchema);
export type ClientSummary = z.infer<typeof clientSummarySchema>;
```
`src/error.ts`:
```ts
import { z } from "zod";
export const apiErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }) });
export type ApiError = z.infer<typeof apiErrorSchema>;
```
`src/index.ts`: `export * from "./auth"; export * from "./clients"; export * from "./error";`
Run `nx run contracts:test` → PASS. Commit `feat(contracts): auth/clients/error zod schemas`.

---

### Task 4: `packages/server` — Hono app, env, logging, error middleware

**Files:** Create lib + `src/{env.ts,logger.ts,app.ts,index.ts,middleware/error.ts}`, `src/app.spec.ts`; tags `["type:lib","scope:server"]`; alias `@accounting-completed/server`. Deps: hono, `@hono/zod-validator`, zod, pino; deps on `@accounting-completed/{db,contracts}`.

**Interfaces:** Produces `app` (Hono) with `/health` + (later) auth/clients routes; `type AppType = typeof app`; `env` (validated). Error middleware maps thrown errors to `apiErrorSchema` shape.

- [ ] **Step 1: env** — `src/env.ts`:
```ts
import "dotenv/config";
import { z } from "zod";
const schema = z.object({ JWT_SECRET: z.string().min(16), API_PORT: z.coerce.number().default(3001) });
export const env = schema.parse(process.env);
```
- [ ] **Step 2: logger** — `src/logger.ts`: `import pino from "pino"; export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });`
- [ ] **Step 3: error middleware** — `src/middleware/error.ts`:
```ts
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../logger";

export function onError(err: Error, c: Context) {
  if (err instanceof HTTPException) {
    return c.json({ error: { code: String(err.status), message: err.message } }, err.status);
  }
  logger.error({ err }, "unhandled error");
  return c.json({ error: { code: "500", message: "Internal Server Error" } }, 500);
}
```
- [ ] **Step 4: app** — `src/app.ts`:
```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as pinoLogger } from "./logger";
import { onError } from "./middleware/error";

export const app = new Hono();
app.use("*", cors({ origin: (o) => o, credentials: true }));
app.use("*", async (c, next) => { const t = Date.now(); await next(); pinoLogger.info({ m: c.req.method, p: c.req.path, s: c.res.status, ms: Date.now() - t }); });
app.onError(onError);
app.get("/health", (c) => c.json({ status: "ok" }));

export type AppType = typeof app;
```
`src/index.ts`: `export { app, type AppType } from "./app"; export { env } from "./env";`
- [ ] **Step 5: test** — `src/app.spec.ts`: assert `app.request("/health")` → 200 `{status:"ok"}`. Run `nx run server:test` → PASS. Commit `feat(server): hono app skeleton + env + logging + error contract`.

---

### Task 5: Auth — MD5 verify + JWT cookie + login/logout/me + requestContext (TDD)

**Files:** Create `packages/server/src/auth/{password.ts,jwt.ts,routes.ts}`, `src/middleware/request-context.ts`, specs `password.spec.ts`, `routes.spec.ts`; Modify `app.ts` (mount auth + context).

**Interfaces:** `hashLegacyPassword(pwd): string` (MD5 uppercase hex); `verifyPassword(pwd, stored): boolean`; `signSession(user): Promise<string>` / `readSession(token): Promise<SessionUser|null>`; `createAuthRoutes(deps)` → `/login`,`/logout`,`/me`; `requestContext` middleware sets `c.get("user"): SessionUser | null`; `requireAuth` middleware → 401 if absent.

- [ ] **Step 1: Failing password test** — `src/auth/password.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { hashLegacyPassword, verifyPassword } from "./password";

describe("legacy password (MD5 uppercase hex)", () => {
  it("produces 32-char uppercase hex", () => {
    const h = hashLegacyPassword("Secret123");
    expect(h).toMatch(/^[0-9A-F]{32}$/);
  });
  it("verifies a matching password and rejects a wrong one", () => {
    const stored = hashLegacyPassword("Secret123");
    expect(verifyPassword("Secret123", stored)).toBe(true);
    expect(verifyPassword("nope", stored)).toBe(false);
  });
  it("compares case-insensitively to stored hash", () => {
    const stored = hashLegacyPassword("Secret123").toLowerCase();
    expect(verifyPassword("Secret123", stored)).toBe(true);
  });
});
```
- [ ] **Step 2: Implement** — `src/auth/password.ts`:
```ts
import { createHash } from "node:crypto";

// Mirrors ASP.NET FormsAuthentication.HashPasswordForStoringInConfigFile(pwd,"md5").
// Confirm the byte encoding against a real credential during rollout.
export function hashLegacyPassword(password: string): string {
  return createHash("md5").update(password, "utf8").digest("hex").toUpperCase();
}
export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  return hashLegacyPassword(password) === stored.toUpperCase();
}
```
Run `nx run server:test` → password specs PASS.

- [ ] **Step 3: JWT** — `src/auth/jwt.ts`:
```ts
import { sign, verify } from "hono/jwt";
import { sessionUserSchema, type SessionUser } from "@accounting-completed/contracts";
import { env } from "../env";

const TTL_SECONDS = 60 * 60 * 8;
export async function signSession(user: SessionUser): Promise<string> {
  return sign({ ...user, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }, env.JWT_SECRET);
}
export async function readSession(token: string): Promise<SessionUser | null> {
  try {
    const payload = await verify(token, env.JWT_SECRET);
    return sessionUserSchema.parse(payload);
  } catch { return null; }
}
```
(Note: `Date.now()` is fine in the real server runtime; only Workflow scripts forbid it.)

- [ ] **Step 4: requestContext + requireAuth** — `src/middleware/request-context.ts`:
```ts
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { SessionUser } from "@accounting-completed/contracts";
import { readSession } from "../auth/jwt";

type Vars = { Variables: { user: SessionUser | null } };

export const requestContext = createMiddleware<Vars>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  c.set("user", token ? await readSession(token) : null);
  await next();
});

export const requireAuth = createMiddleware<Vars>(async (c, next) => {
  if (!c.get("user")) throw new HTTPException(401, { message: "Not authenticated" });
  await next();
});

export const requireStaff = createMiddleware<Vars>(async (c, next) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Not authenticated" });
  if (!user.roles.isStaff) throw new HTTPException(403, { message: "Staff only" });
  await next();
});
```

- [ ] **Step 5: Failing auth-routes test** — `src/auth/routes.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { requestContext } from "../middleware/request-context";
import { createAuthRoutes } from "./routes";
import { hashLegacyPassword } from "./password";

const fakeUser = { UserId: 2189, UserName: "demo", Password: hashLegacyPassword("pw"), Client_Id: 69, RoleId: 1, Is_Staff: true, Is_Customer: false, Is_Employee: false, Is_Admin: false, Full_Name: "Demo", Company_Name: "Demo Co" };
const deps = { findByUsername: async (u: string) => (u === "demo" ? fakeUser : null) };
const app = new Hono().use("*", requestContext).route("/api/auth", createAuthRoutes(deps));

describe("auth routes", () => {
  it("rejects bad credentials with 401", async () => {
    const res = await app.request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "demo", password: "wrong" }) });
    expect(res.status).toBe(401);
  });
  it("logs in, returns a token, and /me accepts the Bearer token", async () => {
    const login = await app.request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "demo", password: "pw" }) });
    expect(login.status).toBe(200);
    const { token, user } = await login.json();
    expect(typeof token).toBe("string");
    expect(user.username).toBe("demo");
    const me = await app.request("/api/auth/me", { headers: { authorization: `Bearer ${token}` } });
    expect(me.status).toBe(200);
    expect((await me.json()).username).toBe("demo");
  });
  it("rejects /me without a token (401)", async () => {
    expect((await app.request("/api/auth/me")).status).toBe(401);
  });
});
```
- [ ] **Step 6: Implement routes** — `src/auth/routes.ts`:
```ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { loginRequestSchema, type SessionUser } from "@accounting-completed/contracts";
import type { UserRow } from "@accounting-completed/db";
import { verifyPassword } from "./password";
import { signSession } from "./jwt";
import { requireAuth } from "../middleware/request-context";

export interface AuthDeps { findByUsername(username: string): Promise<UserRow | null>; }

const toSessionUser = (u: UserRow): SessionUser => ({
  userId: u.UserId, username: u.UserName ?? "", firmClientId: u.Client_Id ?? null,
  roles: { isStaff: !!u.Is_Staff, isCustomer: !!u.Is_Customer, isEmployee: !!u.Is_Employee, isAdmin: !!u.Is_Admin },
});

export function createAuthRoutes(deps: AuthDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>()
    .post("/login", zValidator("json", loginRequestSchema), async (c) => {
      const { username, password } = c.req.valid("json");
      const row = await deps.findByUsername(username);
      if (!row || !verifyPassword(password, row.Password)) throw new HTTPException(401, { message: "Invalid credentials" });
      const user = toSessionUser(row);
      const token = await signSession(user);
      return c.json({ token, user });
    })
    .post("/logout", (c) => c.json({ ok: true })) // stateless: client drops the token
    .get("/me", requireAuth, (c) => c.json(c.get("user")));
}
```
- [ ] **Step 7: Mount** in `app.ts` (after middleware, before export): add `app.use("*", requestContext);` and `app.route("/api/auth", createAuthRoutes({ findByUsername: usersRepository.findByUsername }));` (import `usersRepository` from `@accounting-completed/db`, `createAuthRoutes` + `requestContext`). Run `nx run server:test` → PASS. Commit `feat(server): credential auth (MD5 verify) + JWT cookie + requestContext`.

---

### Task 6: Clients route — scoped to the session firm (TDD)

**Files:** Create `packages/server/src/clients/routes.ts`, `routes.spec.ts`; Modify `app.ts`.

**Interfaces:** `createClientsRoutes(deps)` → `GET /api/clients` (requireAuth; firm from `c.get("user").firmClientId`); `deps.list(firmClientId): Promise<ClientRow[]>`.

- [ ] **Step 1: Failing test** — `src/clients/routes.spec.ts`: build a Hono app whose middleware injects a **staff** `user` (`c.set("user", { userId:1, username:"s", firmClientId:69, roles:{ isStaff:true, isCustomer:false, isEmployee:false, isAdmin:false } })`) then mounts `createClientsRoutes({ list: async () => [{ UserId: 2189, Company_Name: "Demo Co", Full_Name: "x" }] })`; assert `GET /api/clients` → 200 and body `[{ id: "2189", name: "Demo Co" }]`. Add cases: a **non-staff** user → **403**; **no** user → **401** (build separate app instances injecting those users / null).
- [ ] **Step 2: Implement** — `src/clients/routes.ts`:
```ts
import { Hono } from "hono";
import { clientsResponseSchema, type SessionUser } from "@accounting-completed/contracts";
import type { ClientRow } from "@accounting-completed/db";
import { requireStaff } from "../middleware/request-context";

export interface ClientsDeps { list(firmClientId: number): Promise<ClientRow[]>; }

export function createClientsRoutes(deps: ClientsDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get("/", requireStaff, async (c) => {
    const firm = c.get("user")!.firmClientId ?? 0;
    const rows = await deps.list(firm);
    return c.json(clientsResponseSchema.parse(rows.map((r) => ({ id: String(r.UserId), name: r.Company_Name?.trim() || r.Full_Name }))));
  });
}
```
- [ ] **Step 3: Mount** in `app.ts`: `app.route("/api/clients", createClientsRoutes({ list: clientsRepository.list }));`. Run `nx run server:test` → PASS. Commit `feat(server): clients route scoped to session firm`.

---

### Task 7: `apps/api` — Azure-ready Hono runtime

**Files:** Create via `@nx/node:application api --directory=apps/api --framework=none --unitTestRunner=vitest --no-interactive`; tags `["type:app","scope:api"]`. `src/main.ts`:
```ts
import { serve } from "@hono/node-server";
import { app, env } from "@accounting-completed/server";

const port = Number(process.env.PORT ?? env.API_PORT); // Azure App Service sets PORT
serve({ fetch: app.fetch, port });
console.log(`api listening on ${port}`);
```
Add root scripts `"dev:api": "nx run api:serve"`. Verify `nx run api:serve` + `curl /health` → ok. Commit `feat(api): azure-ready hono runtime`.

---

### Task 8: `packages/api-client` — Hono RPC client + React Query hooks (MSW tests)

**Files:** `@nx/react:library api-client … --component=false`; tags `["type:lib","scope:api-client"]`; alias; deps `@tanstack/react-query`, `hono`, `@accounting-completed/contracts` (+ type-only `@accounting-completed/server` for `AppType`).

**Interfaces:** `apiClient = hc<AppType>(baseUrl, { init: { credentials: "include" } })`; `useLogin()` (mutation), `useMe()` (query, 401→null), `useLogout()`, `useClients()`.

- [ ] **Step 1: client** — `src/client.ts`:
```ts
import { hc } from "hono/client";
import type { AppType } from "@accounting-completed/server";

const TOKEN_KEY = "ac_token";
export function getToken(): string | null {
  return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}
export function setToken(t: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "";
export const apiClient = hc<AppType>(BASE, {
  headers: () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; },
});
```
- [ ] **Step 2: hooks** — `src/use-auth.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginRequest, SessionUser } from "@accounting-completed/contracts";
import { apiClient, setToken } from "./client";

export function useMe() {
  return useQuery<SessionUser | null>({
    queryKey: ["me"],
    queryFn: async () => { const r = await apiClient.api.auth.me.$get(); return r.ok ? await r.json() : null; },
    retry: false,
  });
}
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const r = await apiClient.api.auth.login.$post({ json: body });
      if (!r.ok) throw new Error("Invalid credentials");
      return (await r.json()) as SessionUser;
    },
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async () => { await apiClient.api.auth.logout.$post(); }, onSuccess: () => qc.setQueryData(["me"], null) });
}
```
`src/use-clients.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { clientsResponseSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: async () => {
    const r = await apiClient.api.clients.$get();
    if (!r.ok) throw new Error("Failed to load clients");
    return clientsResponseSchema.parse(await r.json());
  } });
}
```
`src/index.ts` barrels all. (RPC path accessors like `apiClient.api.auth.me` derive from the mounted route paths; adjust to match the exact `app.route(...)` structure.)
- [ ] **Step 3: MSW test** — `src/use-auth.spec.tsx`: mock `*/api/auth/login` + `*/api/auth/me`; render `useLogin`/`useMe` with a QueryClient wrapper; assert login success populates `me`. Run `nx run api-client:test` → PASS. Commit `feat(api-client): hono RPC client + react-query auth/clients hooks`.

---

### Task 9: Wire the web app — QueryClient, real login, route guard, live client switcher

**Files:** Modify `apps/web/src/app/providers.tsx` (QueryClientProvider), `apps/web/vite.config.ts` (`/api` proxy → `http://localhost:3001`), `apps/web/src/routes/login/LoginPage.tsx` (call `useLogin`, navigate on success), `apps/web/src/router.tsx` (wrap in-app routes with `RequireAuth`), `apps/web/src/layout/Sidebar.tsx` (client switcher from `useClients`); Create `apps/web/src/app/RequireAuth.tsx`.

- [ ] **Step 1: QueryClientProvider** — wrap `AppProviders` children in `<QueryClientProvider client={new QueryClient(...)}>` (as in the deferred plan's Task 8 snippet).
- [ ] **Step 2: Vite proxy** — add `server.proxy["/api"] = { target: "http://localhost:3001", changeOrigin: true }`.
- [ ] **Step 3: RequireAuth** — `apps/web/src/app/RequireAuth.tsx`:
```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@accounting-completed/api-client";

export function RequireAuth() {
  const { data, isLoading } = useMe();
  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  return data ? <Outlet /> : <Navigate to="/login" replace />;
}
```
- [ ] **Step 4: LoginPage** — replace the fake navigate with `const login = useLogin(); ... onSubmit → login.mutateAsync({username,password}).then(() => navigate("/dashboard")).catch(show error)`. Keep the existing two-panel layout.
- [ ] **Step 5: router** — wrap the `AppLayout` route element so it's a child of a `RequireAuth` route (`{ element: <RequireAuth/>, children: [ { element: <AppLayout/>, children: [...] } ] }`).
- [ ] **Step 6: Sidebar switcher** — replace mock `CLIENTS` usage with `useClients()` data (the endpoint is **staff-only**, so render the switcher only when `useMe()` shows a staff user); selecting one sets `ClientContext` (keep context, feed it real ids/names). Loading/empty states.
- [ ] **Step 7: Page test (MSW)** — `LoginPage.spec.tsx`: mock `/api/auth/login` + `/api/auth/me`; type credentials, submit, assert navigation/`me` populated. Run `nx run web:test` → PASS.
- [ ] **Step 8: Live verify** — run `nx run api:serve` + `nx run web:dev`; log in with a **real DB credential** (use a **staff** account to populate the switcher; any valid account proves `/me`). Confirm the token persists across reload (localStorage), `/dashboard` loads, the staff switcher lists real firm-69 clients (non-staff: switcher hidden by design; `/api/clients` → 403), and logout clears the token and returns to `/login`. (You provide the test credential — passwords aren't knowable from the data.)
- [ ] **Step 9: Commit** — `git add apps/web && git commit -m "feat(web): real login + route guard + live client switcher"`

---

### Task 10: Module boundaries, CI, verification gate

**Files:** Modify `eslint.config.mjs` (depConstraints for `scope:db|contracts|server|api-client|api`, extend `scope:web`); CI workflow / Nx targets; `apps/web-e2e` smoke.

- [ ] **Step 1: depConstraints** — add the §"Module boundaries" constraints to `@nx/enforce-module-boundaries`; extend `scope:web` allowed tags to include `scope:api-client`,`scope:contracts`. `nx run-many -t lint` → PASS.
- [ ] **Step 2: CI** — ensure CI runs `pnpm install` (build approval set), `nx run db:prisma-generate` (add a target running `prisma generate`) before typecheck/build, `nx run-many -t lint test build`. Integration DB tests skip unless `RUN_DB_TESTS=1` + secrets present. Document that Azure SQL firewall must allow CI runners if DB tests are enabled.
- [ ] **Step 3: e2e smoke** — Playwright: `/` → `/login`; mock `**/api/auth/me` (unauth) so guard redirects; with a mocked authenticated `me` + `/api/clients`, the shell + switcher render. (Avoids needing live DB in CI.)
- [ ] **Step 4: Full gate** — `nx run-many -t lint test build` + `nx run web-e2e:e2e` → all green. Commit `chore: enforce boundaries, CI prisma-generate, foundation e2e smoke`.

---

## Follow-on (separate plans)
1. **Income statement page** — un-defer `…-income-statement-page-DEFERRED.md`; rebuild on this foundation (proc convention `callProc` + report page).
2. **Authorization** — enforce `RoleAccess` permissions + per-firm/client query scoping depth.
3. **Auth hardening** — transparent rehash (argon2/bcrypt) on login (needs sanctioned `Users.Password` writes); audit `Password_Normal`; move the access token off localStorage (in-memory + httpOnly refresh-token rotation); add login rate-limiting/lockout (`Attempt_Count`/`Attempt_Datetime`); add token revocation.
4. **Observability/secrets** — APM, Azure Key Vault for `JWT_SECRET`/DB creds.

## Self-Review notes
- **Coverage:** deps/pnpm/env (T1), Prisma 7 db + repos (T2), contracts (T3), server skeleton+env+log+error (T4), auth MD5+JWT+context (T5), clients route scoped to firm (T6), Azure runtime (T7), RPC client+hooks (T8), web login+guard+switcher (T9), boundaries+CI+e2e (T10). Auth §3a, hosting, authorization-omitted all reflected.
- **Risks:** (a) exact Prisma field casing post-introspection — T2 Step 3 confirms; (b) exact MD5 byte encoding — T5 notes confirm vs a real credential; (c) Hono RPC path accessors must match mounted route structure — T8 notes; (d) `@nx/node` generator flag drift — deliverable stated.
- **Type consistency:** `SessionUser`/`ClientSummary`/`UserRow`/`ClientRow` defined once (T2/T3) and reused in T5/T6/T8/T9; `SESSION_COOKIE`, `createAuthRoutes`/`createClientsRoutes` signatures stable across tasks.
