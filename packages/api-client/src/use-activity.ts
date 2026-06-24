import { useQuery } from "@tanstack/react-query";
import { activityResponseSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useActivity(params?: { limit?: number; enabled?: boolean }) {
  const limit = params?.limit;
  return useQuery({
    queryKey: ["activity", limit ?? null],
    enabled: params?.enabled ?? true,
    queryFn: async () => {
      const r = await apiClient.api.activity.$get({ query: limit ? { limit: String(limit) } : {} });
      if (!r.ok) throw new Error("Failed to load activity");
      return activityResponseSchema.parse(await r.json()).items;
    },
  });
}
