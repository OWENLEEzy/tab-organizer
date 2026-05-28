import { test, expect } from '@playwright/test';

test.describe('sort window button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
    await page.waitForSelector('[data-tab-url]');
  });

  test('button is enabled in default view', async ({ page }) => {
    const sortBtn = page.getByRole('button', { name: /sort window/i });
    await expect(sortBtn).toBeEnabled();
  });

  test('button is disabled when search is active', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'search tabs' });
    await searchInput.click();
    await searchInput.pressSequentially('github');

    const sortBtn = page.getByRole('button', { name: /sort window/i });
    await expect(sortBtn).toBeDisabled();
  });

  test('shows confirmation dialog on click', async ({ page }) => {
    const sortBtn = page.getByRole('button', { name: /sort window/i });
    await sortBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/reorder tabs/i);
  });
});