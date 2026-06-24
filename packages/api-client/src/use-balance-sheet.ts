import { useQuery } from "@tanstack/react-query";
import { balanceSheetSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useBalanceSheet(params: { clientId: number | null; year: number | null }) {
  const { clientId, year } = params;
  return useQuery({
    queryKey: ["balance-sheet", clientId, year],
    enabled: clientId != null && year != null,
    queryFn: async () => {
      const r = await apiClient.api["balance-sheet"].$get({
        query: { clientId: String(clientId), year: String(year) },
      });
      if (!r.ok) throw new Error("Failed to load balance sheet");
      return balanceSheetSchema.parse(await r.json());
    },
  });
}
