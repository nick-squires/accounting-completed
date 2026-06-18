# Monorepo Conversion — Design Spec

**Date:** 2026-06-17
**Repo:** `accounting-completed` (converted in-place)
**Status:** Approved for planning

## 1. Goal

Convert the existing no-build, CDN-based prototype into a typed, bundled **Nx + pnpm monorepo**. Every existing page is rebuilt on the proper stack (Node, TypeScript, React, Nx, pnpm, shadcn/ui, Tailwind v4). The rebuild keeps the **spirit** of each page — it does **not** need to be pixel-faithful.

## 2. Current state (what we're converting)

- **Multi-page prototype:** 21 standalone `.html` pages, each loading **React 18 UMD + ReactDOM + Babel-standalone** from CDN for in-browser JSX.
- **Styling:** Tailwind v3 Play CDN + `tw-config.js`, plus `styles/theme.css` (CSS variables).
- **Components:** hand-rolled shadcn-style primitives in `ui.jsx`, exported to `window` for Babel script sharing.
- **Shared chrome:** `chrome.jsx` (role-aware `Sidebar`/`Topbar`, `NAV`/`ROLES`/`GROUPS` data, icon set `I`), `page.jsx` (`PageShell`), `picker.jsx` (`ClientPicker`), `tweaks-panel.jsx` (live theme tweaker), `ds.jsx` (Design System showcase).
- **Navigation:** plain `<a href="X.html">` links.
- **Data:** mock data embedded as JSON in `<script id="data-…">` tags and module consts (e.g. `CLIENTS`).
- **No** `package.json`, bundler, or TypeScript.

## 3. Decisions (locked)

| Decision | Choice |
|---|---|
| Monorepo scope | **Frontend only**; structured so a Node API can be added later |
| App model | **Single SPA + React Router** (each page → a route) |
| Port depth | **Full 1:1 port** of all 21 pages — spirit, not pixels |
| Tailwind | **v4** (CSS-first `@theme`, `@tailwindcss/vite`, no `tailwind.config.js`) |
| Structure | **Approach A** — Nx integrated monorepo: one app + focused shared libs |
| Package scope | **`@accounting-completed/*`** |
| Legacy files | **Delete each old `.html`/`.jsx`** as its page is ported (no `legacy/` folder) |
| Components library | Real **shadcn/ui** (Radix) in a shared `ui` package; hand-rolled `ui.jsx` is the spec |
| Tweaks panel / Design System | **Port both** (Design System as a route; Tweaks as a dev-only overlay) |
| Testing | **Vitest + React Testing Library**; Playwright e2e scaffolded but minimal |

## 4. Target repository layout

```
accounting-completed/             (cloned repo — converted in place)
├── nx.json                       Nx config (plugins, target defaults, caching)
├── package.json                  root scripts + dev tooling only
├── pnpm-workspace.yaml           workspaces: apps/*, packages/*
├── tsconfig.base.json            path aliases (@accounting-completed/*)
├── eslint.config.mjs             flat config + Nx module-boundary rules
├── .prettierrc
├── apps/
│   └── web/                      Vite + React + React Router SPA
│       ├── index.html            single entry (replaces 21 HTML files)
│       ├── src/
│       │   ├── main.tsx          createRoot + RouterProvider
│       │   ├── router.tsx        route table
│       │   ├── routes/           one folder per page (login, dashboard, …)
│       │   └── app/              providers (role/client context)
│       └── vite.config.ts
└── packages/
    ├── ui/                       shadcn/ui components (Radix) + variants
    │   └── src/components/ui/    button, card, tabs, input, badge, avatar, …
    ├── theme/                    Tailwind v4 @theme + CSS variables + fonts
    ├── domain/                   typed mock data + domain types
    └── utils/                    cn(), fmt(), fmtPct(), shared helpers
```

## 5. Tooling

- **Nx** integrated monorepo: `@nx/react` + `@nx/vite` + `@nx/eslint`. Task caching + affected graph.
- **pnpm** workspaces; Node ≥ 20.
- **TypeScript** strict, project references, path aliases in `tsconfig.base.json`.
- **Vite** (current stable supported by `@nx/vite`) — dev server + build.
  - Note: the previously-deleted `web` experiment referenced `vite@8`, which is not a real published version; pin to current stable Vite.
- **Tailwind v4** via `@tailwindcss/vite` — theme in CSS, no JS config.
- **ESLint flat + Prettier**, with Nx `enforce-module-boundaries` (e.g. `ui` cannot import from `web`).

## 6. Design system: theme + shadcn/ui

