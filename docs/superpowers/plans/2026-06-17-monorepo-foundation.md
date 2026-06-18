# Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the CDN-based prototype into a working Nx + pnpm monorepo with a typed React Router SPA, the ported design system (theme + shadcn/ui), the role-aware app shell, and the first two pages (Login, Dashboard) rebuilt to prove the pattern.

**Architecture:** Nx integrated monorepo. One Vite + React + TypeScript app (`apps/web`) consuming four shared packages (`@accounting-completed/{theme,ui,domain,utils}`). Tailwind v4 (CSS-first, no JS config) supplies styling; shadcn/ui (Radix) supplies primitives, themed by the ported token set. Pages become React Router routes under a shared layout.

**Tech Stack:** Nx, pnpm, TypeScript (strict), React 18, React Router, Vite, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui + Radix, clsx + tailwind-merge, lucide-react (optional, for icons), Vitest + React Testing Library, Playwright.

## Global Constraints

- **Package scope:** all internal packages are named `@accounting-completed/<name>`.
- **Node:** ≥ 20. **pnpm:** ≥ 9 (workspace via `pnpm-workspace.yaml`).
- **Tailwind:** v4 only — CSS-first config (`@theme`/`@import "tailwindcss"`), no `tailwind.config.js`.
- **TypeScript:** `strict: true`; no `any` in committed code unless justified inline.
- **Module boundaries:** `ui`/`theme`/`domain`/`utils` MUST NOT import from `apps/web`. `ui` may import `utils` + `theme`; it MUST NOT import `domain`.
- **Brand copy:** product is mid-rebrand. Sidebar/login brand text reads **"Accounting Completed"**, firm name **"Records in Order"**, primary user **"Scott Turner"** — port verbatim from existing source; do not invent new copy.
- **Port fidelity:** keep the *spirit* of each page, not pixel-fidelity. Canonical shadcn structure is preferred over reproducing old markup.
- **Legacy files:** delete each old root-level `.html`/`.jsx` (and obsolete `styles/`, `tw-config.js`) as the corresponding work lands. Never leave a dead duplicate.
- **Design tokens (verbatim, HSL triplets):** copied from `styles/theme.css` — see Task 4 for the full list. These values are the single source of truth.

---

## File Structure

```
accounting-completed/
├── nx.json                              Nx plugins + target defaults
├── package.json                         root: devtools + scripts only
├── pnpm-workspace.yaml                  apps/*, packages/*
├── tsconfig.base.json                   path aliases for @accounting-completed/*
├── eslint.config.mjs                    flat config + nx boundaries
├── .prettierrc
├── vitest.workspace.ts                  aggregates project vitest configs
├── apps/
│   └── web/
│       ├── index.html
│       ├── vite.config.ts               @vitejs/plugin-react + @tailwindcss/vite
│       ├── project.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── main.tsx                 createRoot + RouterProvider
│       │   ├── styles.css               @import "tailwindcss" + theme + @source
│       │   ├── router.tsx               route table
│       │   ├── app/
│       │   │   ├── providers.tsx        RoleProvider + ClientProvider
│       │   │   ├── role-context.ts
│       │   │   └── client-context.ts
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx        Sidebar + Topbar + <Outlet/>
│       │   │   ├── Sidebar.tsx
│       │   │   └── Topbar.tsx
│       │   └── routes/
│       │       ├── login/LoginPage.tsx
│       │       ├── dashboard/DashboardPage.tsx
│       │       └── _stub/StubPage.tsx   placeholder for not-yet-ported routes
│       └── e2e/ (or apps/web-e2e/)      Playwright smoke
└── packages/
    ├── theme/
    │   ├── package.json                 name @accounting-completed/theme
    │   └── src/theme.css                @theme + :root tokens + base
    ├── utils/
    │   ├── package.json
    │   └── src/{index.ts,cn.ts,format.ts}
    ├── ui/
    │   ├── package.json
    │   ├── components.json               shadcn config (aliased into this pkg)
    │   └── src/
    │       ├── index.ts
    │       ├── lib/utils.ts              re-exports cn from @accounting-completed/utils
    │       └── components/ui/*.tsx       button, card, input, tabs, badge,
    │                                     separator, avatar, dialog, popover,
    │                                     command, kbd, sparkline
    └── domain/
        ├── package.json
        └── src/
            ├── index.ts
            ├── types.ts                  Role, NavItem, NavGroup, Client, …
            ├── nav.ts                    NAV, GROUPS, ROLES, navForRole()
            └── data/{clients.ts,profit-loss.ts}
```

---

