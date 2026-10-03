import { test, expect } from "@playwright/test";

test("homepage has no obvious horizontal overflow", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - window.innerWidth;
  });

  expect(overflow, "Horizontal page overflow detected").toBeLessThanOrEqual(2);
});
