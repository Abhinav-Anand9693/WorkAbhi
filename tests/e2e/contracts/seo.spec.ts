import { test, expect } from "@playwright/test";
import { readToolInventory, toolPath } from "../../utils/toolInventory";

test.describe("Tool SEO contract", () => {
  for (const tool of readToolInventory()) {
    test(`${tool.id} has basic metadata`, async ({ page }) => {
      await page.goto(toolPath(tool.id), { waitUntil: "domcontentloaded" });

      await expect(page).toHaveTitle(/.+/);
      await expect(page.locator('meta[name="description"]')).toHaveCount(1);

      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description?.trim().length || 0).toBeGreaterThan(20);

      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
});
