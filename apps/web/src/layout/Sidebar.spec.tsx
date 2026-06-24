import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { AppProviders } from "../app/providers";
import { Sidebar } from "./Sidebar";

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

function renderSidebar() {
  const router = createMemoryRouter([{ path: "/", element: <Sidebar /> }]);
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe("Sidebar", () => {
  it("renders the brand name", () => {
    renderSidebar();
    expect(screen.getByText("Accounting Completed")).toBeTruthy();
  });

  it("renders the real company name from /me", async () => {
    renderSidebar();
    await waitFor(() => expect(screen.getByText("Northwind Books")).toBeTruthy());
  });

  it("renders nav labels for staff role", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Transactions")).toBeTruthy();
    expect(screen.getByText("Profit & Loss")).toBeTruthy();
    expect(screen.getByText("System health")).toBeTruthy();
  });

  it("renders the real user name and role label in the footer", async () => {
    renderSidebar();
    await waitFor(() => expect(screen.getByText("Jordan Lee")).toBeTruthy());
    expect(screen.getByText("Firm staff")).toBeTruthy();
  });

  it("does not render any static nav badge counts", async () => {
    renderSidebar();
    await waitFor(() => expect(screen.getByText("Jordan Lee")).toBeTruthy());
    // The old mock badges (42 / 3 / 28) must be gone.
    expect(screen.queryByText("42")).toBeNull();
    expect(screen.queryByText("28")).toBeNull();
  });

  it("shows the first real client in the switcher once the staff list loads", async () => {
    renderSidebar();
    await waitFor(() => expect(screen.getByText("Acme Roasters")).toBeTruthy());
  });
});
