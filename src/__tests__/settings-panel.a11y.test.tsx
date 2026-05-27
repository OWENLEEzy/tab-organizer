import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { SettingsPanel } from '../newtab/components/SettingsPanel';

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
        onCreateGroup={() => {}}
      />
    </>
  );
}

describe('SettingsPanel accessibility', () => {
  it('moves focus into the dialog, traps tab navigation, and restores focus on close', async () => {
    const user = userEvent.setup();

    render(<SettingsHarness />);

    const openButton = screen.getByRole('button', { name: 'Open settings' });
    openButton.focus();

    await user.click(openButton);

    const generalTabButton = screen.getByRole('button', { name: 'General' });
    expect(generalTabButton).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    // The last focusable in General tab (default active tab) is the 'Reset Order' button
    expect(screen.getByRole('button', { name: 'Reset Order' })).toHaveFocus();

    await user.keyboard('{Tab}');
    expect(generalTabButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(openButton).toHaveFocus();
  });

  it('has no obvious axe violations when open', async () => {
    const { container } = render(
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
        onCreateGroup={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
