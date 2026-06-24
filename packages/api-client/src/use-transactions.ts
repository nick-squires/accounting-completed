import { useQuery } from "@tanstack/react-query";
import { transactionsResponseSchema, transactionsYearsSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useTransactions(params: { clientId: number | null; year: number | null }) {
  const { clientId, year } = params;
  return useQuery({
    queryKey: ["transactions", clientId, year],
    enabled: clientId != null && year != null,
    queryFn: async () => {
      const r = await apiClient.api.transactions.$get({
        query: { clientId: String(clientId), year: String(year) },
      });
      if (!r.ok) throw new Error("Failed to load transactions");
      return transactionsResponseSchema.parse(await r.json());
    },
  });
}

export function useTransactionsYears(params: { clientId: number | null }) {
  const { clientId } = params;
  return useQuery({
    queryKey: ["transactions-years", clientId],
    enabled: clientId != null,
    queryFn: async () => {
      const r = await apiClient.api.transactions.years.$get({
        query: { clientId: String(clientId) },
      });
      if (!r.ok) throw new Error("Failed to load available years");
      return transactionsYearsSchema.parse(await r.json()).years;
    },
  });
}
