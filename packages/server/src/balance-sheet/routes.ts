import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { balanceSheetRequestSchema, balanceSheetSchema, type SessionUser } from "@accounting-completed/contracts";
import type { BsAccountBalance } from "@accounting-completed/db";
import { HTTPException } from "hono/http-exception";
import { requireStaff } from "../middleware/request-context";
import { buildBalanceSheet } from "./service";

export interface BalanceSheetDeps {
  clientInFirm(userId: number, firmClientId: number): Promise<boolean>;
  accountBalances(userId: number, asOf: Date): Promise<BsAccountBalance[]>;
  plAmountSum(userId: number, start: Date | null, endExclusive: Date): Promise<number>;
}

export function createBalanceSheetRoutes(deps: BalanceSheetDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get(
    "/",
    requireStaff,
    zValidator("query", balanceSheetRequestSchema),
    async (c) => {
      const { clientId, year } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      if (!(await deps.clientInFirm(clientId, firmClientId))) {
        throw new HTTPException(404, { message: "Client not found" });
      }
      const yearStart = new Date(Date.UTC(year, 0, 1));
      const asOf = new Date(Date.UTC(year + 1, 0, 1));
      const [balances, retainedEarningsRaw, currentNetIncomeRaw] = await Promise.all([
        deps.accountBalances(clientId, asOf),
        deps.plAmountSum(clientId, null, yearStart),
        deps.plAmountSum(clientId, yearStart, asOf),
      ]);
      const body = buildBalanceSheet({
        balances,
        retainedEarningsRaw,
        currentNetIncomeRaw,
        clientId,
        year,
        asOf: asOf.toISOString(),
        generatedAt: new Date().toISOString(),
      });
      return c.json(balanceSheetSchema.parse(body));
    },
  );
}
