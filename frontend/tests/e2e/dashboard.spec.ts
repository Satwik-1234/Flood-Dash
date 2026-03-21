import { test, expect } from '@playwright/test';

test.describe('Pravhatattva Dashboard E2E', () => {

  test('Root Overview loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // h1 is sr-only but present in DOM
    await expect(page.locator('h1').filter({ hasText: 'Pravhatattva' }))
      .toBeAttached({ timeout: 8000 });

    // KPI card — must be visible
    await expect(page.locator('text=Critical Alerts'))
      .toBeVisible({ timeout: 8000 });
  });

  test('Live Map container renders', async ({ page }) => {
    await page.goto('/map');
    // Wait for the lazy-loaded chunk to arrive and MapLibre to init
    await page.waitForLoadState('networkidle', { timeout: 20000 });
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
