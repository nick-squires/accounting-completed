import { test, expect } from "@playwright/test";

test("root redirects to /login when unauthenticated", async ({ page }) => {
  // Mock /api/auth/me as 401 so RequireAuth sees null and redirects to /login
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, body: JSON.stringify({ error: "Unauthorized" }) })
  );
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Welcome back.")).toBeVisible();
});

test("authenticated user sees app shell with client switcher", async ({ page }) => {
  // Mock /api/auth/me with a valid SessionUser shape (contracts/src/auth.ts)
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: 1,
        username: "testuser",
        firmClientId: null,
        roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
      }),
    })
  );
  // Mock /api/clients with valid ClientSummary[] shape (contracts/src/clients.ts)
  await page.route("**/api/clients", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "1", name: "Acme Corp" },
        { id: "2", name: "Beta Ltd" },
      ]),
    })
  );
  await page.goto("/dashboard");
  // App shell sidebar brand should be visible
  await expect(page.getByText("Accounting Completed")).toBeVisible();
  // Live client list renders for staff with canSwitchClient
  await expect(page.getByRole("button", { name: "Acme Corp" })).toBeVisible();
});
