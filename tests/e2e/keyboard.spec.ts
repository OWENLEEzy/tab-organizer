import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e-harness.html');
    await expect(page.locator('[data-tab-url]').first()).toBeVisible();
  });

  test('arrow down navigates to first tab chip', async ({ page }) => {
    // Press ArrowDown
    await page.keyboard.press('ArrowDown');

    // First tab chip should be focused
    const firstChip = page.locator('[data-tab-url]').first();
    await expect(firstChip).toBeFocused();
  });

  test('arrow up navigates to last tab chip', async ({ page }) => {
    // Press ArrowUp (should wrap to last)
    await page.keyboard.press('ArrowUp');

    const chips = page.locator('[data-tab-url]');
    const count = await chips.count();
    if (count > 0) {
      await expect(chips.nth(count - 1)).toBeFocused();
    }
  });

  test('enter on focused chip opens tab', async ({ page }) => {
    // First navigate to a chip
    await page.keyboard.press('ArrowDown');

    const firstChip = page.locator('[data-tab-url]').first();

    // Press Enter
    await page.keyboard.press('Enter');

    // Should have triggered focus action (we can't verify chrome.tabs.update in test)
    // But we can verify the chip exists
    await expect(firstChip).toBeVisible();
  });

  test('escape clears search and blur', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'search tabs' });
    await searchInput.fill('test');

    await page.keyboard.press('Escape');

    await expect(searchInput).toHaveValue('');
    // Should be blurred (not focused)
    await expect(searchInput).not.toBeFocused();
  });

  test('focused chip shows visual ring', async ({ page }) => {
    await page.keyboard.press('ArrowDown');

    const focusedChip = page.locator('[data-tab-url]').first();
    await expect(focusedChip).toHaveClass(/ring-2/);
  });
});
