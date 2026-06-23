// packages/server/src/income-statement/routes.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  incomeStatementRequestSchema,
  incomeStatementYearsRequestSchema,
  incomeStatementSchema,
  incomeStatementYearsSchema,
  type SessionUser,
} from "@accounting-completed/contracts";
import { HTTPException } from "hono/http-exception";
import { requireStaff } from "../middleware/request-context";
import { buildIncomeStatement } from "./service";
import type { PlTxnRow } from "./types";

export interface IncomeStatementDeps {
  clientInFirm(userId: number, firmClientId: number): Promise<boolean>;
  getTransactionsForYear(userId: number, year: number): Promise<PlTxnRow[]>;
  getAvailableYears(userId: number): Promise<number[]>;
}

// Verify the requested client belongs to the caller's firm before returning data.
// 404 (not 403) avoids confirming the client exists in another firm.
async function assertClientInFirm(deps: IncomeStatementDeps, clientId: number, firmClientId: number) {
  if (!(await deps.clientInFirm(clientId, firmClientId))) {
    throw new HTTPException(404, { message: "Client not found" });
  }
}

export function createIncomeStatementRoutes(deps: IncomeStatementDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>()
    .get("/", requireStaff, zValidator("query", incomeStatementRequestSchema), async (c) => {
      const { clientId, year } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      await assertClientInFirm(deps, clientId, firmClientId);
      const rows = await deps.getTransactionsForYear(clientId, year);
      const statement = buildIncomeStatement(rows, { clientId, year, generatedAt: new Date().toISOString() });
      return c.json(incomeStatementSchema.parse(statement));
    })
    .get("/years", requireStaff, zValidator("query", incomeStatementYearsRequestSchema), async (c) => {
      const { clientId } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      await assertClientInFirm(deps, clientId, firmClientId);
      const years = await deps.getAvailableYears(clientId);
      return c.json(incomeStatementYearsSchema.parse({ years }));
    });
}
