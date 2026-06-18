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

  it("renders user avatar initials (not '?') in the sidebar footer", () => {
    renderSidebar();
    // ROLES.staff.user.initials = "ST" — AvatarRound must render children, not fall back to "?"
    const stNodes = screen.getAllByText("ST");
    const avatarFallback = stNodes.find(
      (el) => el.tagName.toLowerCase() === "span" && el.className.includes("rounded-full")
    );
    expect(avatarFallback).toBeTruthy();
    // The footer user avatar must NOT show the generic fallback "?"
    const questionNodes = screen.queryAllByText("?");
    const userAvatarQuestion = questionNodes.find(
      (el) => el.tagName.toLowerCase() === "span" && el.className.includes("rounded-full")
    );
    expect(userAvatarQuestion).toBeUndefined();
  });

  it("renders client switcher for staff role (canSwitchClient=true)", () => {
    renderSidebar();
    // AppProviders defaults clientId to CLIENTS[0].id ("atlas")
    // Sidebar now reads from context, so we see context-derived name and sub
    expect(screen.getByText("Atlas Coffee Roasters")).toBeTruthy();
    expect(screen.getByText("LLC · Food & Beverage")).toBeTruthy();
  });

  it("renders client avatar initials (not '?') in the client switcher", () => {
    renderSidebar();
    // CLIENTS[0].initials = "AC" — Avatar must render children, not fall back to "?"
    // Note: "AC" also appears in the brand logo div, so we find all matches and
    // assert at least one is the square avatar fallback span (rounded-lg).
    const acNodes = screen.getAllByText("AC");
    const avatarFallback = acNodes.find(
      (el) => el.tagName.toLowerCase() === "span" && el.className.includes("rounded-lg")
    );
    expect(avatarFallback).toBeTruthy();
    // The client switcher avatar must NOT show the generic fallback "?"
    const questionNodes = screen.queryAllByText("?");
    const clientAvatarQuestion = questionNodes.find(
      (el) => el.tagName.toLowerCase() === "span" && el.className.includes("rounded-lg")
    );
    expect(clientAvatarQuestion).toBeUndefined();
  });
});
