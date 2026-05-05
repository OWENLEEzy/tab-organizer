import { test, expect } from '@playwright/test';

type SelectionTestWindow = Window & {
  __test?: number;
  __clickLog?: Array<{ tag: string; metaKey: boolean }>;
};

test.describe('Selection Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('debug: verify metaKey is set on click event', async ({ page }) => {
    // Wait for app to fully render
    await page.waitForSelector('[data-tab-url]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Verify evaluate works at all
    const testVal = await page.evaluate(() => {
      const testWindow = window as SelectionTestWindow;
      testWindow.__test = 42;
      return testWindow.__test;
    });
    expect(testVal).toBe(42);

    // Install capture listener
    const installResult = await page.evaluate(() => {
      document.addEventListener('click', (e: MouseEvent) => {
        const testWindow = window as SelectionTestWindow;
        testWindow.__clickLog = testWindow.__clickLog || [];
        testWindow.__clickLog.push({ tag: (e.target as HTMLElement).tagName, metaKey: e.metaKey });
      }, true);
      return 'listener installed';
    });
    expect(installResult).toBe('listener installed');

    const chipCount = await page.locator('[data-tab-url]').count();
    expect(chipCount).toBeGreaterThan(0);

    const firstChip = page.locator('[data-tab-url]').first();
    const box = await firstChip.boundingBox();
    expect(box).not.toBeNull();

    // Check if page has iframes
    const frames = page.frames();
    expect(frames.length).toBeGreaterThan(0);

    // Try a simpler test: click without modifiers, see if click log fires
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(500);
    const plainClickLog = await page.evaluate(() => (window as SelectionTestWindow).__clickLog);
    expect(plainClickLog?.length).toBeGreaterThan(0);

    // Reset log
    await page.evaluate(() => {
      (window as SelectionTestWindow).__clickLog = [];
    });

    // Now with Meta modifier. Control-click can be interpreted as context-click on macOS.
    await page.keyboard.down('Meta');
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.keyboard.up('Meta');
    await page.waitForTimeout(500);
    const metaClickLog = await page.evaluate(() => (window as SelectionTestWindow).__clickLog);

    // Also check: did React state update? Check for selection ring
    const afterClasses = await firstChip.getAttribute('class');
    expect(afterClasses).toContain('bg-accent-blue/[0.12]');

    expect(metaClickLog?.length).toBeGreaterThan(0);
  });

  test('clicking tab chip selects it', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const firstChip = page.locator('[data-tab-url]').first();
    await firstChip.click({ modifiers: ['Meta'] });

    // Should have selection ring
    await expect(firstChip).toHaveClass(/bg-accent-blue\/\[0\.12\]/);
  });

  test('selection bar appears when tabs are selected', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const firstChip = page.locator('[data-tab-url]').first();

    // Click with Meta modifier
    await firstChip.click({ modifiers: ['Meta'] });

    // Wait a bit for React state to update
    await page.waitForTimeout(100);

    // Use more specific selector for selection bar (left-1/2 distinguishes from settings gear which uses right-5)
    const selectionBar = page.locator('.fixed.bottom-5.left-1\\/2');
    await expect(selectionBar).toBeVisible();
  });

  test('selection bar shows correct count', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const chips = page.locator('[data-tab-url]');
    const firstChip = chips.nth(0);
    const secondChip = chips.nth(1);

    await firstChip.click({ modifiers: ['Meta'] });
    await secondChip.click({ modifiers: ['Meta'] });

    const countText = page.locator('.fixed.bottom-5.left-1\\/2').locator('text=/selected/');
    await expect(countText).toContainText('2 selected');
  });

  test('cancel button clears selection', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const firstChip = page.locator('[data-tab-url]').first();
    await firstChip.click({ modifiers: ['Meta'] });

    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();

    // Selection bar should disappear
    const selectionBar = page.locator('.fixed.bottom-5.left-1\\/2');
    await expect(selectionBar).not.toBeVisible();

    // Chip should not be selected
    await expect(firstChip).not.toHaveClass(/bg-accent-blue\/\[0\.12\]/);
  });

  test('selection bar has correct z-index', async ({ page }) => {
    await page.waitForSelector('[data-tab-url]');

    const firstChip = page.locator('[data-tab-url]').first();
    await firstChip.click({ modifiers: ['Meta'] });

    const selectionBar = page.locator('.fixed.bottom-5.left-1\\/2');
    const zIndex = await selectionBar.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(60);
  });
});
