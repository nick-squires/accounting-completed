import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { app, env } from "@accounting-completed/server";

// Single App Service: this process also serves the built web SPA. WEB_ROOT defaults
// to ./public (relative to cwd), where the build copies the web bundle into the api
// artifact. Registered after the /api routes so they always win.
const webRoot = process.env.WEB_ROOT ?? "./public";
// Serve built assets (and index.html for "/"). Misses fall through to next().
app.use("*", serveStatic({ root: webRoot }));
// SPA fallback: client-side routes return the app shell; unmatched /api stays a 404.
const serveIndex = serveStatic({ path: `${webRoot}/index.html` });
app.get("*", (c, next) => (c.req.path.startsWith("/api/") ? next() : serveIndex(c, next)));

const port = Number(process.env.PORT ?? env.API_PORT); // Azure App Service injects PORT
serve({ fetch: app.fetch, port });
console.log(`api listening on ${port}`);
