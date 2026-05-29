import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { DomainCard } from '../dashboard/components/tabs/DomainCard';
import { TabChip } from '../dashboard/components/tabs/TabChip';
import type { Tab, TabGroup } from '../types';

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

  it('updates memoized tab chips when selection and closing state changes', () => {
    const props = {
      url: 'https://github.com/OWENLEEzy/tab-out',
      title: 'Tab Organizer repo',
      duplicateCount: 1,
      onFocus: () => {},
      onClose: () => {},
    };
    const { rerender } = render(<TabChip {...props} />);
    const chip = screen.getByRole('button', { name: /^Tab Organizer repo/ });

    expect(chip.className).not.toContain('bg-accent-primary/[0.12]');

    rerender(<TabChip {...props} isSelected />);
    expect(chip.className).toContain('bg-accent-primary/[0.12]');

    rerender(<TabChip {...props} isClosing />);
    expect(chip.closest('.group')?.className).toContain('chip-closing');
  });

  it('updates memoized domain cards when chip selection changes', () => {
    const tab: Tab = {
      id: 1,
      url: 'https://example.com/page',
      title: 'Example Page',
      favIconUrl: '',
      domain: 'example.com',
      windowId: 1,
      active: false,
      isDashboard: false,
      isDuplicate: false,
      isLandingPage: false,
      duplicateCount: 0,
    };
    const group: TabGroup = {
      id: 'example.com',
      domain: 'example.com',
      friendlyName: 'Example',
      itemType: 'product',
      itemKey: 'example.com',
      productKey: 'example.com',
      tabs: [tab],
      collapsed: false,
      order: 0,
      color: '#4DAB9A',
      hasDuplicates: false,
      duplicateCount: 0,
    };
    const props = {
      group,
      onCloseDomain: () => {},
      onCloseDuplicates: () => {},
      onCloseTab: () => {},
      onFocusTab: () => {},
    };

    const { rerender } = render(
      <I18nProvider>
        <DomainCard {...props} selectedUrls={new Set()} />
      </I18nProvider>,
    );
    const chip = screen.getByRole('button', { name: /^Example Page/ });

    expect(chip.className).not.toContain('bg-accent-primary/[0.12]');

    rerender(
      <I18nProvider>
        <DomainCard {...props} selectedUrls={new Set([tab.url])} />
      </I18nProvider>,
    );

    expect(chip.className).toContain('bg-accent-primary/[0.12]');
  });
});
