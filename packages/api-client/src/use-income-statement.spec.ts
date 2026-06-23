import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createElement, type ReactNode } from "react";
import { useIncomeStatement, useIncomeStatementYears } from "./use-income-statement";

const months = Array(12).fill(0);
const statement = {
  meta: { clientId: 2189, year: 2025, generatedAt: "2026-06-23T00:00:00.000Z" },
  sections: [
    { key: "income", label: "Income", accounts: [], subtotal: { months, total: 0 } },
    { key: "cogs", label: "Cost of Goods Sold", accounts: [], subtotal: { months, total: 0 } },
    { key: "expense", label: "Expenses", accounts: [], subtotal: { months, total: 0 } },
  ],
  grossProfit: { months, total: 0 },
  netIncome: { months, total: 0 },
  kpis: { totalIncome: 0, grossProfit: 0, totalExpenses: 0, netIncome: 0 },
};

const server = setupServer(
  http.get("*/api/income-statement", () => HttpResponse.json(statement)),
  http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025, 2024] })),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useIncomeStatement", () => {
  it("fetches the statement when clientId and year are set", async () => {
    const { result } = renderHook(() => useIncomeStatement({ clientId: 2189, year: 2025 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.meta.year).toBe(2025);
  });

  it("is disabled until clientId and year are both set", () => {
    const { result } = renderHook(() => useIncomeStatement({ clientId: null, year: null }), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches available years", async () => {
    const { result } = renderHook(() => useIncomeStatementYears({ clientId: 2189 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([2025, 2024]);
  });
});
