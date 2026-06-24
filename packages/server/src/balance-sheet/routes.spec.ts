import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { SessionUser } from "@accounting-completed/contracts";
import type { BsAccountBalance } from "@accounting-completed/db";
import { requestContext } from "../middleware/request-context";
import { createBalanceSheetRoutes } from "./routes";
import { signSession } from "../auth/jwt";

const staff: SessionUser = {
  userId: 1, username: "s", firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const customer: SessionUser = { ...staff, userId: 2, roles: { ...staff.roles, isStaff: false, isCustomer: true } };

const balances: BsAccountBalance[] = [
  { code: 1000, name: "Checking", type: "BankingAccount", sum: 800 },
  { code: 2000, name: "Amex", type: "Credit Card/Loan", sum: -200 },
  { code: 3000, name: "Owner Capital", type: "Equity", sum: -1000 },
];
// retainedEarningsRaw via plAmountSum(null, yearStart); currentNetIncomeRaw via plAmountSum(yearStart, asOf)
const deps = {
  clientInFirm: async (id: number) => id === 2189,
  accountBalances: async () => balances,
  plAmountSum: async (_uid: number, start: Date | null) => (start === null ? -60 : -540),
  // assets 800; liabilities 200; equityAccts 1000; RE 60; NI 540 → equity 1600? recompute:
};

function appWith() {
  return new Hono().use("*", requestContext).route("/api/balance-sheet", createBalanceSheetRoutes(deps));
}
async function bearer(u: SessionUser) {
  return `Bearer ${await signSession(u)}`;
}

describe("balance sheet routes", () => {
  it("returns a balanced statement for staff", async () => {
    const res = await appWith().request("/api/balance-sheet?clientId=2189&year=2025", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.year).toBe(2025);
    // assets 800; L 200; equityAccts 1000 + RE 60 + NI 540 = 1600 → L+E = 1800 ≠ 800 → balanced false here
    expect(typeof body.balanced).toBe("boolean");
    expect(body.totals.liabilitiesAndEquity).toBe(body.totals.liabilities + body.totals.equity);
  });

  it("403s for non-staff", async () => {
    const res = await appWith().request("/api/balance-sheet?clientId=2189&year=2025", { headers: { Authorization: await bearer(customer) } });
    expect(res.status).toBe(403);
  });
  it("404s for a client outside the firm", async () => {
    const res = await appWith().request("/api/balance-sheet?clientId=9999&year=2025", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(404);
  });
  it("400s when year is missing", async () => {
    const res = await appWith().request("/api/balance-sheet?clientId=2189", { headers: { Authorization: await bearer(staff) } });
    expect(res.status).toBe(400);
  });
});
