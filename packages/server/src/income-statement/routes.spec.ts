// packages/server/src/income-statement/routes.spec.ts
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import { requestContext } from "../middleware/request-context";
import { createIncomeStatementRoutes } from "./routes";
import { signSession } from "../auth/jwt";
import type { PlTxnRow } from "./types";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: PlTxnRow[] = [
  { accountCode: 4010, accountName: "Sales", accountCategory: null, accountType: "Income", postedMonth: 1, amount: -1000 },
];
const deps = {
  clientInFirm: async (id: number) => id === 2189, // 2189 is in firm 69; anything else is not
  getTransactionsForYear: async () => rows,
  getAvailableYears: async () => [2025, 2024],
};

function appWith() {
  const app = new Hono();
  app.use("*", requestContext);
  return app.route("/api/income-statement", createIncomeStatementRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("income statement routes", () => {
  it("returns a statement for staff", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=2189&year=2025", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.year).toBe(2025);
    expect(body.sections.find((s: { key: string }) => s.key === "income").accounts[0].total).toBe(1000);
  });

  it("returns available years for staff", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement/years?clientId=2189", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ years: [2025, 2024] });
  });

  it("400s on missing query params", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=2189", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(400);
  });

  it("403s for non-staff", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=2189&year=2025", {
      headers: { Authorization: await bearer(customer) },
    });
    expect(res.status).toBe(403);
  });

  it("404s when the client is not in the caller's firm (cross-firm guard)", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=9999&year=2025", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(404);
  });

  it("400s on a non-numeric year", async () => {
    const app = appWith();
    const res = await app.request("/api/income-statement?clientId=2189&year=abc", {
      headers: { Authorization: await bearer(staff) },
    });
    expect(res.status).toBe(400);
  });
});
