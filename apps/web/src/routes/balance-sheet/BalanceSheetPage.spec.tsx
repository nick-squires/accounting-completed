import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { ClientContext } from "../../app/client-context";
import { BalanceSheetPage } from "./BalanceSheetPage";

const balanceSheet = {
  meta: { clientId: 2243, year: 2025, asOf: "2026-01-01T00:00:00.000Z", generatedAt: "2026-06-01T00:00:00.000Z" },
  sections: [
    { key: "assets", label: "Assets", total: 1300, groups: [
      { type: "Current Assets", subtotal: 800, accounts: [{ code: 1000, name: "Checking", amount: 800 }] },
      { type: "Fixed Assets", subtotal: 500, accounts: [{ code: 1500, name: "Equipment", amount: 500 }] },
    ] },
    { key: "liabilities", label: "Liabilities", total: 200, groups: [
      { type: "Current Liabilities", subtotal: 200, accounts: [{ code: 2000, name: "Amex", amount: 200 }] },
    ] },
    { key: "equity", label: "Equity", total: 1100, groups: [
      { type: "Equity", subtotal: 1100, accounts: [
        { code: 3000, name: "Owner Capital", amount: 1000 },
        { code: -1, name: "Retained Earnings", amount: 60 },
        { code: -2, name: "Net Income", amount: 40 },
      ] },
    ] },
  ],
  totals: { assets: 1300, liabilities: 200, equity: 1100, liabilitiesAndEquity: 1300 },
  balanced: true,
};

const server = setupServer(
  http.get("*/api/transactions/years", () => HttpResponse.json({ years: [2025, 2024] })),
  http.get("*/api/balance-sheet", () => HttpResponse.json(balanceSheet)),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(clientId: string | null = "2243") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ClientContext.Provider value={{ clientId, setClientId: () => undefined }}>
        <BalanceSheetPage />
      </ClientContext.Provider>
    </QueryClientProvider>,
  );
}

describe("BalanceSheetPage", () => {
  it("renders the section totals and a synthetic equity line once data loads", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Retained Earnings")).toBeTruthy());
    expect(screen.getByText("Net Income")).toBeTruthy();
    expect(screen.getByText("Owner Capital")).toBeTruthy();
    // Total liabilities + equity line present
    expect(screen.getByText("Total liabilities + equity")).toBeTruthy();
  });

  it("shows the books-balance indicator when balanced", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Books balance/)).toBeTruthy());
  });
});
