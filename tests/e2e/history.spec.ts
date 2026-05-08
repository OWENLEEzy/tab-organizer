import { test, expect } from '@playwright/test';

test.describe('History Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock history data into localStorage before the app loads
    await page.addInitScript(() => {
      const storageKey = '__tab_out_e2e_storage__';
      const mockHistory = [
        {
          id: 'snap-1',
          capturedAt: new Date().toISOString(),
          tabCount: 5,
          products: [
            { productKey: 'github', label: 'GitHub', iconDomain: 'github.com', tabCount: 3 },
            { productKey: 'youtube', label: 'YouTube', iconDomain: 'youtube.com', tabCount: 2 }
          ],
          tabs: [
            { url: 'https://github.com/explore', title: 'Explore', domain: 'github.com', productKey: 'github', productLabel: 'GitHub', iconDomain: 'github.com', favIconUrl: '', capturedAt: new Date().toISOString() },
            { url: 'https://github.com/trending', title: 'Trending', domain: 'github.com', productKey: 'github', productLabel: 'GitHub', iconDomain: 'github.com', favIconUrl: '', capturedAt: new Date().toISOString() },
            { url: 'https://github.com/notifications', title: 'Notifications', domain: 'github.com', productKey: 'github', productLabel: 'GitHub', iconDomain: 'github.com', favIconUrl: '', capturedAt: new Date().toISOString() },
            { url: 'https://www.youtube.com/watch?v=test1', title: 'Test Video 1', domain: 'youtube.com', productKey: 'youtube', productLabel: 'YouTube', iconDomain: 'youtube.com', favIconUrl: '', capturedAt: new Date().toISOString() },
            { url: 'https://www.youtube.com/watch?v=test2', title: 'Test Video 2', domain: 'youtube.com', productKey: 'youtube', productLabel: 'YouTube', iconDomain: 'youtube.com', favIconUrl: '', capturedAt: new Date().toISOString() }
          ]
        }
      ];
      localStorage.setItem(storageKey, JSON.stringify({ history: mockHistory }));
    });

    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('opens history panel', async ({ page }) => {
    // Click history button (it's in the sidebar/settings area)
    const historyButton = page.getByRole('button', { name: 'History' });
    await historyButton.click();

    await expect(page.getByText('History', { exact: true })).toBeVisible();
    await expect(page.locator('.history-list')).toBeVisible();
  });

  test('displays injected snapshots', async ({ page }) => {
    const historyButton = page.getByRole('button', { name: 'History' });
    await historyButton.click();

    const historyList = page.locator('.history-list');
    await expect(page.getByText('5 tabs')).toBeVisible();
    await expect(historyList.getByRole('button', { name: 'Restore GitHub' })).toBeVisible();
    await expect(historyList.getByRole('button', { name: 'Restore YouTube' })).toBeVisible();
  });

  test('restore snapshot triggers action', async ({ page }) => {
    const historyButton = page.getByRole('button', { name: 'History' });
    await historyButton.click();

    const restoreButton = page.getByRole('button', { name: 'Restore all' });
    await expect(restoreButton).toBeVisible();
    await restoreButton.click();
    
    // Success state or UI feedback could be verified here
  });

  test('clear history works', async ({ page }) => {
    const historyButton = page.getByRole('button', { name: 'History' });
    await historyButton.click();

    const clearButton = page.getByRole('button', { name: 'Clear' });
    await clearButton.click();

    await expect(page.getByText('No history yet')).toBeVisible();
  });
});
