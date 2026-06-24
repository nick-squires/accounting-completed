import { Hono } from "hono";
import { clientsResponseSchema, type SessionUser } from "@accounting-completed/contracts";
import type { ClientRow } from "@accounting-completed/db";
import { requireStaff } from "../middleware/request-context";

export interface ClientsDeps {
  list(firmClientId: number): Promise<ClientRow[]>;
}

function formatLocation(city: string | null, state: string | null): string | null {
  const c = city?.trim();
  const s = state?.trim();
  if (c && s) return `${c}, ${s}`;
  return c || s || null;
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
            name: r.Company_Name?.trim() || r.Full_Name?.trim() || "Unnamed client",
            email: r.Email_Address?.trim() || null,
            location: formatLocation(r.City, r.State),
            createdAt: r.Created_Date ? r.Created_Date.toISOString() : null,
            status: r.Is_Verified ? "verified" : "unverified",
          })),
        ),
      );
    },
  );
}
