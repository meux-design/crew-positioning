import { expect, test } from "@playwright/test";

test("compares commute columns and opens option detail on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: /compare commute/i }).click();

  await expect(page.getByRole("heading", { name: /commute comparison/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /standby/i })).toBeVisible();
  await expect(page.getByText(/seeded demo data/i).first()).toBeVisible();

  await page.getByRole("tab", { name: /award/i }).click();
  await expect(page.getByRole("heading", { name: /award redemption/i })).toBeVisible();

  await page.getByRole("tab", { name: /standby/i }).click();
  await page.getByRole("button").filter({ hasText: /SYD to MEL/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/why it ranks here/i)).toBeVisible();
  await expect(page.getByText(/clearance/i).first()).toBeVisible();
});
