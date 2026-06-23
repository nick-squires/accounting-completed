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
