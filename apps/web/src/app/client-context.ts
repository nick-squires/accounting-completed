import { createContext, useContext } from "react";

export const ClientContext = createContext<{ clientId: string; setClientId: (id: string) => void } | null>(null);
export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClient must be used within ClientProvider");
  return ctx;
}
