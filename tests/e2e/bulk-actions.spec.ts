import { test, expect } from '@playwright/test';

test.describe('Bulk Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('selecting multiple tabs across groups and closing them', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const githubTab = page.locator('[data-tab-url]').first();
    const youtubeTab = page.locator('[data-tab-url]').nth(4); // A youtube tab
    const docsTab = page.locator('[data-tab-url]').nth(6); // A docs tab

    // Select them using Meta click
    await githubTab.click({ modifiers: ['Meta'] });
    await youtubeTab.click({ modifiers: ['Meta'] });
    await docsTab.click({ modifiers: ['Meta'] });

    const selectionBar = page.locator('.fixed.bottom-5.left-1\\/2');
    await expect(selectionBar).toBeVisible();
    await expect(selectionBar).toContainText('3 selected');

    const closeButton = selectionBar.getByRole('button', { name: 'Close', exact: true });
    await expect(closeButton).toBeVisible();

    // Click close - it should show a confirmation dialog
    await closeButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Close 3 selected tabs');

    const confirmButton = dialog.getByRole('button', { name: 'Close Selected', exact: true });
    await confirmButton.click();

    // Dialog should close and selection should be cleared
    await expect(dialog).not.toBeVisible();
    await expect(selectionBar).not.toBeVisible();
  });
});
