import { describe, expect, it } from "vitest";
import { loginRequestSchema, sessionUserSchema } from "./auth";

describe("auth contracts", () => {
  it("accepts valid login", () => expect(loginRequestSchema.parse({ username: "a", password: "b" }).username).toBe("a"));
  it("rejects empty username", () => expect(() => loginRequestSchema.parse({ username: "", password: "b" })).toThrow());
  it("validates a session user", () => {
    const u = sessionUserSchema.parse({ userId: 1, username: "a", firmClientId: 69, roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false } });
    expect(u.firmClientId).toBe(69);
  });
});
