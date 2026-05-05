import { test, expect } from '@playwright/test';

test.describe('Settings & Theme', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport size to ensure the settings gear is visible
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/e2e-harness.html');
  });

  test('settings gear button exists in DOM', async ({ page }) => {
    // First check if the button exists in the DOM at all
    const settingsGearCount = await page.locator('button[aria-label="Settings"]').count();
    expect(settingsGearCount).toBeGreaterThan(0);
  });

  test('settings gear button is visible', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    // Check computed styles to debug visibility
    const styles = await settingsGear.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        width: computed.width,
        height: computed.height,
        zIndex: computed.zIndex,
      };
    });
    // The button should have visible dimensions
    expect(parseInt(styles.width)).toBeGreaterThan(0);
    expect(parseInt(styles.height)).toBeGreaterThan(0);

    await expect(settingsGear).toBeVisible();
  });

  test('settings gear has correct z-index', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await expect(settingsGear).toBeVisible();

    const zIndex = await settingsGear.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    expect(parseInt(zIndex)).toBe(40);
  });

  test('clicking settings gear opens panel', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('dialog has backdrop', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    const backdrop = page.locator('.fixed.inset-0').first();
    await expect(backdrop).toBeVisible();
  });

  test('escape closes dialog', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    await page.keyboard.press('Escape');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).not.toBeVisible();
  });

  test('clicking backdrop closes dialog', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    const backdrop = page.locator('.fixed.inset-0').first();
    await backdrop.click({ position: { x: 10, y: 10 } });

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).not.toBeVisible();
  });

  test('dialog contains theme switcher', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    const themeSection = page.locator('text=Theme');
    await expect(themeSection).toBeVisible();
  });

  test('dialog contains sound toggle', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    const soundToggle = page.locator('text=Sound').or(page.locator('text=/sound/i'));
    await expect(soundToggle).toBeVisible();
  });

  test('dialog contains confetti toggle', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    const confettiToggle = page.locator('text=Confetti').or(page.locator('text=/confetti/i'));
    await expect(confettiToggle).toBeVisible();
  });

  test('focus stays in dialog (focus trap)', async ({ page }) => {
    const settingsGear = page.getByRole('button', { name: 'Settings', exact: true });
    await settingsGear.click();

    // Get all focusable elements in dialog
    const focusableElements = await page.locator('[role="dialog"]').locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();

    if (focusableElements.length > 0) {
      // Press Tab multiple times - focus should stay within dialog
      for (let i = 0; i < focusableElements.length + 2; i++) {
        await page.keyboard.press('Tab');
      }

      // Settings gear should not be focused
      await expect(settingsGear).not.toBeFocused();
    }
  });
});
