import { test, expect } from "@playwright/test";

test("homepage renders core UI", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("a").first()).toBeVisible();

  const text = (await page.locator("body").innerText()).trim();
  expect(text.length).toBeGreaterThan(100);
});