### Task 1: Initialize Nx + pnpm workspace skeleton

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `nx.json`, `tsconfig.base.json`, `.prettierrc`, `eslint.config.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Produces: a working `pnpm exec nx` CLI; path-alias base at `tsconfig.base.json` with `compilerOptions.paths` (extended per package in later tasks).

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: Create root `package.json`**

Versions below are floors; if a newer stable exists, take it and note the bump in the commit.

```json
{
  "name": "accounting-completed",
  "private": true,
  "engines": { "node": ">=20", "pnpm": ">=9" },
  "scripts": {
    "dev": "nx run web:dev",
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "lint": "nx run-many -t lint"
  },
  "devDependencies": {
    "@nx/eslint": "^21.0.0",
    "@nx/eslint-plugin": "^21.0.0",
    "@nx/react": "^21.0.0",
    "@nx/vite": "^21.0.0",
    "@nx/web": "^21.0.0",
    "@nx/workspace": "^21.0.0",
    "nx": "^21.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 3: Create `nx.json`**

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)"],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": { "cache": true, "dependsOn": ["^build"] },
    "lint": { "cache": true },
    "test": { "cache": true }
  }
}
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@accounting-completed/theme/*": ["packages/theme/src/*"],
      "@accounting-completed/utils": ["packages/utils/src/index.ts"],
      "@accounting-completed/ui": ["packages/ui/src/index.ts"],
      "@accounting-completed/domain": ["packages/domain/src/index.ts"]
    }
  }
}
```

- [ ] **Step 5: Create `.prettierrc`**

```json
{ "singleQuote": false, "semi": true, "printWidth": 100 }
```

- [ ] **Step 6: Create minimal `eslint.config.mjs`**

```js
import nx from "@nx/eslint-plugin";

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/react"],
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          allow: [],
          depConstraints: [
            { sourceTag: "*", onlyDependOnLibsWithTags: ["*"] }
          ]
        }
      ]
    }
  }
];
```

- [ ] **Step 7: Append to `.gitignore`**

```
node_modules
dist
.nx/cache
.nx/workspace-data
*.tsbuildinfo
test-output
playwright-report
```

- [ ] **Step 8: Install and verify**

Run: `pnpm install`
Then: `pnpm exec nx report`
Expected: prints Nx version and the installed `@nx/*` plugin versions with no error.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-workspace.yaml nx.json tsconfig.base.json .prettierrc eslint.config.mjs .gitignore pnpm-lock.yaml
git commit -m "chore: initialize nx + pnpm workspace skeleton"
```

---

### Task 2: Generate the web application (Vite + React + TS)

**Files:**
- Create (via generator): `apps/web/**` (`index.html`, `src/main.tsx`, `vite.config.ts`, `project.json`, `tsconfig*.json`)

**Interfaces:**
- Produces: an `nx run web:dev` target and `nx run web:build` target; mount point `<div id="root">` in `apps/web/index.html`.

- [ ] **Step 1: Generate the app**

Run:
```bash
pnpm exec nx g @nx/react:application web \
  --directory=apps/web \
  --bundler=vite \
  --unitTestRunner=vitest \
  --e2eTestRunner=playwright \
  --style=css \
  --routing=false \
  --no-interactive
```
Expected: files created under `apps/web` and `apps/web-e2e` (or `apps/web/e2e`); command exits 0.

- [ ] **Step 2: Verify dev server boots**

Run: `pnpm exec nx run web:dev` (start, then stop after confirming)
Expected: Vite prints a `Local: http://localhost:4200/` URL and compiles with no errors.

- [ ] **Step 3: Verify production build**

Run: `pnpm exec nx run web:build`
Expected: build completes; `apps/web/dist` (or `dist/apps/web`) is produced.

- [ ] **Step 4: Commit**

```bash
git add apps/ tsconfig.base.json nx.json
git commit -m "feat: scaffold web app (vite + react + ts)"
```

---

### Task 3: Wire Tailwind v4 into the app

**Files:**
- Modify: `apps/web/vite.config.ts` (add `@tailwindcss/vite`)
- Create: `apps/web/src/styles.css`
- Modify: `apps/web/src/main.tsx` (import `./styles.css`)

**Interfaces:**
- Produces: Tailwind utilities available app-wide; `apps/web/src/styles.css` is the global stylesheet that later imports the theme package.

- [ ] **Step 1: Install Tailwind v4**

Run: `pnpm add -D -w tailwindcss @tailwindcss/vite`
Expected: both added to root devDependencies.

- [ ] **Step 2: Add the plugin to `apps/web/vite.config.ts`**

Add the import and plugin (keep existing `@vitejs/plugin-react` and nx plugins):

```ts
import tailwindcss from "@tailwindcss/vite";
// inside defineConfig({ plugins: [ ... ] }) add tailwindcss() to the array:
//   plugins: [react(), nxViteTsPaths(), tailwindcss()],
```

- [ ] **Step 3: Create `apps/web/src/styles.css`**

```css
@import "tailwindcss";

/* Verify Tailwind is wired before the theme package exists. */
body { background: #f4f6f8; }
```

- [ ] **Step 4: Ensure `apps/web/src/main.tsx` imports it**

Add at top (if generator didn't): `import "./styles.css";`

- [ ] **Step 5: Verify**

Edit `apps/web/src/app/app.tsx` (or generated root component) to render `<h1 className="text-3xl font-bold underline">Tailwind works</h1>`.
Run: `pnpm exec nx run web:dev`
Expected: the heading is large, bold, underlined — Tailwind utilities apply.

- [ ] **Step 6: Commit**

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "feat: wire tailwind v4 into web app"
```

---

### Task 4: `@accounting-completed/theme` — port the design tokens

**Files:**
- Create: `packages/theme/package.json`, `packages/theme/src/theme.css`
- Modify: `apps/web/src/styles.css` (import theme), `tsconfig.base.json` already has the alias

**Interfaces:**
- Produces: CSS custom properties for every token + Tailwind v4 `@theme` mappings so utilities like `bg-card`, `text-text-soft`, `bg-positive-soft`, `shadow-elev-xs`, `font-mono` resolve. Consumed via `@import "@accounting-completed/theme/theme.css"`.

- [ ] **Step 1: Create `packages/theme/package.json`**

```json
{
  "name": "@accounting-completed/theme",
  "version": "0.0.1",
  "private": true,
  "exports": { "./theme.css": "./src/theme.css" }
}
```

- [ ] **Step 2: Create `packages/theme/src/theme.css`**

Port of `styles/theme.css` + the color/shadow/font/animation maps from `tw-config.js` into Tailwind v4 form. Token HSL triplets are copied verbatim from the original.

```css
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap");

:root {
  --background: 214 20% 97%;
  --foreground: 217 43% 10%;
  --card: 0 0% 100%;
  --card-foreground: 217 43% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 217 43% 10%;
  --primary: 202 85% 30%;
  --primary-foreground: 0 0% 100%;
  --secondary: 213 18% 95%;
  --secondary-foreground: 217 43% 10%;
  --muted: 216 17% 98%;
  --muted-foreground: 215 15% 42%;
  --accent: 207 67% 93%;
  --accent-foreground: 202 85% 30%;
  --destructive: 9 69% 42%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 15% 91%;
  --input: 220 15% 91%;
  --ring: 202 85% 30%;
  --positive: 151 76% 27%;
  --positive-soft: 148 50% 92%;
  --warning: 35 93% 36%;
  --warning-soft: 40 90% 92%;
  --info: 216 74% 43%;
  --info-soft: 216 70% 94%;
  --sidebar: 0 0% 100%;
  --sidebar-foreground: 217 43% 10%;
  --sidebar-border: 220 15% 91%;
  --text-soft: 215 12% 59%;
  --border-strong: 217 13% 84%;
  --radius: 0.5rem;
}

@theme inline {
  --font-sans: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-border-strong: hsl(var(--border-strong));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-positive: hsl(var(--positive));
  --color-positive-soft: hsl(var(--positive-soft));
  --color-warning: hsl(var(--warning));
  --color-warning-soft: hsl(var(--warning-soft));
  --color-info: hsl(var(--info));
  --color-info-soft: hsl(var(--info-soft));
  --color-sidebar: hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-text-soft: hsl(var(--text-soft));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  --shadow-elev-xs: 0 1px 0 rgba(15, 23, 36, 0.04);
  --shadow-elev-sm: 0 1px 2px rgba(15, 23, 36, 0.06), 0 1px 1px rgba(15, 23, 36, 0.04);
  --shadow-elev-md: 0 2px 6px rgba(15, 23, 36, 0.06), 0 4px 12px rgba(15, 23, 36, 0.06);
  --shadow-elev-lg: 0 8px 24px rgba(15, 23, 36, 0.10), 0 2px 8px rgba(15, 23, 36, 0.06);
  --shadow-elev-pop: 0 10px 28px rgba(15, 23, 36, 0.18), 0 2px 6px rgba(15, 23, 36, 0.08);

  --animate-fade-in: fade-in 120ms ease-out;
  --animate-scale-in: scale-in 140ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

*, *::before, *::after { border-color: hsl(var(--border)); }

html, body {
  margin: 0;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  font-size: 13.5px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "ss01", "cv11";
}

::selection { background: hsl(var(--accent)); color: hsl(var(--primary)); }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: hsl(var(--border-strong));
  border-radius: 999px;
  border: 2px solid hsl(var(--background));
}
::-webkit-scrollbar-thumb:hover { background: hsl(var(--text-soft)); }

.font-mono, .mono { font-feature-settings: "zero", "tnum"; }
.tnum { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: Update `apps/web/src/styles.css`**

```css
@import "tailwindcss";
@import "@accounting-completed/theme/theme.css";

/* Tailwind v4 must scan the ui package's class usage too (added in Task 6). */
@source "../../../packages/ui/src";
```
Remove the temporary `body { background: #f4f6f8; }` rule.

- [ ] **Step 4: Verify token utilities resolve**

Temporarily set the root component to `<div className="bg-card text-text-soft shadow-elev-md font-mono p-6">tokens</div>`.
Run: `pnpm exec nx run web:dev`
Expected: white card surface, muted text color, visible elevation shadow, IBM Plex Mono font.

- [ ] **Step 5: Commit**

```bash
git add packages/theme apps/web/src/styles.css
git commit -m "feat: add theme package with ported design tokens"
```

---

### Task 5: `@accounting-completed/utils` — cn + formatters (TDD)

**Files:**
- Create: `packages/utils/package.json`, `packages/utils/src/cn.ts`, `packages/utils/src/format.ts`, `packages/utils/src/index.ts`, `packages/utils/vite.config.ts`, `packages/utils/src/format.spec.ts`, `packages/utils/src/cn.spec.ts`
- Modify: `vitest.workspace.ts` (create if absent)

**Interfaces:**
- Produces:
  - `cn(...inputs: ClassValue[]): string` — clsx + tailwind-merge.
  - `fmt(n: number): string` — `0 → "—"`; negatives wrapped in parens; thousands separators; no decimals.
  - `fmtPct(n: number | null): string` — `null`/`NaN → "—"`; else `(n*100).toFixed(1) + "%"`.

- [ ] **Step 1: Create `packages/utils/package.json`**

```json
{
  "name": "@accounting-completed/utils",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "dependencies": { "clsx": "^2.1.0", "tailwind-merge": "^2.5.0" }
}
```
Run: `pnpm add -w clsx tailwind-merge` then `pnpm add -Dw vitest @testing-library/react jsdom`

- [ ] **Step 2: Write the failing tests**

`packages/utils/src/format.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { fmt, fmtPct } from "./format";

describe("fmt", () => {
  it("renders zero as an em dash", () => expect(fmt(0)).toBe("—"));
  it("adds thousands separators", () => expect(fmt(12345)).toBe("12,345"));
  it("wraps negatives in parentheses", () => expect(fmt(-2048)).toBe("(2,048)"));
  it("drops fractional digits", () => expect(fmt(99.7)).toBe("100"));
});

describe("fmtPct", () => {
  it("renders null as an em dash", () => expect(fmtPct(null)).toBe("—"));
  it("renders NaN as an em dash", () => expect(fmtPct(NaN)).toBe("—"));
  it("formats a ratio to one decimal percent", () => expect(fmtPct(0.1234)).toBe("12.3%"));
});
```

`packages/utils/src/cn.spec.ts`:
```ts
import { expect, it } from "vitest";
import { cn } from "./cn";

it("merges conflicting tailwind classes, last wins", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});
it("drops falsy values", () => {
  expect(cn("a", false, null, undefined, "b")).toBe("a b");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm exec nx run utils:test` (or `pnpm exec vitest run packages/utils`)
Expected: FAIL — modules `./format` and `./cn` not found.

- [ ] **Step 4: Implement**

`packages/utils/src/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

`packages/utils/src/format.ts`:
```ts
export function fmt(n: number): string {
  if (n === 0) return "—";
  const s = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

export function fmtPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}
```

`packages/utils/src/index.ts`:
```ts
export { cn } from "./cn";
export { fmt, fmtPct } from "./format";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec nx run utils:test`
Expected: PASS — all 8 assertions green.

- [ ] **Step 6: Commit**

```bash
git add packages/utils vitest.workspace.ts package.json pnpm-lock.yaml
git commit -m "feat: add utils package (cn, fmt, fmtPct) with tests"
```

---

### Task 6: `@accounting-completed/ui` — shadcn/ui library + custom primitives

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/components.json`, `packages/ui/src/lib/utils.ts`, `packages/ui/src/index.ts`, `packages/ui/src/components/ui/*.tsx`
- Modify: `apps/web/src/styles.css` already has `@source` for this package (Task 4)

**Interfaces:**
- Produces (named exports from `@accounting-completed/ui`):
  - `Button` with `variant: "default" | "primary" | "secondary" | "ghost" | "outline" | "destructive" | "link"` and `size: "default" | "sm" | "lg" | "icon" | "icon-sm"`.
  - `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter`.
  - `Input, Badge` (`variant: "default"|"secondary"|"outline"|"positive"|"destructive"|"warning"|"info"|"accent"`), `Separator`, `Avatar`, `AvatarRound`.
  - `Tabs, TabsList, TabsTrigger, TabsContent` (Radix).
  - `Dialog*`, `Popover*`, `Command*` (Radix / cmdk).
  - Custom: `Kbd`, `Sparkline` (`{ values: number[]; color?: string; width?: number; height?: number; strokeWidth?: number }`).

- [ ] **Step 1: Generate the library**

Run:
```bash
pnpm exec nx g @nx/react:library ui \
  --directory=packages/ui \
  --bundler=none \
  --unitTestRunner=vitest \
  --component=false \
  --no-interactive
```
Expected: `packages/ui` created with `src/index.ts`. Set `package.json` name to `@accounting-completed/ui` if the generator used a different one.

- [ ] **Step 2: Create `packages/ui/src/lib/utils.ts`** (shadcn expects `@/lib/utils`; we delegate to the utils package)

```ts
export { cn } from "@accounting-completed/utils";
```

- [ ] **Step 3: Create `packages/ui/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../apps/web/src/styles.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@accounting-completed/ui/components",
    "ui": "@accounting-completed/ui/components/ui",
    "utils": "@accounting-completed/ui/lib/utils"
  }
}
```

- [ ] **Step 4: Add shadcn components**

From `packages/ui`, run:
```bash
pnpm dlx shadcn@latest add button card input badge tabs separator avatar dialog popover command
```
Expected: component files land in `packages/ui/src/components/ui/`; Radix + cmdk deps added. If the CLI cannot infer Tailwind v4 in a non-app package, generate into a throwaway temp app and copy the files in — the component source is identical.

- [ ] **Step 5: Extend `button.tsx` variants/sizes**

In `packages/ui/src/components/ui/button.tsx`, replace the `buttonVariants` cva map so it matches the prototype surface (verbatim class strings from `ui.jsx`):
```ts
const buttonVariants = cva(
  "inline-flex items-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground border border-border hover:bg-secondary hover:border-border-strong",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
        ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent",
        outline: "bg-transparent text-foreground border border-border hover:bg-secondary hover:border-border-strong",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive",
        link: "bg-transparent text-primary underline-offset-4 hover:underline border border-transparent p-0 h-auto",
      },
      size: {
        default: "h-8 px-3 text-[13.5px]",
        sm: "h-[26px] px-2 text-[12px]",
        lg: "h-9 px-4 text-[14px]",
        icon: "h-8 w-8 p-0 justify-center",
        "icon-sm": "h-[26px] w-[26px] p-0 justify-center",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

- [ ] **Step 6: Add custom `kbd.tsx` and `sparkline.tsx`** (ported from `ui.jsx`, typed)

`packages/ui/src/components/ui/kbd.tsx`:
```tsx
import { cn } from "../../lib/utils";

export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd className={cn("inline-flex items-center justify-center font-mono text-[10px] text-text-soft bg-card border border-border rounded px-[5px] py-[1px]", className)}>
      {children}
    </kbd>
  );
}
```

`packages/ui/src/components/ui/sparkline.tsx`:
```tsx
export interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export function Sparkline({ values, color = "hsl(var(--primary))", width = 72, height = 28, strokeWidth = 1.6 }: SparklineProps) {
  if (!values || values.length < 2) return null;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = pad + (i * (width - pad * 2)) / (values.length - 1);
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 7: Add `avatar` square/round + badge variants** — extend the generated `badge.tsx` cva with `positive/warning/info/accent` using the same class strings from `ui.jsx` BADGE_VARIANTS, and add `AvatarRound` alongside shadcn `Avatar` (square `Avatar` wrapper with the gradient from `ui.jsx`). Keep shadcn's Radix Avatar as the base; export both names.

- [ ] **Step 8: Barrel-export everything from `packages/ui/src/index.ts`**

```ts
export * from "./components/ui/button";
export * from "./components/ui/card";
export * from "./components/ui/input";
export * from "./components/ui/badge";
export * from "./components/ui/tabs";
export * from "./components/ui/separator";
export * from "./components/ui/avatar";
export * from "./components/ui/dialog";
export * from "./components/ui/popover";
export * from "./components/ui/command";
export * from "./components/ui/kbd";
export * from "./components/ui/sparkline";
```

- [ ] **Step 9: Add a render smoke test**

`packages/ui/src/components/ui/button.spec.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "./button";

it("renders the primary variant with its label", () => {
  render(<Button variant="primary">Share</Button>);
  expect(screen.getByRole("button", { name: "Share" })).toBeTruthy();
});
```

- [ ] **Step 10: Run the test**

Run: `pnpm exec nx run ui:test`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add packages/ui package.json pnpm-lock.yaml
git commit -m "feat: add ui package (shadcn/ui + custom primitives)"
```

---

### Task 7: `@accounting-completed/domain` — types, nav, mock data (TDD)

**Files:**
- Create: `packages/domain/package.json`, `packages/domain/src/types.ts`, `packages/domain/src/nav.ts`, `packages/domain/src/data/clients.ts`, `packages/domain/src/data/profit-loss.ts`, `packages/domain/src/index.ts`, `packages/domain/src/nav.spec.ts`

**Interfaces:**
- Produces:
  - Types: `Role = "staff" | "owner" | "employee"`; `NavGroupKey`; `NavItem { key; label; icon; group; to; roles: Role[]; count? }`; `NavGroup { key; label: string | null; roles: Role[] }`; `RoleInfo { label; user: { name; role; initials }; firm: string | null; canSwitchClient: boolean }`; `Client { id; name; initials; sub }`; `PLSection`, `PLData`.
  - Data: `NAV: NavItem[]`, `GROUPS: NavGroup[]`, `ROLES: Record<Role, RoleInfo>`, `CLIENTS: Client[]`, `PROFIT_LOSS: PLData`.
  - `navForRole(role: Role): { group: NavGroup; items: NavItem[] }[]` — groups visible to the role, each with its role-visible items, empty groups omitted (mirrors `chrome.jsx` Sidebar logic).

- [ ] **Step 1: Create `packages/domain/package.json`**

```json
{
  "name": "@accounting-completed/domain",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts"
}
```

- [ ] **Step 2: Write the failing test**

`packages/domain/src/nav.spec.ts`:
```ts
import { describe, expect, it } from "vitest";
import { navForRole } from "./nav";

describe("navForRole", () => {
  it("hides the Clients item and Admin group from owners", () => {
    const groups = navForRole("owner");
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).not.toContain("clients");
    expect(keys).not.toContain("health");
  });
  it("omits groups that have no visible items", () => {
    const groups = navForRole("employee");
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });
  it("gives staff the multi-client admin items", () => {
    const keys = navForRole("staff").flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toContain("clients");
    expect(keys).toContain("health");
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm exec nx run domain:test`
Expected: FAIL — `./nav` not found.

- [ ] **Step 4: Implement `types.ts`** — the interfaces listed under Interfaces above (no icons typed as JSX here; `icon` is a `string` key resolved to a lucide/`I` icon in the app layer to keep `domain` framework-light).

```ts
export type Role = "staff" | "owner" | "employee";
export type NavGroupKey = "top" | "reports" | "setup" | "account" | "admin";

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  group: NavGroupKey;
  to: string;
  roles: Role[];
  count?: number;
}
export interface NavGroup { key: NavGroupKey; label: string | null; roles: Role[]; }
export interface RoleInfo {
  label: string;
  user: { name: string; role: string; initials: string };
  firm: string | null;
  canSwitchClient: boolean;
}
export interface Client { id: string; name: string; initials: string; sub: string; }
export interface PLAccount { code: string; name: string; vals: number[]; }
export interface PLSection { id: "income" | "cogs" | "opex"; accounts: PLAccount[]; }
export interface PLData { currentMonth: number; sections: PLSection[]; }
```

- [ ] **Step 5: Implement `nav.ts`** — port `NAV`/`GROUPS`/`ROLES` from `chrome.jsx` with `to` routes from the spec's mapping table, plus `navForRole`.

```ts
import type { NavGroup, NavItem, Role, RoleInfo } from "./types";

export const ROLES: Record<Role, RoleInfo> = {
  staff: { label: "Firm staff", user: { name: "Scott Turner", role: "Senior bookkeeper", initials: "ST" }, firm: "Records in Order", canSwitchClient: true },
  owner: { label: "Business owner", user: { name: "Diego Marín", role: "Owner & founder", initials: "DM" }, firm: null, canSwitchClient: false },
  employee: { label: "Employee", user: { name: "Sam Park", role: "Bookkeeper", initials: "SP" }, firm: null, canSwitchClient: false },
};

export const NAV: NavItem[] = [
  { key: "dash", label: "Dashboard", icon: "dash", group: "top", to: "/dashboard", roles: ["staff", "owner", "employee"] },
  { key: "txns", label: "Transactions", icon: "txns", group: "top", to: "/transactions", roles: ["staff", "owner", "employee"], count: 42 },
  { key: "bank", label: "Bank feeds", icon: "bank", group: "top", to: "/bank-feeds", roles: ["staff", "owner"] },
  { key: "pl", label: "Profit & Loss", icon: "pl", group: "reports", to: "/reports/profit-loss", roles: ["staff", "owner", "employee"] },
  { key: "balance", label: "Balance Sheet", icon: "balance", group: "reports", to: "/reports/balance-sheet", roles: ["staff", "owner"] },
  { key: "ledger", label: "General Ledger", icon: "ledger", group: "reports", to: "/reports/general-ledger", roles: ["staff", "owner"] },
  { key: "journal", label: "General Journal", icon: "reports", group: "reports", to: "/reports/general-journal", roles: ["staff", "owner"] },
  { key: "approve", label: "Approve reports", icon: "approve", group: "reports", to: "/reports/approve", roles: ["staff", "owner"], count: 3 },
  { key: "coa", label: "Chart of accounts", icon: "accounts", group: "setup", to: "/setup/chart-of-accounts", roles: ["staff", "owner"] },
  { key: "cats", label: "Categories", icon: "cats", group: "setup", to: "/setup/categories", roles: ["staff", "owner"] },
  { key: "clients", label: "Clients", icon: "clients", group: "setup", to: "/setup/clients", roles: ["staff"], count: 28 },
  { key: "staff", label: "Staff & roles", icon: "staff", group: "setup", to: "/setup/staff", roles: ["staff", "owner"] },
  { key: "settings", label: "Settings", icon: "settings", group: "setup", to: "/settings", roles: ["staff", "owner"] },
  { key: "plans", label: "Plans & billing", icon: "card", group: "account", to: "/plans", roles: ["owner"] },
  { key: "health", label: "System health", icon: "health", group: "admin", to: "/system-health", roles: ["staff"] },
];

export const GROUPS: NavGroup[] = [
  { key: "top", label: null, roles: ["staff", "owner", "employee"] },
  { key: "reports", label: "Reports", roles: ["staff", "owner", "employee"] },
  { key: "setup", label: "Setup", roles: ["staff", "owner"] },
  { key: "account", label: "Account", roles: ["owner"] },
  { key: "admin", label: "Admin", roles: ["staff"] },
];

export function navForRole(role: Role): { group: NavGroup; items: NavItem[] }[] {
  return GROUPS.filter((g) => g.roles.includes(role))
    .map((group) => ({ group, items: NAV.filter((n) => n.group === group.key && n.roles.includes(role)) }))
    .filter((entry) => entry.items.length > 0);
}
```

- [ ] **Step 6: Implement data files** — `data/clients.ts` exporting `CLIENTS: Client[]` (port the `CLIENTS` const used by `picker.jsx`/`app.jsx`; if not present in a single file, derive from the client switcher data in `picker.jsx`). `data/profit-loss.ts` exporting `PROFIT_LOSS: PLData` (port the JSON from the `<script id="data-pl">` block in `Profit & Loss.html`). Copy values verbatim; do not fabricate numbers.

- [ ] **Step 7: Barrel `index.ts`**

```ts
export * from "./types";
export * from "./nav";
export { CLIENTS } from "./data/clients";
export { PROFIT_LOSS } from "./data/profit-loss";
```

- [ ] **Step 8: Run the test**

Run: `pnpm exec nx run domain:test`
Expected: PASS — all 3 assertions green.

- [ ] **Step 9: Commit**

```bash
git add packages/domain
git commit -m "feat: add domain package (types, nav, mock data)"
```

---

### Task 8: App shell — routing, role/client context, Sidebar + Topbar, stub routes

**Files:**
- Create: `apps/web/src/app/role-context.ts`, `client-context.ts`, `providers.tsx`; `apps/web/src/layout/{AppLayout,Sidebar,Topbar,icons}.tsx`; `apps/web/src/routes/_stub/StubPage.tsx`; `apps/web/src/router.tsx`
- Modify: `apps/web/src/main.tsx`
- Install: `react-router-dom`

**Interfaces:**
- Consumes: `navForRole`, `ROLES`, `CLIENTS`, types from `@accounting-completed/domain`; `Button`, `Avatar`, `AvatarRound`, `Kbd` from `@accounting-completed/ui`.
- Produces:
  - `useRole(): { role: Role; setRole: (r: Role) => void }` and `useClient(): { clientId: string; setClientId: (id: string) => void }`.
  - `AppLayout` — grid shell (240px sidebar + 56px topbar + scrolling `<Outlet/>`).
  - `router` — a `createBrowserRouter` table with `/login` (no shell), the layout route wrapping all in-app routes, every spec route mounted (real pages where built, `StubPage` otherwise), and `/` → redirect `/login`.
  - `ICONS: Record<string, ReactNode>` — the `I` icon set from `chrome.jsx`, keyed by the `icon` strings in `NAV`.

- [ ] **Step 1: Install router**

Run: `pnpm add -w react-router-dom`

- [ ] **Step 2: Role + client context**

`apps/web/src/app/role-context.ts`:
```ts
import { createContext, useContext } from "react";
import type { Role } from "@accounting-completed/domain";

export const RoleContext = createContext<{ role: Role; setRole: (r: Role) => void } | null>(null);
export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
```
`client-context.ts` mirrors this with `{ clientId: string; setClientId: (id: string) => void }` and a `ClientContext`.

- [ ] **Step 3: `providers.tsx`** — `AppProviders` holding `useState` for role (default `"staff"`) and clientId (default `CLIENTS[0].id`), supplying both contexts.

```tsx
import { useState, type ReactNode } from "react";
import { CLIENTS, type Role } from "@accounting-completed/domain";
import { RoleContext } from "./role-context";
import { ClientContext } from "./client-context";

export function AppProviders({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("staff");
  const [clientId, setClientId] = useState(CLIENTS[0].id);
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <ClientContext.Provider value={{ clientId, setClientId }}>{children}</ClientContext.Provider>
    </RoleContext.Provider>
  );
}
```

- [ ] **Step 4: `layout/icons.tsx`** — port the `I` object from `chrome.jsx` into `ICONS: Record<string, ReactNode>` (the `Icn` helper + every entry). Verbatim SVG paths.

- [ ] **Step 5: `layout/Sidebar.tsx`** — port `chrome.jsx` Sidebar to TS, driven by `useRole()` + `navForRole(role)`, rendering `<NavLink to={item.to}>` with active styling via the `isActive` render-prop (replaces `activeKey`). Brand block, client switcher button (calls an `onClientClick` prop), grouped nav with counts, footer user block from `ROLES[role].user`. Class strings copied from the original.

- [ ] **Step 6: `layout/Topbar.tsx`** — port the `Topbar`: breadcrumb from a `crumbs` prop, search input with `⌘K` `Kbd`, role chip ("Viewing as …") from `useRole()`.

- [ ] **Step 7: `layout/AppLayout.tsx`** — the grid shell, rendering `Sidebar` + `Topbar` + `<main><Outlet/></main>`. Crumbs come from route handles (`useMatches()`), defaulting to `[]`.

```tsx
import { Outlet, useMatches } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const matches = useMatches();
  const crumbs = (matches.at(-1)?.handle as { crumbs?: string[] } | undefined)?.crumbs ?? [];
  return (
    <div className="h-screen w-screen grid" style={{ gridTemplateColumns: "240px 1fr", gridTemplateRows: "56px 1fr" }}>
      <div className="row-span-2"><Sidebar /></div>
      <Topbar crumbs={crumbs} />
      <main className="overflow-auto p-6 md:p-8"><Outlet /></main>
    </div>
  );
}
```

- [ ] **Step 8: `routes/_stub/StubPage.tsx`** — reads the route's `handle.title` and renders a centered "<title> — coming soon" placeholder so every nav target resolves.

- [ ] **Step 9: `router.tsx`** — `createBrowserRouter` with `/login` (bare), `/` → `<Navigate to="/login" />`, and the `AppLayout` route whose children mount every route from the spec mapping. Use real page elements for `/login` (Task 9) and `/dashboard` (Task 10); `StubPage` with a `handle: { title, crumbs }` for the other 18. Example shape:

```tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { StubPage } from "./routes/_stub/StubPage";
import { LoginPage } from "./routes/login/LoginPage";
import { DashboardPage } from "./routes/dashboard/DashboardPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage />, handle: { title: "Dashboard", crumbs: ["Dashboard"] } },
      { path: "/transactions", element: <StubPage />, handle: { title: "Transactions", crumbs: ["Transactions"] } },
      { path: "/bank-feeds", element: <StubPage />, handle: { title: "Bank feeds", crumbs: ["Bank feeds"] } },
      { path: "/reports/profit-loss", element: <StubPage />, handle: { title: "Profit & Loss", crumbs: ["Reports", "Profit & Loss"] } },
      { path: "/reports/profit-loss/print", element: <StubPage />, handle: { title: "Profit & Loss (print)", crumbs: ["Reports", "Profit & Loss", "Print"] } },
      { path: "/reports/balance-sheet", element: <StubPage />, handle: { title: "Balance Sheet", crumbs: ["Reports", "Balance Sheet"] } },
      { path: "/reports/general-ledger", element: <StubPage />, handle: { title: "General Ledger", crumbs: ["Reports", "General Ledger"] } },
      { path: "/reports/general-journal", element: <StubPage />, handle: { title: "General Journal", crumbs: ["Reports", "General Journal"] } },
      { path: "/reports/approve", element: <StubPage />, handle: { title: "Approve reports", crumbs: ["Reports", "Approve"] } },
      { path: "/setup/chart-of-accounts", element: <StubPage />, handle: { title: "Chart of accounts", crumbs: ["Setup", "Chart of accounts"] } },
      { path: "/setup/categories", element: <StubPage />, handle: { title: "Categories", crumbs: ["Setup", "Categories"] } },
      { path: "/setup/clients", element: <StubPage />, handle: { title: "Clients", crumbs: ["Setup", "Clients"] } },
      { path: "/setup/clients/new", element: <StubPage />, handle: { title: "Add client", crumbs: ["Setup", "Clients", "Add"] } },
      { path: "/setup/staff", element: <StubPage />, handle: { title: "Staff & roles", crumbs: ["Setup", "Staff & roles"] } },
      { path: "/settings", element: <StubPage />, handle: { title: "Settings", crumbs: ["Settings"] } },
      { path: "/plans", element: <StubPage />, handle: { title: "Plans & billing", crumbs: ["Plans & billing"] } },
      { path: "/system-health", element: <StubPage />, handle: { title: "System health", crumbs: ["System health"] } },
      { path: "/clients/switch", element: <StubPage />, handle: { title: "Switch client", crumbs: ["Clients", "Switch"] } },
      { path: "/design-system", element: <StubPage />, handle: { title: "Design system", crumbs: ["Design system"] } },
    ],
  },
]);
```

- [ ] **Step 10: `main.tsx`** — render `<AppProviders><RouterProvider router={router} /></AppProviders>` into `#root`.

