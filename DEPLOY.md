# Deployment

This app deploys as a **single Azure App Service per environment**. One Node process
serves both the JSON API (`/api/*`, `/health`) and the built web SPA (everything
else, with `index.html` fallback for client-side routes). There is no separate
frontend host and therefore no cross-origin setup.

| Environment | App Service name |
|---|---|
| Dev | `accounting-completed-dev` |
| Prod | `accounting-completed-prd` |

## How the artifact is built

`pnpm build:deploy` produces a self-contained Node app in `dist/apps/api`:

- `main.js` — the esbuild-bundled server (workspace code + the generated Prisma client are inlined)
- `package.json` — generated prod manifest listing the external deps (`@prisma/client`, `hono`, …)
- `public/` — the built web SPA, copied from `dist/apps/web`

CI then runs `npm install --omit=dev` inside `dist/apps/api` to materialize
`node_modules`, and ships the whole folder as the deploy package. The contents of
`dist/apps/api` become the App Service's `/home/site/wwwroot`.

> Verified locally: the bundled artifact boots, serves the SPA + assets, falls back
> to `index.html` for client routes, returns 404 for unknown `/api` paths, and
> reaches Azure SQL through Prisma (a login attempt hits the DB and returns 401).

## One-time Azure setup (per app)

1. **Create** a Linux App Service, runtime **Node 20 LTS**.
2. **Startup command:** `node main.js`
3. **App settings** (Configuration → Application settings) — set these in Azure, not in the repo:
   - `JWT_SECRET` — ≥16 chars (validated at boot)
   - `MAC_DB_SERVER`, `MAC_DB_PORT` (1433), `MAC_DB_NAME`, `MAC_DB_USER`, `MAC_DB_PASSWORD`
   - `MAC_DB_ENCRYPT` = `true` (default; required for Azure SQL)
   - `PORT` is injected by App Service — do not set it.
   - `WEB_ROOT` defaults to `./public`; leave unset.
   - `CORS_ORIGINS` not needed (same-origin). Set only if you later split the SPA out.
4. **Azure SQL firewall:** enable "Allow Azure services and resources to access this
   server" (or put the App Service on a VNet with a private endpoint).
5. **Health check:** point App Service health check at `/health`.

## CI/CD (`.github/workflows/deploy.yml`)

- **Push to `main`** → builds and deploys to **dev** automatically.
- **Manual run** (Actions → Deploy → Run workflow) → choose **dev** or **prd**.
- Protect prod by adding required reviewers to a GitHub **Environment** named `prd`.

### Required secrets

Each GitHub Environment (`dev`, `prd`) needs one secret:

- `AZURE_WEBAPP_PUBLISH_PROFILE` — download from the corresponding App Service
  (Overview → Get publish profile) and paste as the environment secret.

## Local check of the production artifact

```sh
pnpm build:deploy
cd dist/apps/api && npm install --omit=dev
cp ../../../.env .env            # local only — App Service uses its own app settings
PORT=3010 node main.js
# curl http://localhost:3010/health   -> {"status":"ok"}
# curl http://localhost:3010/clients  -> index.html (SPA fallback)
```
