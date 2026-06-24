import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import type { ActivityRow } from "@accounting-completed/db";
import { requestContext } from "../middleware/request-context";
import { createActivityRoutes } from "./routes";
import { signSession } from "../auth/jwt";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: ActivityRow[] = [
  { id: 5, when: new Date("2025-05-01T12:00:00.000Z"), actor: "Jane", updateType: "Update",
    oldPayee: "AMZN", newPayee: "Amazon", oldCategory: null, newCategory: null },
];

function appWith(captured: { firm?: number; limit?: number }) {
  const deps = {
    recent: async (firm: number, limit: number) => { captured.firm = firm; captured.limit = limit; return rows; },
  };
  return new Hono().use("*", requestContext).route("/api/activity", createActivityRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("activity routes", () => {
  it("returns firm-scoped items for staff with the default limit", async () => {
    const captured: { firm?: number; limit?: number } = {};
    const res = await appWith(captured).request("/api/activity", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    expect(captured.firm).toBe(69);
    expect(captured.limit).toBe(12);
    const body = await res.json();
    expect(body.items[0]).toMatchObject({ id: 5, action: "Renamed payee", detail: "AMZN → Amazon" });
  });
  it("honors an explicit limit", async () => {
    const captured: { firm?: number; limit?: number } = {};
    await appWith(captured).request("/api/activity?limit=5", { headers: { Authorization: await bearer(staff) } });
    expect(captured.limit).toBe(5);
  });
  it("403s for non-staff", async () => {
    const res = await appWith({}).request("/api/activity", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });
  it("401s without a token", async () => {
    const res = await appWith({}).request("/api/activity");
    expect(res.status).toBe(401);
  });
});
