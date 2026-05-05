import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabChip } from '../newtab/components/TabChip';

afterEach(() => {
  cleanup();
});

describe('TabChip selection mode', () => {
  it('toggles selection instead of navigating on plain click when selection mode is active', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onChipClick = vi.fn();

    render(
      <TabChip
        url="https://github.com/OWENLEEzy/tab-out"
        title="Tab Out repo"
        duplicateCount={2}
        selectionMode
        onFocus={onFocus}
        onClose={() => {}}
        onSave={() => {}}
        onChipClick={onChipClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Tab Out repo/ }));

    expect(onChipClick).toHaveBeenCalledTimes(1);
    expect(onFocus).not.toHaveBeenCalled();
  });
});
