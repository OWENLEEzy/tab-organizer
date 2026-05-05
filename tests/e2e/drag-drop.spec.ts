import { test, expect } from '@playwright/test';

test.describe('Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e-harness.html');
  });

  test('domain cards are visible', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    const cards = page.locator('[class*="rounded-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('domain card shows drag handle when sortable', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    // Check that cursor-grab class is present on card header (indicates DnD is active)
    const cardHeader = page.locator('.cursor-grab').first();
    await expect(cardHeader).toBeVisible();
  });

  test('cursor changes to grab on hover', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    const cardHeader = page.locator('[class*="cursor-grab"]').first();

    // Check cursor style
    const cursor = await cardHeader.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toContain('grab');
  });

  test('domain cards have grab cursor', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    const grabbableElements = page.locator('.cursor-grab');
    await expect(grabbableElements.first()).toBeVisible();
  });
});
