import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { AppProviders } from "../app/providers";
import { Sidebar } from "./Sidebar";

const staffUser = {
  userId: 1,
  username: "staff",
  fullName: "Staff User",
  companyName: "Demo Firm",
  firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const clients = [
  { id: "2243", name: "Amos, Jim" },
  { id: "2189", name: "Dr. Reuben Montemagni, A Chiropractic Corporation" },
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

describe("Sidebar default client", () => {
  it("defaults to the first real client once the staff list loads", async () => {
    renderSidebar();
    // From the null initial selection, defaults to the first API client.
    await waitFor(() => expect(screen.getByText("Amos, Jim")).toBeTruthy());
    // The pre-load placeholders must no longer be showing.
    expect(screen.queryByText("Loading…")).toBeNull();
    expect(screen.queryByText("Select a client")).toBeNull();
  });
});
