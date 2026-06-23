import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { ClientContext } from "../../app/client-context";
import { ProfitLossPage } from "./ProfitLossPage";

const months = Array(12).fill(0);
const withData = {
  meta: { clientId: 2189, year: 2025, generatedAt: "2026-06-23T00:00:00.000Z" },
  sections: [
    { key: "income", label: "Income", accounts: [{ code: 4010, name: "Sales", category: null, months: [1000, ...Array(11).fill(0)], total: 1000 }], subtotal: { months: [1000, ...Array(11).fill(0)], total: 1000 } },
    { key: "cogs", label: "Cost of Goods Sold", accounts: [], subtotal: { months, total: 0 } },
    { key: "expense", label: "Expenses", accounts: [], subtotal: { months, total: 0 } },
  ],
  grossProfit: { months: [1000, ...Array(11).fill(0)], total: 1000 },
  netIncome: { months: [1000, ...Array(11).fill(0)], total: 1000 },
  kpis: { totalIncome: 1000, grossProfit: 1000, totalExpenses: 0, netIncome: 1000 },
};
const empty = { ...withData, sections: withData.sections.map((s) => ({ ...s, accounts: [], subtotal: { months, total: 0 } })) };

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ClientContext.Provider value={{ clientId: "2189", setClientId: () => {} }}>
        <ProfitLossPage />
      </ClientContext.Provider>
    </QueryClientProvider>,
  );
}

describe("ProfitLossPage", () => {
  it("renders KPIs and the table on success", async () => {
    server.use(
      http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025] })),
      http.get("*/api/income-statement", () => HttpResponse.json(withData)),
    );
    renderPage();
    await waitFor(() => expect(screen.getAllByText("Total Income").length).toBeGreaterThan(0));
    expect(screen.getByText("Sales")).toBeTruthy();
  });

  it("shows the empty state when there is no data", async () => {
    server.use(
      http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025] })),
      http.get("*/api/income-statement", () => HttpResponse.json(empty)),
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/No income statement data/i)).toBeTruthy(),
    );
  });

  it("shows an error state on failure", async () => {
    server.use(
      http.get("*/api/income-statement/years", () => HttpResponse.json({ years: [2025] })),
      http.get("*/api/income-statement", () => new HttpResponse(null, { status: 500 })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText(/Failed to load/i)).toBeTruthy());
  });
});
