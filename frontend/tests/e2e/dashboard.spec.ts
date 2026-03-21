import { test, expect } from '@playwright/test';

test.describe('Pravhatattva Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER_ERROR: ${msg.text()}`);
    });
    page.on('pageerror', exception => {
      console.log(`BROWSER_EXCEPTION: ${exception.message}`);
    });
  });

  test('Root Overview loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Scoped h1 locator to Sidebar (aside) only
    await expect(page.locator('aside h1').filter({ hasText: 'Pravhatattva' }))
      .toBeAttached({ timeout: 8000 });

    // KPI card — must be visible
    await page.waitForSelector('text=Critical Alerts', { timeout: 10000 });
    await expect(page.locator('text=Critical Alerts')).toBeVisible();
  });

  test('Live Map container renders', async ({ page }) => {
    await page.goto('/map');
    // Drop networkidle: GitHub CI has restricted internet; tiles will retry 404
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 15000 });
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeAttached({ timeout: 15000 });
  });

  test('Alert Center filters render', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('h2').filter({ hasText: 'Live Alert Center' })
    ).toBeVisible({ timeout: 8000 });
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: 5000 });
  });

});
