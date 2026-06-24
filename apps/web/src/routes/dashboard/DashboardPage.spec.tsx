import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { AppProviders } from "../../app/providers";
import { DashboardPage } from "./DashboardPage";

const staffUser = {
  userId: 1,
  username: "jlee",
  fullName: "Jordan Lee",
  companyName: "Northwind Books",
  firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const clients = [
  { id: "2243", name: "Acme Roasters" },
  { id: "2189", name: "Globex Logistics" },
];

const server = setupServer(
  http.get("*/api/auth/me", () => HttpResponse.json(staffUser)),
  http.get("*/api/clients", () => HttpResponse.json(clients)),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  return render(
    <AppProviders>
      <DashboardPage />
    </AppProviders>,
  );
}

describe("DashboardPage", () => {
  it("greets the real logged-in user", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Jordan/)).toBeTruthy());
    // The old hardcoded greeting must be gone.
    expect(screen.queryByText(/Good morning, Scott/)).toBeNull();
  });

  it("lists the real clients from the API", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Acme Roasters")).toBeTruthy());
    expect(screen.getByText("Globex Logistics")).toBeTruthy();
  });

  it("shows honest empty states for unbuilt widgets", () => {
    renderPage();
    expect(screen.getByText("No upcoming deadlines")).toBeTruthy();
    expect(screen.getByText("No recent activity")).toBeTruthy();
  });

  it("does not render the fabricated KPI tiles", () => {
    renderPage();
    expect(screen.queryByText("New bank items")).toBeNull();
    expect(screen.queryByText("Books up to date")).toBeNull();
  });
});
