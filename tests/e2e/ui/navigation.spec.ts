import { test, expect } from "@playwright/test";

test("internal navigation does not create a broken page", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const links = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => href.startsWith(location.origin))
      .slice(0, 30)
  );

  expect(links.length).toBeGreaterThan(0);

  for (const href of [...new Set(links)]) {
    const response = await page.goto(href, { waitUntil: "domcontentloaded" });
    expect(response, `No response for ${href}`).not.toBeNull();
    expect(response!.status(), `Broken internal link ${href}`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  }
});
