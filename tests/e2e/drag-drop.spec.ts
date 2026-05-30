import { test, expect } from '@playwright/test';

test.describe('Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });


  test('product group cards are visible', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    const cards = page.locator('[class*="rounded-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('product group card shows drag handle by default', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    // With direct drag, grab cursor should be visible without clicking Organize
    const cardHeader = page.locator('.cursor-grab').first();
    await expect(cardHeader).toBeVisible();
  });

  test('cursor changes to grab on hover', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    const cardHeader = page.locator('[class*="cursor-grab"]').first();

    // Check cursor style - should be grab by default
    const cursor = await cardHeader.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toContain('grab');
  });

  test('product group cards have grab cursor by default', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    const grabbableElements = page.locator('.cursor-grab');
    await expect(grabbableElements.first()).toBeVisible();
  });
});
