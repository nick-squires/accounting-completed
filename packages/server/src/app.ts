import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as pinoLogger } from "./logger";
import { onError } from "./middleware/error";

export const app = new Hono();

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
app.use("*", cors({
  origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : null),
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use("*", async (c, next) => {
  const t = Date.now();
  await next();
  pinoLogger.info({ m: c.req.method, p: c.req.path, s: c.res.status, ms: Date.now() - t });
});
app.onError(onError);
app.get("/health", (c) => c.json({ status: "ok" }));

export type AppType = typeof app;
