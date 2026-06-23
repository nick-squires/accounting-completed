import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginRequest, SessionUser } from "@accounting-completed/contracts";
import { apiClient, setToken } from "./client";

export function useMe() {
  return useQuery<SessionUser | null>({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await apiClient.api.auth.me.$get();
      return r.ok ? ((await r.json()) as SessionUser) : null;
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const r = await apiClient.api.auth.login.$post({ json: body });
      if (!r.ok) throw new Error("Invalid credentials");
      const { token, user } = (await r.json()) as { token: string; user: SessionUser };
      setToken(token);
      return user;
    },
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.api.auth.logout.$post();
      setToken(null);
    },
    onSuccess: () => qc.setQueryData(["me"], null),
  });
}
