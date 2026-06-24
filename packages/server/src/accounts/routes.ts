import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { accountsRequestSchema, accountsResponseSchema, type SessionUser } from "@accounting-completed/contracts";
import type { AccountRow } from "@accounting-completed/db";
import { HTTPException } from "hono/http-exception";
import { requireStaff } from "../middleware/request-context";

export interface AccountsDeps {
  clientInFirm(userId: number, firmClientId: number): Promise<boolean>;
  list(userId: number): Promise<AccountRow[]>;
}

export function createAccountsRoutes(deps: AccountsDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get(
    "/",
    requireStaff,
    zValidator("query", accountsRequestSchema),
    async (c) => {
      const { clientId } = c.req.valid("query");
      const firmClientId = c.get("user")!.firmClientId ?? 0;
      if (!(await deps.clientInFirm(clientId, firmClientId))) {
        throw new HTTPException(404, { message: "Client not found" });
      }
      const rows = await deps.list(clientId);
      return c.json(
        accountsResponseSchema.parse({
          accounts: rows.map((r) => ({
            code: r.Account_Code,
            name: r.Account_Name?.trim() || `Account ${r.Account_Code}`,
            type: r.Account_Type?.trim() || null,
            category: r.Account_Category?.trim() || null,
            balance: r.Balance,
            bankAccountType: r.Bank_Account_Type?.trim() || null,
            currency: r.Currency_Code?.trim() || null,
            status: r.Account_Status?.trim() || null,
          })),
        }),
      );
    },
  );
}
