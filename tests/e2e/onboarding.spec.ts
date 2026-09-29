import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // A first-run install: current schema, no sections, onboarding not done.
    // Seed once so a reload keeps whatever the dashboard persisted.
    await page.addInitScript(() => {
      if (sessionStorage.getItem('onboarding-seeded')) return;
      sessionStorage.setItem('onboarding-seeded', 'true');
      localStorage.setItem(
        '__tab_organizer_e2e_storage__',
        JSON.stringify({ schemaVersion: 6, sections: [] }),
      );
    });
    await page.goto('/tests/harness/e2e-harness.html');
  });

  test('offers section templates on first run and creates the confirmed ones', async ({ page }) => {
    await expect(page.getByText('Pick a few sections — the rules are yours')).toBeVisible();

    await page.getByRole('button', { name: /^Create these \d+$/ }).click();

    await expect(page.getByText('Pick a few sections — the rules are yours')).toBeHidden();
    await page.reload();
    await expect(page.locator('.rounded-card').first()).toBeVisible();
    await expect(page.getByText('Pick a few sections — the rules are yours')).toBeHidden();
  });

  test('starting empty dismisses onboarding for good', async ({ page }) => {
    await page.getByRole('button', { name: 'Start empty' }).click();

    await expect(page.getByText('Pick a few sections — the rules are yours')).toBeHidden();
    await page.reload();
    await expect(page.locator('.rounded-card').first()).toBeVisible();
    await expect(page.getByText('Pick a few sections — the rules are yours')).toBeHidden();
  });
});
