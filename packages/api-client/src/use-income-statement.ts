import { useQuery } from "@tanstack/react-query";
import { incomeStatementSchema, incomeStatementYearsSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useIncomeStatement(params: { clientId: number | null; year: number | null }) {
  const { clientId, year } = params;
  return useQuery({
    queryKey: ["income-statement", clientId, year],
    enabled: clientId != null && year != null,
    queryFn: async () => {
      const r = await apiClient.api["income-statement"].$get({
        query: { clientId: String(clientId), year: String(year) },
      });
      if (!r.ok) throw new Error("Failed to load income statement");
      return incomeStatementSchema.parse(await r.json());
    },
  });
}

export function useIncomeStatementYears(params: { clientId: number | null }) {
  const { clientId } = params;
  return useQuery({
    queryKey: ["income-statement-years", clientId],
    enabled: clientId != null,
    queryFn: async () => {
      const r = await apiClient.api["income-statement"].years.$get({
        query: { clientId: String(clientId) },
      });
      if (!r.ok) throw new Error("Failed to load available years");
      return incomeStatementYearsSchema.parse(await r.json()).years;
    },
  });
}
