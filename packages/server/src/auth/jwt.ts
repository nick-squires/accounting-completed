import { sign, verify } from "hono/jwt";
import { sessionUserSchema, type SessionUser } from "@accounting-completed/contracts";
import { env } from "../env";

const TTL_SECONDS = 60 * 60 * 8;
export async function signSession(user: SessionUser): Promise<string> {
  return sign({ ...user, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }, env.JWT_SECRET);
}
export async function readSession(token: string): Promise<SessionUser | null> {
  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    return sessionUserSchema.parse(payload);
  } catch { return null; }
}
