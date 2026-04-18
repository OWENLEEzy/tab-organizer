import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y harness', () => {
  test('settings dialog keeps focus inside and restores it on close', async ({ page }) => {
    await page.goto('/a11y-harness.html');

    const openButton = page.getByRole('button', { name: 'Open settings' });
    await openButton.focus();
    await openButton.press('Enter');

    const closeButton = page.getByRole('button', { name: 'Close settings' });
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Reset to default' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(openButton).toBeFocused();
  });

  test('has no serious axe violations', async ({ page }) => {
    await page.goto('/a11y-harness.html');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
});
