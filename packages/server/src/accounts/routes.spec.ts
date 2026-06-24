import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import type { AccountRow } from "@accounting-completed/db";
import { requestContext } from "../middleware/request-context";
import { createAccountsRoutes } from "./routes";
import { signSession } from "../auth/jwt";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const rows: AccountRow[] = [
  { Account_Code: 1000, Account_Name: "Checking", Account_Type: "Asset", Account_Category: "Bank",
    Balance: 1234.56, Bank_Account_Type: "checking", Currency_Code: "USD", Account_Status: "active" },
];
const deps = {
  clientInFirm: async (id: number) => id === 2189,
  list: async () => rows,
};

function appWith() {
  return new Hono().use("*", requestContext).route("/api/accounts", createAccountsRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("accounts routes", () => {
  it("returns accounts for staff", async () => {
    const res = await appWith().request("/api/accounts?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      accounts: [{ code: 1000, name: "Checking", type: "Asset", category: "Bank", balance: 1234.56, bankAccountType: "checking", currency: "USD", status: "active" }],
    });
  });
  it("403s for non-staff", async () => {
    const res = await appWith().request("/api/accounts?clientId=2189", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });
  it("404s for a client outside the firm", async () => {
    const res = await appWith().request("/api/accounts?clientId=9999", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(404);
  });
  it("400s when clientId is missing", async () => {
    const res = await appWith().request("/api/accounts", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(400);
  });
});
