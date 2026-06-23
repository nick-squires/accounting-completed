import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { loginRequestSchema, type SessionUser } from "@accounting-completed/contracts";
import type { UserRow } from "@accounting-completed/db";
import { verifyPassword } from "./password";
import { signSession } from "./jwt";
import { requireAuth } from "../middleware/request-context";

export interface AuthDeps { findByUsername(username: string): Promise<UserRow | null>; }

const toSessionUser = (u: UserRow): SessionUser => ({
  userId: u.UserId, username: u.UserName ?? "", firmClientId: u.Client_Id ?? null,
  roles: { isStaff: !!u.Is_Staff, isCustomer: !!u.Is_Customer, isEmployee: !!u.Is_Employee, isAdmin: !!u.Is_Admin },
});

export function createAuthRoutes(deps: AuthDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>()
    .post("/login", zValidator("json", loginRequestSchema), async (c) => {
      const { username, password } = c.req.valid("json");
      const row = await deps.findByUsername(username);
      if (!row || !verifyPassword(password, row.Password)) throw new HTTPException(401, { message: "Invalid credentials" });
      const user = toSessionUser(row);
      const token = await signSession(user);
      return c.json({ token, user });
    })
    .post("/logout", (c) => c.json({ ok: true })) // stateless: client drops the token
    .get("/me", requireAuth, (c) => c.json(c.get("user")));
}
