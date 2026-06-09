import { test, expect } from "@playwright/test";

test.describe("/demo", () => {
  test("loads Today view and switches between Pipeline and You", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.locator('[data-tour="primary-order"]').first()).toBeVisible({ timeout: 20_000 });

    const switcher = page.locator('[data-tour="view-switcher"]');
    await expect(switcher).toBeVisible();

    await switcher.getByRole("button", { name: /Pipeline/i }).click();
    await expect(page.getByText(/Kanban|Calendar|List/i).first()).toBeVisible();

    await switcher.getByRole("button", { name: /You/i }).click();
    await expect(page.getByText(/Overview|Progression|History/i).first()).toBeVisible();

    await page.locator('[data-tour="ai-studio-button"]').click();
    await expect(page.getByText(/AI Studio/i).first()).toBeVisible();
  });
});