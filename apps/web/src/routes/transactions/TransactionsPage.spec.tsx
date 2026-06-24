import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

const server = setupServer(
  http.get("*/api/auth/me", () => HttpResponse.json(staffUser)),
  http.get("*/api/clients", () => HttpResponse.json(clients)),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// The selected client lives in the shared ClientContext (the Sidebar sets it in
// the running app); seed it here so the page renders as it would in context.
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

  it("shows an empty state instead of fabricated transactions", () => {
    renderPage();
    expect(screen.getByText("No transactions yet")).toBeTruthy();
    expect(
      screen.getByText("Imported and categorized transactions will appear here."),
    ).toBeTruthy();
  });

  it("does not render any fabricated counts or client header", () => {
    renderPage();
    expect(screen.queryByText("42 to review")).toBeNull();
    expect(screen.queryByText("Atlas Coffee Roasters")).toBeNull();
  });

  it("shows the real selected client name once it loads", async () => {
    renderPage("2243");
    await waitFor(() => expect(screen.getByText("Acme Roasters")).toBeTruthy());
  });

  it("keeps the detail panel in its empty 'Nothing selected' state", () => {
    renderPage();
    expect(screen.getByText("Nothing selected")).toBeTruthy();
  });
});
