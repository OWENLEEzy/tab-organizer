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
        theme="system"
        soundEnabled
        confettiEnabled
        customGroups={[]}
        onSetTheme={() => {}}
        onToggleSound={() => {}}
        onToggleConfetti={() => {}}
        onResetSortOrder={() => {}}
        onAddCustomGroup={() => {}}
        onRemoveCustomGroup={() => {}}
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

    const closeButton = screen.getByRole('button', { name: 'Close settings' });
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    // The last focusable is the 'Add rule' button (after hostname input, label input)
    expect(screen.getByRole('button', { name: 'Add rule' })).toHaveFocus();

    await user.keyboard('{Tab}');
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(openButton).toHaveFocus();
  });

  it('has no obvious axe violations when open', async () => {
    const { container } = render(
      <SettingsPanel
        open
        onClose={() => {}}
        theme="system"
        soundEnabled
        confettiEnabled
        customGroups={[]}
        onSetTheme={() => {}}
        onToggleSound={() => {}}
        onToggleConfetti={() => {}}
        onResetSortOrder={() => {}}
        onAddCustomGroup={() => {}}
        onRemoveCustomGroup={() => {}}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