- [ ] **Step 11: Verify**

Run: `pnpm exec nx run web:dev`
Expected: `/` redirects to `/login`; visiting `/dashboard` shows the sidebar + topbar shell; every sidebar link navigates and renders a stub; the role chip reads "Viewing as Firm staff".

- [ ] **Step 12: Commit**

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "feat: app shell with routing, role/client context, sidebar/topbar"
```

---

### Task 9: Port the Login page

**Files:**
- Create: `apps/web/src/routes/login/LoginPage.tsx`
- Delete: `Login.html`, `index.html`
- Modify: `apps/web/src/router.tsx` already wires `/login` (Task 8)

**Interfaces:**
- Consumes: `Input`, `Button`, `Kbd` from `@accounting-completed/ui`; `useNavigate` from react-router.
- Produces: `LoginPage` default-rendered at `/login`; "Sign in" navigates to `/dashboard` via `useNavigate` (replacing the old `<a href="Dashboard.html">`).

- [ ] **Step 1: Build `LoginPage.tsx`** — port `Login.html`'s two-panel layout (brand panel + form panel) keeping its spirit: brand block ("Accounting Completed" / "Cloud Accounting"), pitch headline + feature pills + testimonial (verbatim copy, with the existing mojibake fixed to proper characters: `—`, `→`, `•`, `↵`), and the email/password form using `Input`. Local `useState` for email (default `"scott@recordsinorder.com"`), password, remember. The submit control is a `<Button variant="primary">` that calls `navigate("/dashboard")`.

- [ ] **Step 2: Verify**

Run: `pnpm exec nx run web:dev`, open `/login`.
Expected: two-panel login renders with themed colors/fonts; clicking "Sign in" routes to `/dashboard` (the shell).

- [ ] **Step 3: Delete the legacy files**

Run: `git rm "Login.html" "index.html"`

- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "feat: port login page; remove legacy login/index html"
```

