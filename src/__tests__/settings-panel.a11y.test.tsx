import React, { useState } from 'react';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { SettingsPanel } from '../dashboard/components/settings/SettingsPanel';

afterEach(() => {
  cleanup();
});

function SettingsHarness(): React.ReactElement {
  const [open, setOpen] = useState(false);

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
        customGroups={[]}
        onSetTheme={() => {}}
        onSetLanguage={() => {}}
        onToggleSound={() => {}}
        onToggleConfetti={() => {}}
        onResetSortOrder={() => {}}
        onAddCustomGroup={() => {}}
        onRemoveCustomGroup={() => {}}
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
        customGroups={[]}
        onSetTheme={() => {}}
        onSetLanguage={() => {}}
        onToggleSound={() => {}}
        onToggleConfetti={() => {}}
        onResetSortOrder={() => {}}
        onAddCustomGroup={() => {}}
        onRemoveCustomGroup={() => {}}
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
});
