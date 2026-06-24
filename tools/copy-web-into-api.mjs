// Copies the built web SPA into the api artifact so a single App Service can serve
// both. Run after `nx build web` and `nx build api`. See apps/api/src/main.ts
// (WEB_ROOT defaults to ./public).
import { cpSync, existsSync, rmSync } from "node:fs";

const src = "dist/apps/web";
const dest = "dist/apps/api/public";

if (!existsSync(src)) {
  console.error(`[copy-web] missing ${src} — run \`nx build web\` first`);
  process.exit(1);
}
if (!existsSync("dist/apps/api")) {
  console.error("[copy-web] missing dist/apps/api — run `nx build api` first");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-web] copied ${src} -> ${dest}`);
