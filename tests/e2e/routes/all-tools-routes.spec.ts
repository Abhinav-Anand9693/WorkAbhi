import { test, expect } from "@playwright/test";
import { readToolInventory, toolPath } from "../../utils/toolInventory";
import {
  assertNoRuntimeDiagnostics,
  installRuntimeDiagnostics,
} from "../../utils/runtimeDiagnostics";

const tools = readToolInventory();

test.describe("Every registered WorkAbhi tool route", () => {
  test.describe.configure({ mode: "serial" });

  test(`registry contains ${tools.length} tool routes`, async () => {
    expect(tools.length).toBeGreaterThan(0);
    const ids = tools.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const tool of tools) {
    test(`${tool.id} :: route loads without runtime errors`, async ({ page }) => {
      const diagnostics = installRuntimeDiagnostics(page);
      const route = toolPath(tool.id);

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response, `No response for ${route}`).not.toBeNull();
      expect(response!.status(), `HTTP status for ${route}`).toBeLessThan(400);

      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("h1").first()).toBeVisible();

      const bodyText = (await page.locator("body").innerText()).trim();
      expect(bodyText.length, `Blank page: ${route}`).toBeGreaterThan(50);

      assertNoRuntimeDiagnostics(diagnostics, route);
    });
  }
});
