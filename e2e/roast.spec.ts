import { test, expect } from "@playwright/test";

const FULL = process.env.E2E_FULL === "1";

test.describe("/roast", () => {
  test("accepts pasted CV text", async ({ page }) => {
    await page.goto("/roast");
    const textarea = page.getByPlaceholder(/Paste the full text/i);
    await expect(textarea).toBeVisible();
    await textarea.fill(
      "Experienced senior software engineer with 8 years building distributed systems. " +
        "Led teams of 5+ engineers shipping payments infrastructure at scale. " +
        "Strong TypeScript, Go, Kubernetes. Reduced incident MTTR by 60% in 12 months."
    );
    await expect(page.getByRole("button", { name: /Roast me/i })).toBeEnabled();
  });

  test("reaches a score or rate-limit message", async ({ page }) => {
    test.skip(!FULL, "E2E_FULL=1 required (burns AI quota)");
    await page.goto("/roast");
    await page.getByPlaceholder(/Paste the full text/i).fill(
      "Senior software engineer with deep experience in TypeScript, distributed systems, and team leadership. " +
        "Shipped multiple zero-downtime migrations and mentored junior engineers across two orgs."
    );
    await page.getByRole("button", { name: /Roast me/i }).click();

    const score = page.getByText(/\b\d{1,3}\s*\/\s*100\b/);
    const limited = page.getByText(/rate.?limit|try again|too many/i);
    await expect(score.or(limited).first()).toBeVisible({ timeout: 45_000 });
  });
});