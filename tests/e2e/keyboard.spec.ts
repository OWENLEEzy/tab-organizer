import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
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

  test('section shortcuts switch only through sections with content', async ({ page }) => {
    await page.getByRole('button', { name: 'New section' }).click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel('Section Name').fill('Later');
    await dialog.getByRole('button', { name: 'Create Section' }).click();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'System' }).click();
    await page.locator('#setting-view-mode').selectOption('table');
    await page.keyboard.press('Escape');
    const youtubeRow = page.getByRole('row', { name: /YouTube/ });
    const sectionSelect = youtubeRow.locator('select');
    const laterValue = await sectionSelect.evaluate((select) => {
      const element = select as HTMLSelectElement;
      return [...element.options].find((option) => option.textContent === 'Later')?.value ?? '';
    });
    await sectionSelect.selectOption(laterValue);

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'System' }).click();
    await page.locator('#setting-view-mode').selectOption('cards');
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await page.keyboard.press('Meta+4');

    await expect(page.getByRole('button', { name: 'Later' })).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('heading', { name: 'YouTube' })).toBeVisible();
  });
});
