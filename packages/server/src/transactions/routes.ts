import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  transactionsRequestSchema,
  transactionsYearsRequestSchema,
  transactionsResponseSchema,
  transactionsYearsSchema,
  type SessionUser,
} from "@accounting-completed/contracts";
import { HTTPException } from "hono/http-exception";
import { requireStaff } from "../middleware/request-context";
import { toTransactionsResponse } from "./service";
import type { RawTxnRow } from "./types";

export interface TransactionsDeps {
  clientInFirm(userId: number, firmClientId: number): Promise<boolean>;
  listForYear(userId: number, year: number): Promise<RawTxnRow[]>;
  availableYears(userId: number): Promise<number[]>;
}

async function assertClientInFirm(deps: TransactionsDeps, clientId: number, firmClientId: number) {
  if (!(await deps.clientInFirm(clientId, firmClientId))) {
    throw new HTTPException(404, { message: "Client not found" });
  }
}

export function createTransactionsRoutes(deps: TransactionsDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>()
    .get("/", requireStaff, zValidator("query", transactionsRequestSchema), async (c) => {
      const { clientId, year } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      await assertClientInFirm(deps, clientId, firmClientId);
      const rows = await deps.listForYear(clientId, year);
      const body = toTransactionsResponse(rows, { clientId, year, generatedAt: new Date().toISOString() });
      return c.json(transactionsResponseSchema.parse(body));
    })
    .get("/years", requireStaff, zValidator("query", transactionsYearsRequestSchema), async (c) => {
      const { clientId } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      await assertClientInFirm(deps, clientId, firmClientId);
      const years = await deps.availableYears(clientId);
      return c.json(transactionsYearsSchema.parse({ years }));
    });
}
