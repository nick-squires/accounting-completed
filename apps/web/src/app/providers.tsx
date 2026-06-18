import { useState, type ReactNode } from "react";
import { CLIENTS, type Role } from "@accounting-completed/domain";
import { RoleContext } from "./role-context";
import { ClientContext } from "./client-context";

export function AppProviders({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("staff");
  const [clientId, setClientId] = useState(CLIENTS[0].id);
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <ClientContext.Provider value={{ clientId, setClientId }}>{children}</ClientContext.Provider>
    </RoleContext.Provider>
  );
}
