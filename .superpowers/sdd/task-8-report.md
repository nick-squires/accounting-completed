# Task 8 Report: `packages/api-client`

## Files Created / Modified

### New files
- `packages/api-client/project.json` — Nx project config, tags `["type:lib","scope:api-client"]`
- `packages/api-client/tsconfig.json` — extends `tsconfig.base.json`, `jsx: "react-jsx"`
- `packages/api-client/tsconfig.spec.json` — includes spec/tsx files, vitest types
- `packages/api-client/vite.config.ts` — jsdom environment, react + nxViteTsPaths plugins, setupFiles
- `packages/api-client/src/client.ts` — `getToken`/`setToken` (localStorage), `apiClient = hc<AppType>(...)`
- `packages/api-client/src/use-auth.ts` — `useMe`, `useLogin` (stores token), `useLogout` (clears token)
- `packages/api-client/src/use-clients.ts` — `useClients` with `clientsResponseSchema.parse`
- `packages/api-client/src/index.ts` — barrel export
- `packages/api-client/src/test-setup.ts` — MSW server lifecycle (beforeAll/afterEach/afterAll)
- `packages/api-client/src/mocks/handlers.ts` — MSW handlers for `POST */api/auth/login` and `GET */api/auth/me`
- `packages/api-client/src/mocks/server.ts` — `setupServer(...handlers)`
- `packages/api-client/src/use-auth.spec.tsx` — 2 tests: login success + login failure

### Modified files
- `packages/server/src/app.ts` — **refactored AppType** (see below)
- `tsconfig.base.json` — added `"@accounting-completed/api-client"` path alias

## `app.ts` AppType Refactor

**Why:** The original file used separate `app.route()` calls that did not chain their return values back into the `app` variable, so `typeof app` was just a bare `Hono` with no typed route information. Hono's RPC client `hc<AppType>` requires the chained return type to resolve endpoint paths.

**Change:** Replaced the four separate statements with a chained const:
```ts
const routes = app
  .route("/api/auth", createAuthRoutes({ ... }))
  .route("/api/clients", createClientsRoutes({ ... }))
  .get("/health", (c) => c.json({ status: "ok" }));

export type AppType = typeof routes;
```
`app` itself is still exported as the runtime value. All server tests still pass after the change.

## RPC Path Accessors

The route mount structure `/api/auth` and `/api/clients` means accessors are:
- `apiClient.api.auth.login.$post(...)` — POST /api/auth/login
- `apiClient.api.auth.me.$get()` — GET /api/auth/me
- `apiClient.api.auth.logout.$post()` — POST /api/auth/logout
- `apiClient.api.clients.$get()` — GET /api/clients

## Test Results

- `nx run api-client:test`: **2/2 PASS** (jsdom environment, MSW mocks)
- `nx run server:test`: **10/10 PASS** (app.spec=1, auth/routes=3, clients/routes=3, auth/password=3)

## Commit SHA

See git log — commit message: `feat(api-client): hono RPC client + react-query auth/clients hooks`

## Concerns

None. RPC types resolved cleanly after the chained-routes refactor. No `any` fallbacks used.
