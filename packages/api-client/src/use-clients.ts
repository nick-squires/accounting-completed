import { useQuery } from "@tanstack/react-query";
import { clientsResponseSchema } from "@accounting-completed/contracts";
import { apiClient } from "./client";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const r = await apiClient.api.clients.$get();
      if (!r.ok) throw new Error("Failed to load clients");
      return clientsResponseSchema.parse(await r.json());
    },
  });
}
