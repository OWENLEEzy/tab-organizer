import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TabChip } from '../newtab/components/tabs/TabChip';

afterEach(() => {
  cleanup();
});

describe('TabChip selection mode', () => {
  it('toggles selection instead of navigating on plain click when selection mode is active', async () => {
    const onFocus = vi.fn();
    const onChipClick = vi.fn();

    render(
      <TabChip
        url="https://github.com/OWENLEEzy/tab-out"
        title="Tab Organizer repo"
        duplicateCount={2}
        selectionMode
        onFocus={onFocus}
        onClose={() => {}}
        onChipClick={onChipClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Tab Organizer repo/ }));

    expect(onChipClick).toHaveBeenCalledTimes(1);
    expect(onFocus).not.toHaveBeenCalled();
  });
});
