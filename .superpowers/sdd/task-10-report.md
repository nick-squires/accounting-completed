# Task 10 Report: Module Boundaries, CI Prisma-generate, Foundation E2E Smoke

## depConstraints Added

Added to `eslint.config.mjs` `@nx/enforce-module-boundaries` depConstraints:

| sourceTag | onlyDependOnLibsWithTags |
|---|---|
| `scope:db` | `[]` (leaf) |
| `scope:contracts` | `[]` (leaf) |
| `scope:server` | `["scope:db", "scope:contracts"]` |
| `scope:api-client` | `["scope:contracts", "scope:server"]` |
| `scope:api` | `["scope:server"]` |
| `scope:web` | `["scope:ui", "scope:domain", "scope:utils", "scope:theme", "scope:api-client", "scope:contracts"]` |

Existing entries retained: `type:app`, `type:e2e`, `type:lib`, `scope:ui`, `scope:theme`, `scope:utils`, `scope:domain`.

## api-client → server Type-Only Import

`packages/api-client/src/client.ts` uses `import type { AppType } from "@accounting-completed/server"` — a type-only import for the Hono RPC client. The `@nx/enforce-module-boundaries` rule in the version present does not distinguish type-only imports from value imports at the AST level, so the pragmatic resolution is to allow `scope:server` in `scope:api-client`'s `onlyDependOnLibsWithTags`. A comment is included in the config noting this is type-only (for `AppType`). The boundary still blocks `scope:web` from ever depending on `scope:server` or `scope:db`, which is the critical enforcement goal.

## apps/api Lint Target

`apps/api` has no explicit `lint` target in `project.json`, but the workspace-level `@nx/eslint/plugin` (configured in `nx.json`) auto-infers a `lint` target for every project that has an `eslint.config.mjs` at the workspace root. Confirmed via `nx show project api --json` — the `lint` target is present and active. `nx run-many -t lint` covers `apps/api` without any manual target addition.

## Prisma-generate Wiring

Added to `packages/db/project.json`:
```json
"prisma-generate": {
  "executor": "nx:run-commands",
  "cache": true,
  "inputs": ["packages/db/prisma/schema.prisma", "packages/db/prisma.config.ts"],
  "outputs": ["{projectRoot}/generated"],
  "options": { "command": "pnpm exec prisma generate", "cwd": "packages/db" }
}
```

`db`'s `test` target has `"dependsOn": ["prisma-generate"]`. Added `"prisma-generate": { "cache": true }` to `nx.json` `targetDefaults` so the target is cache-enabled globally.

**Intended CI sequence:**
1. `pnpm install --frozen-lockfile` — install deps
2. `pnpm exec nx run db:prisma-generate` — generate Prisma client (cached on schema hash)
3. `pnpm exec nx run-many -t lint test build` — full gate (test depends on prisma-generate via project.json)
4. `pnpm exec nx run web-e2e:e2e` — Playwright smoke

DB integration tests (those that actually connect to Azure SQL) are gated by `RUN_DB_TESTS=1` env var in the test files. If Azure SQL DB tests are enabled in CI, the Azure SQL firewall must allow the CI runner's egress IP.

There is no CI workflow file in the repo yet. The Nx `dependsOn` wiring ensures `nx run-many -t test` on a clean tree always generates the Prisma client first.

## E2E Smoke (`apps/web-e2e/src/smoke.spec.ts`)

Two tests, no live DB required:

1. **Unauthenticated redirect** — mocks `**/api/auth/me` with 401; navigates to `/`; asserts redirect to `/login` and "Welcome back." heading visible.

2. **Authenticated shell render** — mocks `**/api/auth/me` with a valid `SessionUser` (`{ userId, username, firmClientId, roles: { isStaff: true, ... } }`) and `**/api/clients` with `ClientSummary[]` (`{ id: string, name: string }`); navigates to `/dashboard`; asserts "Accounting Completed" sidebar brand visible and "Acme Corp" client switcher button visible (staff + canSwitchClient path in Sidebar).

## Full Gate Output

### lint (nx run-many -t lint) — PASS
10 projects linted. 0 errors. Warnings only (pre-existing: non-null assertions in db/server, useless fragments in icons.tsx, jsx-a11y anchor warnings in web). No module boundary violations.

### test (nx run-many -t test) — PASS
8 projects tested, 1 dependency task (prisma-generate). All green:
- utils: 9 tests
- domain: 3 tests
- ui: 1 test
- api-client: 2 tests
- web: 16 tests
- server: integration test (health check) passed
- contracts: passed
- db: passed (prisma-generate ran first)

### build (nx run-many -t build) — PASS
- web: Vite production build succeeded (564 kB JS bundle, gzip 174 kB)
- api: esbuild production build succeeded

### e2e (nx run web-e2e:e2e) — PASS
3 tests, 3 passed (6.1s):
- `src/example.spec.ts` › has title
- `src/smoke.spec.ts` › root redirects to /login when unauthenticated
- `src/smoke.spec.ts` › authenticated user sees app shell with client switcher

## Commit SHA
(pending — see git log after commit)

## Concerns
- The `api-client → scope:server` boundary allowance is slightly broader than ideal (permits runtime imports of server code into the browser bundle if someone is not careful), but is necessary because `@nx/enforce-module-boundaries` cannot distinguish `import type` from `import` at the boundary-enforcement level. The rule is documented in a comment. A follow-on could add a custom ESLint rule to disallow non-type imports of `@accounting-completed/server` in `scope:api-client`.
- No GitHub Actions / Azure Pipelines CI workflow file was added (repo has no `.github/` dir). The Nx `dependsOn` wiring ensures the gate works locally and on any Nx-aware CI; a CI workflow file should be added in a follow-on task.
- The `vite preview` process in the Playwright `webServer` block emits a non-zero exit on teardown (port still in use after tests). This is benign — Playwright handles it — but appears as a warning in nx output.
