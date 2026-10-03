import { test, expect } from '@playwright/test';
import { tools } from '../src/config/tools';

const appConsoleNoise = [
  /Download the React DevTools/i,
];

function isIgnorableConsoleError(message: string) {
  return appConsoleNoise.some((pattern) => pattern.test(message));
}

for (const [index, tool] of tools.entries()) {
  // Registry may contain duplicate IDs. Keep every registry entry testable,
  // while making Playwright test titles unique.
  test(`[${index + 1}/${tools.length}] ${tool.id} — route smoke test`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error' && !isIgnorableConsoleError(message.text())) {
        consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    const response = await page.goto(`/tool/${tool.id}`, {
      waitUntil: 'domcontentloaded',
    });

    expect(response, `${tool.id} did not return a response`).not.toBeNull();
    expect(response!.status(), `${tool.id} returned HTTP ${response!.status()}`).toBeLessThan(400);

    await expect(page.locator('body')).toContainText(tool.name, { timeout: 15_000 });

    const notFound = await page.getByText(/404|page not found|tool not found/i).count();
    expect(notFound, `${tool.id} appears to render a not-found state`).toBe(0);

    const unimplemented = await page
      .getByText(/not implemented|coming soon|under development/i)
      .count();
    expect(unimplemented, `${tool.id} appears to be unimplemented`).toBe(0);

    expect(pageErrors, `${tool.id} produced page errors`).toEqual([]);
    expect(consoleErrors, `${tool.id} produced console errors`).toEqual([]);
  });
}