---

### Task 10: Port the Dashboard page

**Files:**
- Create: `apps/web/src/routes/dashboard/DashboardPage.tsx`, plus `apps/web/src/components/{PageHeader,StatTile}.tsx` (ported from `page.jsx`)
- Delete: `Dashboard.html`, `dashboard.jsx`
- Modify: none (route wired in Task 8)

**Interfaces:**
- Consumes: `Card*`, `Badge`, `Sparkline`, `Button` from `@accounting-completed/ui`; `fmt`, `fmtPct` from `@accounting-completed/utils`; mock data from `@accounting-completed/domain` as needed.
- Produces: `DashboardPage` at `/dashboard`; reusable `PageHeader` (`{ title; sub?; actions? }`) and `StatTile` (`{ label; value; sub?; intent?; spark?; sparkColor? }`) typed components in `apps/web/src/components`.

- [ ] **Step 1: Port `PageHeader` + `StatTile`** from `page.jsx` to typed TSX in `apps/web/src/components` (verbatim classes; `intent` union `"warning"|"positive"|"accent"|"destructive"|undefined`).

- [ ] **Step 2: Build `DashboardPage.tsx`** — read `dashboard.jsx` and rebuild its sections (KPI/stat tiles, cards, any tables) keeping the spirit, using ported components + `fmt`/`fmtPct`. Where it referenced embedded JSON, source from `@accounting-completed/domain` (add typed data to the domain package if a needed dataset isn't there yet, copying values verbatim from `Dashboard.html`).

- [ ] **Step 3: Verify**

Run: `pnpm exec nx run web:dev`, open `/dashboard`.
Expected: dashboard renders inside the shell with themed stat tiles/cards; numbers match the prototype's data.

- [ ] **Step 4: Delete legacy files**

Run: `git rm "Dashboard.html" dashboard.jsx`

- [ ] **Step 5: Commit**

```bash
git add apps/web packages/domain
git commit -m "feat: port dashboard page; remove legacy dashboard html/jsx"
```

---

### Task 11: Playwright smoke test + foundation cleanup

**Files:**
- Create/Modify: `apps/web-e2e/src/smoke.spec.ts` (or generated e2e location)
- Delete: obsolete root assets no longer referenced — `tw-config.js`, `styles/theme.css` (now in the theme package). Leave un-ported `.html`/`.jsx` in place (they belong to follow-on plans).

**Interfaces:**
- Consumes: the running `web` dev/preview server.
- Produces: a CI-able smoke test asserting the two ported routes + shell render.

- [ ] **Step 1: Write the smoke spec**

```ts
import { test, expect } from "@playwright/test";

test("root redirects to login and login renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Welcome back.")).toBeVisible();
});

test("login navigates into the dashboard shell", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/Viewing as/i)).toBeVisible();
});
```

- [ ] **Step 2: Run e2e**

Run: `pnpm exec nx run web-e2e:e2e`
Expected: both tests PASS (Playwright starts the dev/preview server per the generated config).

- [ ] **Step 3: Remove dead root assets**

Run: `git rm tw-config.js styles/theme.css` (and `styles/` if now empty)
Verify no remaining file references them: search the repo for `tw-config` and `styles/theme.css` — expect zero hits outside docs.

- [ ] **Step 4: Full verification gate**

Run: `pnpm exec nx run-many -t lint test build` and `pnpm exec nx run web-e2e:e2e`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add apps package.json
git commit -m "test: add playwright smoke; remove dead root theme assets"
```

---

## Follow-on work (separate plans)

The remaining 19 pages are ported in follow-on plans using Tasks 9–10 as the template (build the typed route component → source data from `domain` → verify in the shell → `git rm` the legacy `.html`/`.jsx` → commit). Suggested grouping, each its own plan:

1. **Reports** — Profit & Loss (+ print), Balance Sheet, General Ledger, General Journal, Approve reports.
2. **Setup** — Chart of accounts, Categories, Clients, Add client, Staff & roles, Settings.
3. **Transactions & banking** — Manage transactions, Bank feeds.
4. **Account & admin** — Plans & billing, System health.
5. **Cross-cutting** — Client Picker (Radix Command dialog + `⌘K`), Design System gallery route, Tweaks dev-only overlay (accent/role/density).

## Self-Review notes

- **Spec coverage:** scaffold (T1–2), Tailwind v4 (T3), theme (T4), utils (T5), ui/shadcn (T6), domain types+nav+data (T7), routing + shell + role/client context + all 21 routes mounted (T8), Login (T9), Dashboard (T10), Vitest tests (T5–7,10), Playwright (T11), legacy deletion (T9–11). Remaining 19 page bodies are explicitly deferred to follow-on plans (intentional decomposition, not a gap).
- **Tweaks panel / Design System / Client Picker:** deferred to the cross-cutting follow-on plan; the shell exposes the hooks (role/client context) they need.
- **Known execution risks:** exact `@nx/*` and shadcn CLI flags can drift with versions — each generator step states its expected outcome so the executor can adapt flags. shadcn-in-a-lib with Tailwind v4 may need the temp-app copy fallback (T6 Step 4).
```
