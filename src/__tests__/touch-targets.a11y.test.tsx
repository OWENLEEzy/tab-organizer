import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { SearchBar } from '../dashboard/components/search/SearchBar';
import { SelectionBar } from '../dashboard/components/tabs/SelectionBar';
import { TabChip } from '../dashboard/components/tabs/TabChip';
import { ActionButton } from '../dashboard/components/ui/ActionButton';

function expectTouchHeight(element: HTMLElement): void {
  const className = element.className;
  const valid =
    /\baction-button\b/.test(className) ||
    /h-\[var\(--spacing-button-height\)\]/.test(className) ||
    /min-h-\[var\(--spacing-button-height\)\]/.test(className) ||
    /size-\[var\(--spacing-button-height\)\]/.test(className) ||
    /h-\[var\(--spacing-button-icon\)\]/.test(className) ||
    /min-h-\[var\(--spacing-button-icon\)\]/.test(className) ||
    /size-\[var\(--spacing-button-icon\)\]/.test(className);
  expect(valid).toBe(true);
}

function expectTouchWidth(element: HTMLElement): void {
  const className = element.className;
  const valid =
    /w-\[var\(--spacing-button-height\)\]/.test(className) ||
    /min-w-\[var\(--spacing-button-height\)\]/.test(className) ||
    /size-\[var\(--spacing-button-height\)\]/.test(className) ||
    /w-\[var\(--spacing-button-icon\)\]/.test(className) ||
    /min-w-\[var\(--spacing-button-icon\)\]/.test(className) ||
    /size-\[var\(--spacing-button-icon\)\]/.test(className);
  expect(valid).toBe(true);
}

describe('touch target regressions', () => {
  it('keeps the search field and clear button at accessible sizes', () => {
    render(
      <I18nProvider>
        <SearchBar value="docs" onChange={() => {}} resultCount={1} totalCount={4} />
      </I18nProvider>,
    );

    expectTouchHeight(screen.getByRole('searchbox', { name: 'Search tabs' }));

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expectTouchHeight(clearButton);
    expectTouchWidth(clearButton);
  });

  it('keeps floating action controls at accessible sizes', () => {
    const { rerender } = render(
      <I18nProvider>
        <SelectionBar count={2} onClose={() => {}} onClear={() => {}} />
      </I18nProvider>,
    );

    expectTouchHeight(screen.getByRole('button', { name: 'Close' }));
    expectTouchHeight(screen.getByRole('button', { name: 'Cancel' }));

    rerender(
      <I18nProvider>
        <TabChip
          url="https://github.com/OWENLEEzy/tab-out"
          title="Tab Organizer repo"
          duplicateCount={2}
          isLastUsed
          onFocus={() => {}}
          onClose={() => {}}
        />
      </I18nProvider>,
    );

    const primaryButton = document.querySelector<HTMLButtonElement>('button[aria-current="page"]');
    expect(primaryButton).not.toBeNull();
    expectTouchHeight(primaryButton!);

    const closeButton = screen.getByRole('button', { name: /Close Tab Organizer repo/i });
    expectTouchHeight(closeButton);
    expectTouchWidth(closeButton);
  });

  it('keeps shared dashboard action buttons at accessible sizes', () => {
    render(<ActionButton onClick={() => {}}>Close all</ActionButton>);

    const button = screen.getByRole('button', { name: 'Close all' });
    expectTouchHeight(button);
  });
});