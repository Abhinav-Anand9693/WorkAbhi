import { test, expect } from "@playwright/test";
import { readToolInventory, toolPath } from "../../utils/toolInventory";

const interactiveCategories = new Set([
  "calculator",
  "text",
  "security",
  "date-time",
  "color",
  "developer",
]);

test.describe("Basic tool interaction smoke checks", () => {
  for (const tool of readToolInventory().filter((t) => interactiveCategories.has(t.category || ""))) {
    test(`${tool.id} exposes usable controls`, async ({ page }) => {
      await page.goto(toolPath(tool.id), { waitUntil: "domcontentloaded" });

      const inputs = page.locator("input, textarea, select, button");
      const count = await inputs.count();

      expect(count, `${tool.id} has no interactive controls`).toBeGreaterThan(0);

      // Check that at least one visible control can receive focus.
      let focused = false;
      for (let i = 0; i < Math.min(count, 12); i++) {
        const control = inputs.nth(i);
        if (await control.isVisible().catch(() => false)) {
          await control.focus().catch(() => {});
          focused = true;
          break;
        }
      }
      expect(focused, `${tool.id} has no visible focusable control`).toBe(true);
    });
  }
});
