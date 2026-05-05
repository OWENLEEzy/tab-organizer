import { test, expect } from '@playwright/test';

test.describe('Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('search input is visible', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'search tabs' });
    await expect(searchInput).toBeVisible();
  });

  test('shows keyboard shortcut hint when empty', async ({ page }) => {
    const hint = page.locator('kbd');

    await expect(hint).toContainText('/');
  });

  test('typing in search filters results', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'search tabs' });

    // Type search query using pressSequentially to trigger React events
    await searchInput.click();
    await searchInput.pressSequentially('github');

    // Wait for filtering
    await page.waitForTimeout(100);

    // Verify result count updates
    const resultCount = page.locator('text=/of \\d+/');
    await expect(resultCount).toBeVisible();
  });

  test('clear button appears when typing', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'search tabs' });

    await searchInput.click();
    await searchInput.pressSequentially('test');

    const clearButton = page.getByRole('button', { name: 'clear search' });
    await expect(clearButton).toBeVisible();
  });

  test('clear button empties search and refocuses input', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'search tabs' });

    await searchInput.click();
    await searchInput.pressSequentially('test');

    const clearButton = page.getByRole('button', { name: 'clear search' });
    await clearButton.click();

    await expect(searchInput).toHaveValue('');
    await expect(searchInput).toBeFocused();
  });

  test('keyboard shortcut / focuses search', async ({ page }) => {
    // Click away from search first
    await page.locator('h1').click();

    // Press /
    await page.keyboard.press('/');

    const searchInput = page.getByRole('searchbox', { name: 'search tabs' });
    await expect(searchInput).toBeFocused();
  });
});
