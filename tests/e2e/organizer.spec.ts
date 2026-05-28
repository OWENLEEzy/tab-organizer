import { test, expect } from '@playwright/test';

test.describe('Hybrid Organizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('creates a section, moves a product in table view, and persists after refresh', async ({ page }) => {
    await page.waitForSelector('[class*="rounded-card"]');

    await page.getByRole('button', { name: 'New section' }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Section Name').fill('Later');
    await dialog.getByRole('button', { name: 'Create Section' }).click();
    await expect(dialog).not.toBeVisible();
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

  test('empty sections do not increase dashboard section count', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');
    await expect(page.getByText(/\d+ sections/)).toBeVisible();

    await page.getByRole('button', { name: 'New section' }).click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel('Section Name').fill('Empty Later');
    await dialog.getByRole('button', { name: 'Create Section' }).click();

    await expect(page.getByRole('button', { name: 'Empty Later' })).not.toBeVisible();
    await expect(page.getByText('Empty Later')).not.toBeVisible();
  });

  test('moving a product to and from a section updates visible section count', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    await page.getByRole('button', { name: 'New section' }).click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel('Section Name').fill('Later');
    await dialog.getByRole('button', { name: 'Create Section' }).click();

    await page.getByRole('button', { name: 'Table' }).click();
    const youtubeRow = page.getByRole('row', { name: /YouTube/ });
    const sectionSelect = youtubeRow.locator('select');
    const laterValue = await sectionSelect.evaluate((select) => {
      const element = select as HTMLSelectElement;
      return [...element.options].find((option) => option.textContent === 'Later')?.value ?? '';
    });

    await sectionSelect.selectOption(laterValue);
    await expect(page.getByText(/1 sections/)).toBeVisible();

    await sectionSelect.selectOption('');
    await expect(page.getByText(/0 sections/)).toBeVisible();

    await page.getByRole('button', { name: 'Cards' }).click();
    await expect(page.getByRole('heading', { name: 'Unsorted' })).toBeVisible();
  });
});