The prototype defines **more tokens than stock shadcn**: `border-strong`, `text-soft`, `positive`/`warning`/`info` (each with a `-soft` variant), `sidebar` (+ `sidebar-border`), five `elev-*` shadows, IBM Plex Sans/Mono fonts, and fade/scale animations.

- **`@accounting-completed/theme`** owns one `theme.css` with a Tailwind v4 `@theme` block + `:root`/`.dark` CSS variables, ported faithfully from the existing `theme.css` + `tw-config.js`. Single source of truth imported by both `ui` and `web`.
- **`@accounting-completed/ui`** holds real shadcn/ui components generated via the shadcn CLI (`components.json` aliased into this package), rebuilt on Radix. The hand-rolled `ui.jsx` is the **spec** for which components to generate and how to extend them:
  - Extra Button variants `primary`/`link`; extra sizes `icon-sm`.
  - Custom additions kept alongside shadcn: `Kbd`, `Sparkline`, `Avatar`/`AvatarRound`.
  - shadcn's Radix `Tabs` replaces the current styled-button `Tabs`.
- Components to generate/build: Button, Input, Textarea, Card (+ sub-parts), Badge, Tabs, Avatar — plus custom `Kbd`, `Sparkline`.
- Tailwind v4 content scanning must include the `ui` package sources.

## 7. Shared chrome + routing

- **Layout route** (`AppLayout`) renders `Sidebar` + `Topbar` + `<Outlet/>`, replacing `PageShell`.
- **Role + client context** providers replace per-page `role`/`clientName` props, powering "Viewing as…" and the client switcher app-wide. Roles: `staff` / `owner` / `employee`.
- `NAV` / `ROLES` / `GROUPS` move to `@accounting-completed/domain` as typed data.
- `<a href="X.html">` → `<NavLink to="/…">`.
- **Tweaks panel** ports as a **dev-only** overlay.

## 8. Domain + utils

- **`@accounting-completed/domain`**: TypeScript types + mock data currently embedded as JSON `<script>` tags and consts (`CLIENTS`, P&L data, etc.). Pages import typed data instead of parsing DOM JSON. Types include `Client`, `Account`, `PLData`, `Role`, `NavItem`.
- **`@accounting-completed/utils`**: `cn()` upgraded to `clsx` + `tailwind-merge` (shadcn standard), `fmt()`, `fmtPct()`, shared helpers. Icon set `I` lives in `ui` (or `utils` if preferred during implementation).

## 9. Page → route mapping (all 21)

| Route | From | Route | From |
|---|---|---|---|
| `/` → redirect `/login` | index.html | `/reports/general-ledger` | General Ledger.html |
| `/login` | Login.html | `/reports/general-journal` | General Journal.html |
| `/dashboard` | Dashboard.html | `/reports/approve` | Approve Report.html |
| `/transactions` | Manage Transactions.html | `/setup/chart-of-accounts` | Chart of Accounts.html |
| `/bank-feeds` | Bank Feeds.html | `/setup/categories` | Categories.html |
| `/reports/profit-loss` | Profit & Loss.html | `/setup/clients` | Clients.html |
| `/reports/profit-loss/print` | Profit & Loss-print.html | `/setup/clients/new` | Add Client.html |
| `/reports/balance-sheet` | Balance Sheet.html | `/setup/staff` | Staff & Roles.html |
| `/clients/switch` | Client Picker.html | `/settings` | Settings.html |
| `/plans` | Plans.html | `/system-health` | System Health.html |
| `/design-system` | Design System.html | | |

## 10. Testing

- **Vitest + React Testing Library** for `utils`, `domain`, and key components, wired via `@nx/vite`.
- **Playwright** scaffolded with a minimal smoke test (routes render). Not over-invested for a prototype port.

## 11. Execution sequence (phased; each independently verifiable)

1. **Scaffold** — Nx workspace, pnpm, TS base, ESLint/Prettier; empty `web` app boots.
2. **Theme** — `@accounting-completed/theme` ported to Tailwind v4; a styled page renders.
3. **UI library** — `@accounting-completed/ui` via shadcn CLI + custom extensions; a component gallery route proves it.
4. **Chrome + routing** — layout route, role/client context, nav data; empty page shells at every route.
5. **Domain/utils** — types + mock data + helpers extracted.
6. **Port pages** — page by page (Login → Dashboard → reports → setup → rest); each old file deleted as its page lands.
7. **Polish** — Design System page, Tweaks panel, e2e smoke.

## 12. Out of scope

- No backend / Node API (structure leaves room for `apps/api` + shared `domain` later).
- No real data persistence — mock data only, as today.
- No pixel-faithful reproduction — spirit of each page is the bar.
