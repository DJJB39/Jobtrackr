import { test, expect } from "@playwright/test";

const FULL = process.env.E2E_FULL === "1";
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

test.describe("authenticated entry", () => {
  test("signs in and lands in Today view", async ({ page }) => {
    test.skip(!FULL, "E2E_FULL=1 required for real auth");
    test.skip(!email || !password, "TEST_EMAIL and TEST_PASSWORD must be set");

    await page.goto("/auth");
    await page.getByLabel(/email/i).first().fill(email!);
    await page.getByLabel(/password/i).first().fill(password!);
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();

    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30_000 });

    if (page.url().includes("/app")) {
      await expect(page.locator('[data-tour="view-switcher"]')).toBeVisible({ timeout: 20_000 });
      await expect(
        page.locator('[data-tour="view-switcher"]').getByRole("button", { name: /Today/i })
      ).toBeVisible();
    }
  });
});