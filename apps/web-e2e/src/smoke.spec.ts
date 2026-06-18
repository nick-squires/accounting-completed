import { test, expect } from "@playwright/test";

test("root redirects to login and login renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Welcome back.")).toBeVisible();
});

test("login navigates into the dashboard shell", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/Viewing as/i)).toBeVisible();
});
