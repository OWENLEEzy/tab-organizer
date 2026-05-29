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

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'System' }).click();
    await page.locator('#setting-view-mode').selectOption('table');
    await page.keyboard.press('Escape');
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
    await expect(page.locator('footer')).toContainText(/4\s*sections/i);

    await page.reload();

    const reloadedYoutubeRow = page.getByRole('row', { name: /YouTube/ });
    await expect(reloadedYoutubeRow.locator('select')).toHaveValue(laterValue);

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'System' }).click();
    await page.locator('#setting-view-mode').selectOption('cards');
    await page.keyboard.press('Escape');
    const laterSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Later' }),
    });
    await expect(laterSection.getByRole('heading', { name: 'YouTube' })).toBeVisible();
  });

  test('empty sections do not appear in section switcher but render as cards drop zones', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');
    await expect(page.locator('footer')).toContainText(/\d+\s*sections/i);

    await page.getByRole('button', { name: 'New section' }).click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel('Section Name').fill('Empty Later');
    await dialog.getByRole('button', { name: 'Create Section' }).click();

    // Empty section should NOT appear in section switcher buttons
    await expect(page.getByRole('button', { name: 'Empty Later' })).not.toBeVisible();
    // But the empty section SHOULD render as a cards drop zone (heading visible in DndOrganizer)
    await expect(page.getByRole('heading', { name: 'Empty Later' })).toBeVisible();
  });

  test('moving a product to and from a section updates visible section count', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

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
    await expect(page.locator('footer')).toContainText(/4\s*sections/i);

    await sectionSelect.selectOption('');
    await expect(page.locator('footer')).toContainText(/3\s*sections/i);

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'System' }).click();
    await page.locator('#setting-view-mode').selectOption('cards');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'No section' })).toBeVisible();
  });
});
