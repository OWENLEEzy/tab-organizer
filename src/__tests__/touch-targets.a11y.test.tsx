import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchBar } from '../newtab/components/SearchBar';
import { NudgeBanner } from '../newtab/components/NudgeBanner';
import { UpdateBanner } from '../newtab/components/UpdateBanner';
import { SelectionBar } from '../newtab/components/SelectionBar';
import { TabChip } from '../newtab/components/TabChip';
import { ActionButton } from '../newtab/components/ui/ActionButton';

function expectTouchHeight(element: HTMLElement): void {
  // Accept hardcoded h-11/min-h-11, CSS token variants, or shared global button class.
  const className = element.className;
  const valid =
    /\baction-button\b/.test(className) ||
    /\bh-11\b/.test(className) ||
    /\bmin-h-11\b/.test(className) ||
    /\bsize-11\b/.test(className) ||
    /h-\[--spacing-button-height\]/.test(className) ||
    /min-h-\[--spacing-button-height\]/.test(className) ||
    /size-\[--spacing-button-height\]/.test(className) ||
    /h-\[--spacing-button-icon\]/.test(className) ||
    /min-h-\[--spacing-button-icon\]/.test(className) ||
    /size-\[--spacing-button-icon\]/.test(className);
  expect(valid).toBe(true);
}

function expectTouchWidth(element: HTMLElement): void {
  // Accept hardcoded w-11/min-w-11 or CSS token variants (44px)
  const className = element.className;
  const valid =
    /\bw-11\b/.test(className) ||
    /\bmin-w-11\b/.test(className) ||
    /\bsize-11\b/.test(className) ||
    /w-\[--spacing-button-height\]/.test(className) ||
    /min-w-\[--spacing-button-height\]/.test(className) ||
    /size-\[--spacing-button-height\]/.test(className) ||
    /w-\[--spacing-button-icon\]/.test(className) ||
    /min-w-\[--spacing-button-icon\]/.test(className) ||
    /size-\[--spacing-button-icon\]/.test(className);
  expect(valid).toBe(true);
}

describe('touch target regressions', () => {
  it('keeps the search field and clear button at accessible sizes', () => {
    render(<SearchBar value="docs" onChange={() => {}} resultCount={1} totalCount={4} />);

    expectTouchHeight(screen.getByRole('searchbox', { name: 'Search tabs' }));

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expectTouchHeight(clearButton);
    expectTouchWidth(clearButton);
  });

  it('keeps dismiss buttons large enough in banners', () => {
    const { rerender } = render(
      <NudgeBanner tabCount={20} onDismiss={() => {}} />,
    );

    const nudgeDismiss = screen.getByRole('button', { name: 'Dismiss' });
    expectTouchHeight(nudgeDismiss);
    expectTouchWidth(nudgeDismiss);

    rerender(<UpdateBanner version="1.2.3" onDismiss={() => {}} />);

    const updateDismiss = screen.getByRole('button', { name: 'Dismiss update notice' });
    expectTouchHeight(updateDismiss);
    expectTouchWidth(updateDismiss);
  });

  it('keeps floating action controls at accessible sizes', () => {
    const { rerender } = render(
      <SelectionBar count={2} onClose={() => {}} onClear={() => {}} />,
    );

    expectTouchHeight(screen.getByRole('button', { name: 'Close' }));
    expectTouchHeight(screen.getByRole('button', { name: 'Cancel' }));

    rerender(
      <TabChip
        url="https://github.com/OWENLEEzy/tab-out"
        title="Tab Out repo"
        duplicateCount={2}
        active
        onFocus={() => {}}
        onClose={() => {}}
      />,
    );

    const primaryButton = document.querySelector<HTMLButtonElement>('button[aria-current="page"]');
    expect(primaryButton).not.toBeNull();
    expectTouchHeight(primaryButton!);

    const closeButton = screen.getByRole('button', { name: /Close Tab Out repo/i });
    expectTouchHeight(closeButton);
    expectTouchWidth(closeButton);
  });

  it('keeps shared dashboard action buttons at accessible sizes', () => {
    render(<ActionButton onClick={() => {}}>Close all</ActionButton>);

    const button = screen.getByRole('button', { name: 'Close all' });
    expectTouchHeight(button);
  });
});
