import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TabChip } from '../dashboard/components/tabs/TabChip';

afterEach(() => {
  cleanup();
});

const base = {
  url: 'https://example.com/page',
  title: 'Example Page',
  duplicateCount: 0,
  onFocus: () => {},
  onClose: () => {},
};

describe('TabChip last-used marker', () => {
  it('marks the chip as current when it is the globally last-used tab', () => {
    render(<TabChip {...base} isLastUsed />);
    const chip = screen.getByRole('button', { name: /^Example Page/ });
    expect(chip).toHaveAttribute('aria-current', 'page');
    expect(chip.className).toContain('tab-active');
  });

  it('does not mark the chip when it is not the last-used tab', () => {
    render(<TabChip {...base} />);
    const chip = screen.getByRole('button', { name: /^Example Page/ });
    expect(chip).not.toHaveAttribute('aria-current');
    expect(chip.className).not.toContain('tab-active');
  });
});
