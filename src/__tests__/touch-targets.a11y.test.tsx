import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchBar } from '../newtab/components/SearchBar';
import { DeferredItem } from '../newtab/components/DeferredItem';
import { NudgeBanner } from '../newtab/components/NudgeBanner';
import { UpdateBanner } from '../newtab/components/UpdateBanner';
import { SelectionBar } from '../newtab/components/SelectionBar';
import { TabChip } from '../newtab/components/TabChip';

function expectTouchHeight(element: HTMLElement): void {
  expect(element.className).toMatch(/\b(?:h-11|min-h-11)\b/);
}

function expectTouchWidth(element: HTMLElement): void {
  expect(element.className).toMatch(/\b(?:w-11|min-w-11)\b/);
}

describe('touch target regressions', () => {
  it('keeps the search field and clear button at accessible sizes', () => {
    render(<SearchBar value="docs" onChange={() => {}} resultCount={1} totalCount={4} />);

    expectTouchHeight(screen.getByRole('searchbox', { name: 'Search tabs' }));

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expectTouchHeight(clearButton);
    expectTouchWidth(clearButton);
  });

  it('keeps dismiss buttons large enough in banners and saved items', () => {
    const savedAt = new Date().toISOString();

    const { rerender } = render(
      <NudgeBanner tabCount={20} onDismiss={() => {}} />,
    );

    const nudgeDismiss = screen.getByRole('button', { name: 'Dismiss tab count warning' });
    expectTouchHeight(nudgeDismiss);
    expectTouchWidth(nudgeDismiss);

    rerender(<UpdateBanner version="1.2.3" onDismiss={() => {}} />);

    const updateDismiss = screen.getByRole('button', { name: 'Dismiss update notice' });
    expectTouchHeight(updateDismiss);
    expectTouchWidth(updateDismiss);

    rerender(
      <DeferredItem
        item={{
          id: 'saved-1',
          url: 'https://github.com/OWENLEEzy/tab-out',
          title: 'Tab Out repo',
          domain: 'github.com',
          savedAt,
          completed: false,
          dismissed: false,
        }}
        onCheckOff={() => {}}
        onDismiss={() => {}}
      />,
    );

    const dismissSaved = screen.getByRole('button', { name: 'Dismiss Tab Out repo' });
    expectTouchHeight(dismissSaved);
    expectTouchWidth(dismissSaved);
  });

  it('keeps floating action controls at accessible sizes', () => {
    const { rerender } = render(
      <SelectionBar count={2} onClose={() => {}} onSave={() => {}} onClear={() => {}} />,
    );

    expectTouchHeight(screen.getByRole('button', { name: 'Close' }));
    expectTouchHeight(screen.getByRole('button', { name: 'Save' }));
    expectTouchHeight(screen.getByRole('button', { name: 'Cancel' }));

    rerender(
      <TabChip
        url="https://github.com/OWENLEEzy/tab-out"
        title="Tab Out repo"
        duplicateCount={2}
        active
        onFocus={() => {}}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    const primaryButton = document.querySelector<HTMLButtonElement>('button[aria-current="page"]');
    expect(primaryButton).not.toBeNull();
    expectTouchHeight(primaryButton!);

    const saveButton = screen.getByRole('button', { name: /Save Tab Out repo for later/i });
    expectTouchHeight(saveButton);
    expectTouchWidth(saveButton);

    const closeButton = screen.getByRole('button', { name: /Close Tab Out repo/i });
    expectTouchHeight(closeButton);
    expectTouchWidth(closeButton);
  });
});
