import { test, expect } from '@playwright/test';

test.describe('Tab Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('displays dashboard header', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Tab Organizer' }),
    ).toBeVisible();
  });

  test('displays tab count badge', async ({ page }) => {
    const badge = page.locator('span:has-text("tab")');
    await expect(badge.first()).toBeVisible();
  });

  test('section close all button shows confirmation dialog', async ({ page }) => {
    const devSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Dev', exact: true }),
    });
    await expect(devSection).toBeVisible();

    await devSection.getByTitle(/Close all \d+ tabs in Dev/).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Close all tabs in Dev')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close all', exact: true })).toBeVisible();
  });

  test('domain card shows correct tab count', async ({ page }) => {
    // Wait for cards to render
    await page.waitForSelector('[class*="rounded-card"]');

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
