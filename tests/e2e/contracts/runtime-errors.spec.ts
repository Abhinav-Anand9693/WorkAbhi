import { test, expect } from "@playwright/test";
import { installRuntimeDiagnostics, assertNoRuntimeDiagnostics } from "../../utils/runtimeDiagnostics";

const pages = ["/", "/tools", "/about", "/contact", "/privacy-policy", "/terms"];

test.describe("Core page runtime diagnostics", () => {
  for (const route of pages) {
    test(`${route} has no uncaught runtime failures`, async ({ page }) => {
      const diagnostics = installRuntimeDiagnostics(page);
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      // Some projects may not have every optional informational route.
      if (response?.status() === 404) test.skip(true, `${route} is not present in this build`);

      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      assertNoRuntimeDiagnostics(diagnostics, route);
    });
  }
});
