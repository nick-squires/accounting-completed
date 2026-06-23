import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { useLogin, useMe } from "./use-auth";
import { getToken, setToken } from "./client";
import { TEST_USER, TEST_TOKEN } from "./mocks/handlers";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

describe("useLogin + useMe", () => {
  beforeEach(() => {
    setToken(null);
  });

  it("login success stores token and populates me query", async () => {
    const { qc, wrapper } = makeWrapper();

    // Render both hooks sharing the same QueryClient via wrapper
    const { result: loginResult } = renderHook(() => useLogin(), { wrapper });

    // Perform login
    await act(async () => {
      await loginResult.current.mutateAsync({
        username: "testuser",
        password: "password123",
      });
    });

    // Token should be stored
    expect(getToken()).toBe(TEST_TOKEN);

    // me query data should be populated via setQueryData called in onSuccess
    expect(qc.getQueryData(["me"])).toEqual(TEST_USER);

    // Also verify useMe hook reads from the same cache
    const { result: meResult } = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(meResult.current.isLoading).toBe(false));
    expect(meResult.current.data).toEqual(TEST_USER);
  });

  it("login failure throws an error", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          username: "baduser",
          password: "wrongpassword",
        });
      }),
    ).rejects.toThrow("Invalid credentials");
  });
});
