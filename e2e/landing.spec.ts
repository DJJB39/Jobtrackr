import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("renders hero with both primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Try the interactive demo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get roasted free/i })).toBeVisible();
  });
});