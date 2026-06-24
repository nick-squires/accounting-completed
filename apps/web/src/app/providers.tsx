import { useState, type ReactNode } from "react";
import type { Role } from "@accounting-completed/domain";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleContext } from "./role-context";
import { ClientContext } from "./client-context";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("staff");
  const [clientId, setClientId] = useState<string | null>(null);
  return (
    <QueryClientProvider client={queryClient}>
      <RoleContext.Provider value={{ role, setRole }}>
        <ClientContext.Provider value={{ clientId, setClientId }}>{children}</ClientContext.Provider>
      </RoleContext.Provider>
    </QueryClientProvider>
  );
}
