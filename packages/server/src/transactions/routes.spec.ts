import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import { requestContext } from "../middleware/request-context";
import { createTransactionsRoutes } from "./routes";
import { signSession } from "../auth/jwt";
import type { RawTxnRow } from "./types";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: RawTxnRow[] = [
  { id: 10, postedDate: new Date("2025-02-01T00:00:00.000Z"), payee: "Acme", memo: null, amount: -25,
    categoryName: "Office Supplies", checkNumber: null, account: "Checking",
    isApprove: null, isArchived: false, isActive: true, source: "ledger" },
];

const deps = {
  clientInFirm: async (id: number) => id === 2189,
  listForYear: async () => rows,
  availableYears: async () => [2025, 2024],
};

function appWith() {
  return new Hono().use("*", requestContext).route("/api/transactions", createTransactionsRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("transactions routes", () => {
  it("returns transactions for staff", async () => {
    const res = await appWith().request("/api/transactions?clientId=2189&year=2025", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.year).toBe(2025);
    expect(body.transactions[0]).toMatchObject({ id: 10, status: "categorized", postedDate: "2025-02-01T00:00:00.000Z" });
  });

  it("returns available years for staff", async () => {
    const res = await appWith().request("/api/transactions/years?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ years: [2025, 2024] });
  });

  it("400s on a missing year", async () => {
    const res = await appWith().request("/api/transactions?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(400);
  });

  it("403s for non-staff", async () => {
    const res = await appWith().request("/api/transactions?clientId=2189&year=2025", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });

  it("404s when the client is not in the caller's firm", async () => {
    const res = await appWith().request("/api/transactions?clientId=9999&year=2025", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(404);
  });
});
