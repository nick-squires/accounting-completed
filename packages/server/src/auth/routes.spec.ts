import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { requestContext } from "../middleware/request-context";
import { createAuthRoutes } from "./routes";
import { hashLegacyPassword } from "./password";

const fakeUser = { UserId: 2189, UserName: "demo", Password: hashLegacyPassword("pw"), Client_Id: 69, RoleId: 1, Is_Staff: true, Is_Customer: false, Is_Employee: false, Is_Admin: false, Full_Name: "Demo", Company_Name: "Demo Co" };
const deps = { findByUsername: async (u: string) => (u === "demo" ? fakeUser : null) };
const app = new Hono().use("*", requestContext).route("/api/auth", createAuthRoutes(deps));

describe("auth routes", () => {
  it("rejects bad credentials with 401", async () => {
    const res = await app.request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "demo", password: "wrong" }) });
    expect(res.status).toBe(401);
  });
  it("logs in, returns a token, and /me accepts the Bearer token", async () => {
    const login = await app.request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "demo", password: "pw" }) });
    expect(login.status).toBe(200);
    const { token, user } = await login.json();
    expect(typeof token).toBe("string");
    expect(user.username).toBe("demo");
    expect(user.fullName).toBe("Demo");
    expect(user.companyName).toBe("Demo Co");
    const me = await app.request("/api/auth/me", { headers: { authorization: `Bearer ${token}` } });
    expect(me.status).toBe(200);
    const meBody = await me.json();
    expect(meBody.username).toBe("demo");
    expect(meBody.fullName).toBe("Demo");
    expect(meBody.companyName).toBe("Demo Co");
  });
  it("rejects /me without a token (401)", async () => {
    expect((await app.request("/api/auth/me")).status).toBe(401);
  });
});
