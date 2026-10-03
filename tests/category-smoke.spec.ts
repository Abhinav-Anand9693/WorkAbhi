import { test, expect } from '@playwright/test';
import { tools } from '../src/config/tools';

const categories = [...new Set(tools.map((tool) => tool.category))];

for (const category of categories) {
  test(`${category} — representative route`, async ({ page }) => {
    const tool = tools.find((item) => item.category === category);
    expect(tool, `No tool found for category ${category}`).toBeTruthy();

    const response = await page.goto(`/tool/${tool!.id}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(tool!.name, { timeout: 15_000 });
  });
}
