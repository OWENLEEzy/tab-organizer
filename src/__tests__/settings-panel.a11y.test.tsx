import React, { useState } from 'react';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { SettingsPanel } from '../dashboard/components/settings/SettingsPanel';
import type { Section, TabGroup } from '../types';

afterEach(() => {
  cleanup();
});

const SECTIONS: Section[] = [
  { id: 'dev', name: 'Dev', order: 0, emoji: '💻', autoRules: [{ kind: 'keyword', value: 'github' }] },
];

const PRODUCTS: TabGroup[] = [{
  id: 'github', domain: 'github', friendlyName: 'GitHub', productKey: 'github',
  tabs: [{
    id: 1, url: 'https://github.com/', title: 'GitHub', favIconUrl: '', domain: 'github.com',
    windowId: 1, active: false, isDashboard: false, isDuplicate: false, isLandingPage: false, duplicateCount: 0,
  }],
  collapsed: false, order: 0, color: '#000', hasDuplicates: false, duplicateCount: 0,
}];

function SettingsHarness({ initiallyOpen = false }: { initiallyOpen?: boolean }): React.ReactElement {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open settings
      </button>
      <SettingsPanel
        open={open}
        onClose={() => setOpen(false)}
        theme="clay"
        language="system"
        soundEnabled
        confettiEnabled
        productLabels={{}}
        customGroups={[{ hostnameEndsWith: '.substack.com', groupKey: 'substack', groupLabel: "Author's Substack" }]}
        onRemoveCustomGroup={() => {}}
        onSetTheme={() => {}}
        onSetLanguage={() => {}}
        onToggleSound={() => {}}
        onToggleConfetti={() => {}}
        onResetSortOrder={() => {}}
        onRenameProductGroup={() => {}}
        onRevertProductGroup={() => {}}
        maxChipsVisible={8}
        staleThresholdDays={3}
        onSetMaxChipsVisible={() => {}}
        onSetStaleThresholdDays={() => {}}
        onExportSettings={() => {}}
        onImportSettings={async () => {}}
        onCreateSection={() => {}}
        sections={SECTIONS}
        products={PRODUCTS}
        productCountBySectionId={new Map([['dev', 1]])}
        appVersion="2.0.0-test"
        viewMode="cards"
        onViewModeChange={() => {}}
      />
    </>
  );
}

describe('SettingsPanel accessibility', () => {
  it('moves focus into the dialog, traps tab navigation, and restores focus on close', async () => {
    const user = userEvent.setup();

    render(<I18nProvider><SettingsHarness /></I18nProvider>);

    const openButton = screen.getByRole('button', { name: 'Open settings' });
    openButton.focus();

    await user.click(openButton);

    const appearanceNavButton = screen.getByRole('button', { name: 'Appearance' });
    expect(appearanceNavButton).toHaveFocus();
    expect(appearanceNavButton).toHaveAttribute('aria-current', 'page');

    const behaviorNavButton = screen.getByRole('button', { name: 'Behavior' });
    expect(behaviorNavButton).not.toHaveAttribute('aria-current');

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    // The last focusable on the Appearance page (default active page) is the max-chips select
    expect(screen.getByRole('combobox', { name: 'Maximum visible tabs per product' })).toHaveFocus();

    await user.keyboard('{Tab}');
    expect(appearanceNavButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(openButton).toHaveFocus();
  });

  it('exposes the nav groups as accessible groups with correct accessible names', async () => {
    const user = userEvent.setup();

    render(<I18nProvider><SettingsHarness /></I18nProvider>);

    await user.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByRole('group', { name: 'Preferences' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Customize' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'About' })).toBeInTheDocument();

    const preferencesGroup = screen.getByRole('group', { name: 'Preferences' });
    expect(within(preferencesGroup).getByRole('button', { name: 'Appearance' })).toBeInTheDocument();
    expect(within(preferencesGroup).getByRole('button', { name: 'Behavior' })).toBeInTheDocument();
    expect(within(preferencesGroup).getByRole('button', { name: 'Shortcuts' })).toBeInTheDocument();
  });

  it('has no obvious axe violations when open', async () => {
    const { container } = render(
      <I18nProvider>
      <SettingsPanel
        open
        onClose={() => {}}
        theme="clay"
        language="system"
        soundEnabled
        confettiEnabled
        productLabels={{}}
        customGroups={[{ hostnameEndsWith: '.substack.com', groupKey: 'substack', groupLabel: "Author's Substack" }]}
        onRemoveCustomGroup={() => {}}
        onSetTheme={() => {}}
        onSetLanguage={() => {}}
        onToggleSound={() => {}}
        onToggleConfetti={() => {}}
        onResetSortOrder={() => {}}
        onRenameProductGroup={() => {}}
        onRevertProductGroup={() => {}}
        maxChipsVisible={8}
        staleThresholdDays={3}
        onSetMaxChipsVisible={() => {}}
        onSetStaleThresholdDays={() => {}}
        onExportSettings={() => {}}
        onImportSettings={async () => {}}
        onCreateSection={() => {}}
        appVersion="2.0.0-test"
        viewMode="cards"
        onViewModeChange={() => {}}
      />
      </I18nProvider>
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it.each([
    ['Sections & Rules'],
    ['Product Group Rules'],
    ['Backup & Version'],
  ])('has no obvious axe violations on the %s page', async (pageName) => {
    const user = userEvent.setup();
    const { container } = render(<I18nProvider><SettingsHarness initiallyOpen /></I18nProvider>);

    await user.click(screen.getByRole('button', { name: pageName }));

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('lets Escape cancel a product-group rename without closing the whole panel', async () => {
    const user = userEvent.setup();
    render(<I18nProvider><SettingsHarness initiallyOpen /></I18nProvider>);

    await user.click(screen.getByRole('button', { name: 'Product Group Rules' }));
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Rename' })).not.toBeInTheDocument();
  });
});
