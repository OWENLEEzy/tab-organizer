import { test, expect } from '@playwright/test';

test.describe('Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });


  test('domain cards are visible', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    const cards = page.locator('[class*="rounded-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('domain card shows drag handle', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    await expect(page.locator('.cursor-grab')).toHaveCount(0);
    await page.getByRole('button', { name: 'Organize' }).click();

    const cardHeader = page.locator('.cursor-grab').first();
    await expect(cardHeader).toBeVisible();
  });

  test('cursor changes to grab on hover', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');
    await page.getByRole('button', { name: 'Organize' }).click();

    const cardHeader = page.locator('[class*="cursor-grab"]').first();

    // Check cursor style
    const cursor = await cardHeader.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toContain('grab');
  });

  test('domain cards have grab cursor', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');
    await page.getByRole('button', { name: 'Organize' }).click();

    const grabbableElements = page.locator('.cursor-grab');
    await expect(grabbableElements.first()).toBeVisible();
  });
});
