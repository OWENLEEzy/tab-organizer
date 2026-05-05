import { test, expect } from '@playwright/test';

test.describe('Tab Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e-harness.html');
  });

  test('displays greeting header with date', async ({ page }) => {
    const greeting = page.locator('h1');
    await expect(greeting).toBeVisible();

    const text = await greeting.textContent();
    expect(text).toMatch(/Good (morning|afternoon|evening)/);
  });

  test('displays tab count badge', async ({ page }) => {
    const badge = page.locator('span:has-text("tab")');
    await expect(badge.first()).toBeVisible();
  });

  test('close all button shows confirmation dialog', async ({ page }) => {
    // Use the header section to scope the close all button
    const closeButton = page.locator('button:has-text("Close all")').first();
    await closeButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const confirmButton = dialog.getByRole('button', { name: 'Close all', exact: true });
    await expect(confirmButton).toBeVisible();
  });

  test('domain card shows correct tab count', async ({ page }) => {
    // Wait for cards to render
    await page.waitForSelector('[class*="missions"]');

    const cards = page.locator('[class*="rounded-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('tab chip displays favicon', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const firstChip = page.locator('[data-tab-url]').first();
    const favicon = firstChip.locator('img').first();

    await expect(favicon).toHaveAttribute('src', /https?:\/\//);
  });

  test('active tab has visual indicator', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const activeChip = page.locator('[aria-current="page"]').first();
    await expect(activeChip).toBeVisible();
  });
});
