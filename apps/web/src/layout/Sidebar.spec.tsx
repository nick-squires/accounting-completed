import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AppProviders } from "../app/providers";
import { Sidebar } from "./Sidebar";

function renderSidebar() {
  const router = createMemoryRouter([
    { path: "/", element: <Sidebar /> },
  ]);
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

describe("Sidebar", () => {
  it("renders the brand name", () => {
    renderSidebar();
    expect(screen.getByText("Accounting Completed")).toBeTruthy();
  });

  it("renders firm name for default staff role", () => {
    renderSidebar();
    // ROLES.staff.firm = "Records in Order"
    expect(screen.getByText("Records in Order")).toBeTruthy();
  });

  it("renders nav labels for staff role", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Transactions")).toBeTruthy();
    expect(screen.getByText("Profit & Loss")).toBeTruthy();
    expect(screen.getByText("System health")).toBeTruthy();
  });

  it("renders user name in footer", () => {
    renderSidebar();
    // ROLES.staff.user.name = "Scott Turner"
    expect(screen.getByText("Scott Turner")).toBeTruthy();
  });

  it("renders client switcher for staff role (canSwitchClient=true)", () => {
    renderSidebar();
    // AppProviders defaults clientId to CLIENTS[0].id ("atlas")
    // Sidebar now reads from context, so we see context-derived name and sub
    expect(screen.getByText("Atlas Coffee Roasters")).toBeTruthy();
    expect(screen.getByText("LLC · Food & Beverage")).toBeTruthy();
  });
});
