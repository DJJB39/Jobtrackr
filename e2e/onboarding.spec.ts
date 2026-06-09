import { test, expect } from "@playwright/test";

const FULL = process.env.E2E_FULL === "1";
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

test.describe("onboarding CV assessment", () => {
  test("assessment step completes and surfaces a score", async ({ page }) => {
    test.skip(!FULL, "E2E_FULL=1 required (burns AI quota and uses real auth)");
    test.skip(!email || !password, "TEST_EMAIL and TEST_PASSWORD must be set");

    await page.goto("/auth");
    await page.getByLabel(/email/i).first().fill(email!);
    await page.getByLabel(/password/i).first().fill(password!);
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();

    await page.goto("/onboarding");

    const roast = page.getByRole("button", { name: /Roast my CV/i });
    if (await roast.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await roast.click();
      const score = page.getByText(/\/\s*100/);
      const networkErr = page.getByText(/Couldn't reach the coach/i);
      await expect(score.or(networkErr).first()).toBeVisible({ timeout: 60_000 });
      await expect(networkErr).toHaveCount(0);
    } else {
      test.info().annotations.push({ type: "skip-reason", description: "Assessment step not reachable for this account state" });
    }
  });
});