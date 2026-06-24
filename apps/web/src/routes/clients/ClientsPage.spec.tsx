import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { AppProviders } from "../../app/providers";
import { ClientsPage } from "./ClientsPage";

const staffUser = {
  userId: 1,
  username: "jlee",
  firmClientId: 69,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};

const clients = [
  {
    id: "1",
    name: "Acme Roasters",
    email: "hello@acme.test",
    location: "Austin, TX",
    createdAt: "2015-09-30T00:00:00.000Z",
    status: "verified",
  },
  {
    id: "2",
    name: "Globex Logistics",
    email: "ops@globex.test",
    location: "WA",
    createdAt: "2016-01-10T00:00:00.000Z",
    status: "unverified",
  },
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
      <ClientsPage />
    </AppProviders>,
  );
}

describe("ClientsPage", () => {
  it("renders clients with the richer columns", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Acme Roasters")).toBeTruthy());
    expect(screen.getByText("hello@acme.test")).toBeTruthy();
    expect(screen.getByText("Austin, TX")).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Unverified")).toBeTruthy();
  });

  it("filters clients via client-side search", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Acme Roasters")).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText(/Search clients/i), { target: { value: "globex" } });
    expect(screen.queryByText("Acme Roasters")).toBeNull();
    expect(screen.getByText("Globex Logistics")).toBeTruthy();
  });
});
