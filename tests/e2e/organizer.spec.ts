import { test, expect } from '@playwright/test';

test.describe('Hybrid Organizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('creates a section, moves a product in table view, and persists after refresh', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Group name');
      await dialog.accept('Later');
    });
    await page.getByRole('button', { name: 'New Group' }).click();
    await expect(page.getByRole('heading', { name: 'Later' })).toBeVisible();

    await page.getByRole('button', { name: 'Table' }).click();
    const youtubeRow = page.getByRole('row', { name: /YouTube/ });
    await expect(youtubeRow).toBeVisible();

    const sectionSelect = youtubeRow.locator('select');
    const laterValue = await sectionSelect.evaluate((select) => {
      const element = select as HTMLSelectElement;
      const option = [...element.options].find((item) => item.textContent === 'Later');
      return option?.value ?? '';
    });
    expect(laterValue).not.toBe('');
    await sectionSelect.selectOption(laterValue);
    await expect(sectionSelect).toHaveValue(laterValue);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Table' })).toHaveClass(/is-active/);
    const reloadedYoutubeRow = page.getByRole('row', { name: /YouTube/ });
    await expect(reloadedYoutubeRow.locator('select')).toHaveValue(laterValue);

    await page.getByRole('button', { name: 'Cards' }).click();
    const laterSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Later' }),
    });
    await expect(laterSection.getByRole('heading', { name: 'YouTube' })).toBeVisible();
  });
});
