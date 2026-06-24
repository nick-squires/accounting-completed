import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createClientsRoutes } from "./routes";
import type { SessionUser } from "@accounting-completed/contracts";
import type { ClientRow } from "@accounting-completed/db";

const fakeRow: ClientRow = {
  UserId: 2189,
  Company_Name: "Demo Co",
  Full_Name: "Last, First",
  Email_Address: "demo@co.test",
  City: "Austin",
  State: "TX",
  Created_Date: new Date("2020-01-15T00:00:00.000Z"),
  Is_Verified: true,
};
const fakeList = async () => [fakeRow];

function buildApp(user: SessionUser | null) {
  return new Hono()
    .use("*", async (c, next) => {
      c.set("user", user);
      await next();
    })
    .route("/api/clients", createClientsRoutes({ list: fakeList }));
}

const staffUser: SessionUser = {
  userId: 1,
  username: "s",
  firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};

const nonStaffUser: SessionUser = {
  userId: 2,
  username: "c",
  firmClientId: 69,
  roles: { isStaff: false, isCustomer: true, isEmployee: false, isAdmin: false },
};

describe("GET /api/clients", () => {
  it("returns 200 with mapped clients for a staff user", async () => {
    const app = buildApp(staffUser);
    const res = await app.request("/api/clients");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: "2189",
        name: "Demo Co",
        email: "demo@co.test",
        location: "Austin, TX",
        createdAt: "2020-01-15T00:00:00.000Z",
        status: "verified",
      },
    ]);
  });

  it("returns 403 for a non-staff user", async () => {
    const app = buildApp(nonStaffUser);
    const res = await app.request("/api/clients");
    expect(res.status).toBe(403);
  });

  it("returns 401 when no user is present", async () => {
    const app = buildApp(null);
    const res = await app.request("/api/clients");
    expect(res.status).toBe(401);
  });
});
