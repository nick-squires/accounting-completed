import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/login");

  // Expect h2 to contain the login heading.
  expect(await page.locator("h2").innerText()).toContain("Welcome back.");
});
