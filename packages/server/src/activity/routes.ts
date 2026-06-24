import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { activityRequestSchema, activityResponseSchema, type SessionUser } from "@accounting-completed/contracts";
import type { ActivityRow } from "@accounting-completed/db";
import { requireStaff } from "../middleware/request-context";
import { toActivityItems } from "./service";

export interface ActivityDeps {
  recent(firmClientId: number, limit: number): Promise<ActivityRow[]>;
}

const DEFAULT_LIMIT = 12;

export function createActivityRoutes(deps: ActivityDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get(
    "/",
    requireStaff,
    zValidator("query", activityRequestSchema),
    async (c) => {
      const { limit } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      const rows = await deps.recent(firmClientId, limit ?? DEFAULT_LIMIT);
      return c.json(activityResponseSchema.parse({ items: toActivityItems(rows) }));
    },
  );
}
