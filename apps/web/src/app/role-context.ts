import { createContext, useContext } from "react";
import type { Role } from "@accounting-completed/domain";

export const RoleContext = createContext<{ role: Role; setRole: (r: Role) => void } | null>(null);
export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
