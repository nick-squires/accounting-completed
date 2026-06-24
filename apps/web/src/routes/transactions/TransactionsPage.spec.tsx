import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { ClientContext } from "../../app/client-context";
import { TransactionsPage } from "./TransactionsPage";

const staffUser = {
  userId: 1,
  username: "jlee",
  fullName: "Jordan Lee",
  companyName: "Northwind Books",
  firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const clients = [{ id: "2243", name: "Acme Roasters" }];
const txnResponse = {
  meta: { clientId: 2243, year: 2025, generatedAt: "2025-06-01T00:00:00.000Z" },
  transactions: [
    { id: 1, postedDate: "2025-03-04T00:00:00.000Z", payee: "Office Depot", memo: null, amount: -42.5, category: null, checkNumber: null, account: "Checking", status: "review" },
    { id: 2, postedDate: "2025-03-05T00:00:00.000Z", payee: "Acme Sales", memo: null, amount: 1200, category: "Revenue", checkNumber: null, account: "Checking", status: "categorized" },
  ],
};

const server = setupServer(
  http.get("*/api/auth/me", () => HttpResponse.json(staffUser)),
  http.get("*/api/clients", () => HttpResponse.json(clients)),
  http.get("*/api/transactions/years", () => HttpResponse.json({ years: [2025] })),
  http.get("*/api/transactions", () => HttpResponse.json(txnResponse)),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(clientId: string | null = "2243") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ClientContext.Provider value={{ clientId, setClientId: () => undefined }}>
        <TransactionsPage />
      </ClientContext.Provider>
    </QueryClientProvider>,
  );
}

describe("TransactionsPage", () => {
  it("renders the page header and status tabs", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Transactions" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "For review" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Categorized" })).toBeTruthy();
  });

  it("shows the real selected client name once it loads", async () => {
    renderPage("2243");
    await waitFor(() => expect(screen.getByText("Acme Roasters")).toBeTruthy());
  });

  it("renders real transactions for the default 'For review' tab", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Office Depot")).toBeTruthy());
    // A categorized row is hidden on the review tab.
    expect(screen.queryByText("Acme Sales")).toBeNull();
  });

  it("switches tabs to show categorized transactions", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Office Depot")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Categorized" }));
    await waitFor(() => expect(screen.getByText("Acme Sales")).toBeTruthy());
    expect(screen.queryByText("Office Depot")).toBeNull();
  });
});
