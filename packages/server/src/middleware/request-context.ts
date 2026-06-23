import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { SessionUser } from "@accounting-completed/contracts";
import { readSession } from "../auth/jwt";

type Vars = { Variables: { user: SessionUser | null } };

export const requestContext = createMiddleware<Vars>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  c.set("user", token ? await readSession(token) : null);
  await next();
});

export const requireAuth = createMiddleware<Vars>(async (c, next) => {
  if (!c.get("user")) throw new HTTPException(401, { message: "Not authenticated" });
  await next();
});

export const requireStaff = createMiddleware<Vars>(async (c, next) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Not authenticated" });
  if (!user.roles.isStaff) throw new HTTPException(403, { message: "Staff only" });
  await next();
});
