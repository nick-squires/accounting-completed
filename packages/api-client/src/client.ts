import { hc } from "hono/client";
import type { AppType } from "@accounting-completed/server";

const TOKEN_KEY = "ac_token";

export function getToken(): string | null {
  return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(t: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "";

export const apiClient = hc<AppType>(BASE, {
  headers: () => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
});
