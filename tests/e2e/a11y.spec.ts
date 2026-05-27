import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y harness', () => {
  test('settings dialog keeps focus inside and restores it on close', async ({ page }) => {
    await page.goto('/tests/harness/a11y-harness.html');

    const openButton = page.getByRole('button', { name: 'Open settings' });
    await openButton.focus();
    await openButton.press('Enter');

    const generalTab = page.getByRole('button', { name: 'General' });
    await expect(generalTab).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Reset Order' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(generalTab).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(openButton).toBeFocused();
  });

  test('has no serious axe violations', async ({ page }) => {
    await page.goto('/tests/harness/a11y-harness.html');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('full dashboard has no axe violations in key states', async ({ page }) => {
    for (const scenario of ['default', 'duplicates', 'empty']) {
      await page.goto(`/tests/harness/e2e-harness.html?scenario=${scenario}`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, scenario).toEqual([]);
    }
  });
});
