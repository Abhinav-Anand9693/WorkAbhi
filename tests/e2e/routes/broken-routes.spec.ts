import { test, expect } from "@playwright/test";

test.describe("Broken/dynamic route handling", () => {
  test("unknown tool slug returns a controlled 404", async ({ page }) => {
    const response = await page.goto("/tool/__playwright_nonexistent_tool__", {
      waitUntil: "domcontentloaded",
    });

    expect(response).not.toBeNull();
    expect(response!.status()).toBe(404);
    await expect(page.locator("body")).toBeVisible();
  });

  test("unknown top-level route returns a controlled 404", async ({ page }) => {
    const response = await page.goto("/__playwright_nonexistent_route__", {
      waitUntil: "domcontentloaded",
    });

    expect(response).not.toBeNull();
    expect(response!.status()).toBe(404);
    await expect(page.locator("body")).toBeVisible();
  });
});
