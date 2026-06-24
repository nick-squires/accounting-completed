import { useQuery } from "@tanstack/react-query";
import { accountsResponseSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useAccounts(params: { clientId: number | null }) {
  const { clientId } = params;
  return useQuery({
    queryKey: ["accounts", clientId],
    enabled: clientId != null,
    queryFn: async () => {
      const r = await apiClient.api.accounts.$get({ query: { clientId: String(clientId) } });
      if (!r.ok) throw new Error("Failed to load accounts");
      return accountsResponseSchema.parse(await r.json()).accounts;
    },
  });
}
