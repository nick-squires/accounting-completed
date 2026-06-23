import { Hono } from "hono";
import { clientsResponseSchema, type SessionUser } from "@accounting-completed/contracts";
import type { ClientRow } from "@accounting-completed/db";
import { requireStaff } from "../middleware/request-context";

export interface ClientsDeps {
  list(firmClientId: number): Promise<ClientRow[]>;
}

export function createClientsRoutes(deps: ClientsDeps) {
  return new Hono<{ Variables: { user: SessionUser | null } }>().get(
    "/",
    requireStaff,
    async (c) => {
      const firm = c.get("user")!.firmClientId ?? 0;
      const rows = await deps.list(firm);
      return c.json(
        clientsResponseSchema.parse(
          rows.map((r) => ({
            id: String(r.UserId),
            name: r.Company_Name?.trim() || r.Full_Name,
          })),
        ),
      );
    },
  );
}
