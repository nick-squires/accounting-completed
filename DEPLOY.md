# Deployment

This app deploys as a **single container per environment** to Azure App Service for
Containers. One Node process inside the container serves both the JSON API
(`/api/*`, `/health`) and the built web SPA (everything else, with `index.html`
fallback for client-side routes). No separate frontend host, no cross-origin setup.

> Why a container? App Service Linux extracts deploy packages onto a network-backed
> file share, which is pathologically slow for `node_modules` (thousands of small
> files) — zip/Oryx/OneDeploy all stall on it. A container ships `node_modules` in an
> image layer (local FS), so the platform just pulls and runs. Deterministic and fast.

| Environment | App Service | Image tag |
|---|---|---|
| Dev | `accounting-completed-dev` | `ghcr.io/nick-squires/accounting-completed:dev` |
| Prod | `accounting-completed-prd` | `ghcr.io/nick-squires/accounting-completed:prd` |

Both run on the shared Linux **B1** plan `accounting-completed-plan` (South Central
US) in resource group `BrandedCloudAccounting`.

## The image

`Dockerfile` is multi-stage: a `builder` stage runs `pnpm install` + `pnpm
build:deploy` (web + api, web copied into `dist/apps/api/public`) and `npm install
--omit=dev` for the artifact; a slim `runner` stage carries only `dist/apps/api` and
runs `node main.js`. It listens on `PORT` (set to 8080 in the image); App Service maps
to it via `WEBSITES_PORT=8080`.

> The build sets a placeholder `DATABASE_URL` so `prisma generate` (which reads
> `prisma.config.ts`) can run without a DB — it never connects at generate time. The
> runtime uses `MAC_DB_*` instead.

Build & run locally:

```sh
docker build -t accounting-completed:local .
docker run --rm --env-file .env -p 8090:8080 accounting-completed:local
# curl localhost:8090/health -> {"status":"ok"};  /clients -> SPA shell
```

## CI/CD (`.github/workflows/deploy.yml`)

- **Push to `main`** → builds & pushes `:dev`, updates **dev**.
- **Manual run** (Actions → Deploy → Run workflow) → choose **dev** or **prd**.
- Protect prod by adding required reviewers to a GitHub **Environment** named `prd`.

CI pushes to ghcr.io using the built-in `GITHUB_TOKEN` (no extra secret). Updating the
App Service image needs one secret per GitHub Environment:

- `AZURE_WEBAPP_PUBLISH_PROFILE` — download from the App Service (Overview → Get
  publish profile) and paste as the environment secret.

## App Service configuration (already applied; recorded here)

Per app:

- **Container image:** `linuxFxVersion = DOCKER|ghcr.io/.../accounting-completed:<tag>`
- **`WEBSITES_PORT`** = `8080`
- **App settings:** `JWT_SECRET` (unique per env), `MAC_DB_SERVER/PORT/NAME/USER/PASSWORD`,
  `MAC_DB_ENCRYPT=true`. `PORT` is provided by the platform.
- **Registry pull credentials** (`DOCKER_REGISTRY_SERVER_URL/USERNAME/PASSWORD`) point
  at ghcr.io. See the hardening note below.
- **Health check** path: `/health`.
- Azure SQL firewall already allows Azure services (`AllowAllWindowsAzureIps`).

## Registry credential hardening (TODO)

ghcr.io packages are **private by default**, so App Service pulls with credentials.
These were initially set to a personal GitHub token to get running. Before relying on
this long-term, switch to one of:

- a **dedicated PAT** with only `read:packages`, stored as the registry password, or
- making **just this package public** (the image holds app code + deps, no secrets —
  `.env` is excluded — but evaluate whether the code should be public), or
- an Azure **managed identity** with an ACR mirror if you later move off ghcr.
