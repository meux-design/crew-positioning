import { expect, test } from "@playwright/test";

test("searches results and opens detail", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /search availability/i }).click();
  await expect(page.getByRole("heading", { name: /ranked seats/i })).toBeVisible();
  await expect(page.getByText(/fit/i).first()).toBeVisible();
  await page.getByRole("button").filter({ hasText: /SYD/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/why it ranks here/i)).toBeVisible();
});
