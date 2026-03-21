import { test, expect } from '@playwright/test';

test.describe('Pravhatattva Dashboard E2E', () => {
  
  test('Root Overview loads correctly', async ({ page }) => {
    await page.goto('/');
    // Check main title
    await expect(page.locator('h1').filter({ hasText: 'Pravhatattva' })).toBeVisible();
    // Check KPI Grid exists
    await expect(page.locator('text=Critical Alerts')).toBeVisible();
  });

  test('Live Map container renders', async ({ page }) => {
    await page.goto('/map');
    // MapLibre injects a canvas
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeAttached();
  });

  test('Alert Center filters render', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.locator('h2').filter({ hasText: 'Live Alert Center' })).toBeVisible();
    // Validate filter dropdown
    const select = page.locator('select');
    await expect(select).toHaveValue('ALL');
  });

});
