import { afterEach, describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { ProductGroupCard } from '../dashboard/components/product-groups/ProductGroupCard';
import { ProductGroupTable } from '../dashboard/components/product-groups/ProductGroupTable';
import { getProductKey } from '../lib/product-key';
import { toProductItemId } from '../lib/section-organizer';
import type { Section, Tab, TabGroup } from '../types';

const SECTIONS: Section[] = [
  { id: 'dev', name: 'Dev', order: 0, emoji: '💻' },
  { id: 'design', name: 'Design', order: 1, emoji: '🎨' },
];

afterEach(() => {
  cleanup();
});

function makeTab(overrides: Partial<Tab> & Pick<Tab, 'url'>): Tab {
  return {
    id: 1,
    title: 'GitHub',
    favIconUrl: '',
    domain: 'github.com',
    windowId: 1,
    active: false,
    isDashboard: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    ...overrides,
  };
}

function makeGroup(): TabGroup {
  return {
    id: 'github.com',
    domain: 'github.com',
    friendlyName: 'GitHub',
    itemType: 'product',
    itemKey: 'github.com',
    productKey: 'github.com',
    iconDomain: 'github.com',
    tabs: [makeTab({ id: 1, url: 'https://github.com/a' })],
    collapsed: false,
    order: 0,
    color: '#4DAB9A',
    hasDuplicates: false,
    duplicateCount: 0,
  };
}

describe('pinned-unsectioned badge', () => {
  it('Cards view: renders the pinned badge and unpin action for a pinned product', () => {
    const group = makeGroup();
    const productKey = getProductKey(group);
    const onUnpinProduct = vi.fn();

    render(
      <I18nProvider>
        <ProductGroupCard
          group={group}
          onCloseProductGroup={() => {}}
          onCloseDuplicates={() => {}}
          onCloseTab={() => {}}
          onFocusTab={() => {}}
          pinnedProductKeys={new Set([productKey])}
          onUnpinProduct={() => onUnpinProduct(productKey)}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Pinned')).toBeInTheDocument();

    const unpinButton = screen.getByRole('button', { name: 'Unpin GitHub' });
    fireEvent.click(unpinButton);
    expect(onUnpinProduct).toHaveBeenCalledWith(productKey);
  });

  it('Cards view: does not render the badge for a group that was never pinned', () => {
    const group = makeGroup();

    render(
      <I18nProvider>
        <ProductGroupCard
          group={group}
          onCloseProductGroup={() => {}}
          onCloseDuplicates={() => {}}
          onCloseTab={() => {}}
          onFocusTab={() => {}}
          pinnedProductKeys={new Set()}
          onUnpinProduct={() => {}}
        />
      </I18nProvider>,
    );

    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
  });

  it('Table view: renders the badge next to the select, and the select is untouched', () => {
    const group = makeGroup();
    const productKey = getProductKey(group);
    const onUnpinProduct = vi.fn();

    render(
      <I18nProvider>
        <ProductGroupTable
          items={[group]}
          sections={SECTIONS}
          assignmentByItemId={new Map()}
          onMoveItem={() => {}}
          onCloseProduct={() => {}}
          onCloseDuplicates={() => {}}
          onFocusTab={() => {}}
          pinnedProductKeys={new Set([productKey])}
          onUnpinProduct={onUnpinProduct}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Pinned')).toBeInTheDocument();

    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getAllByRole('option').map((o) => o.textContent))
      .toEqual(['Unsorted', 'Dev', 'Design']);

    const unpinButton = screen.getByRole('button', { name: 'Unpin GitHub' });
    fireEvent.click(unpinButton);
    expect(onUnpinProduct).toHaveBeenCalledWith(productKey);
  });

  it('Cards view: an explicit assignment beats a stale pin — the badge must not claim pinned for a group that is actually in a section', () => {
    // resolveMembership's priority is assigned > pinned > auto (section-membership.ts).
    // A productKey can end up in both pinnedProductKeys and currentSectionId (e.g. a
    // stale unsectionedProductKeys entry from an import); the badge must defer to the
    // real assignment, not to raw pin-set membership.
    const group = makeGroup();
    const productKey = getProductKey(group);

    render(
      <I18nProvider>
        <ProductGroupCard
          group={group}
          onCloseProductGroup={() => {}}
          onCloseDuplicates={() => {}}
          onCloseTab={() => {}}
          onFocusTab={() => {}}
          currentSectionId="dev"
          pinnedProductKeys={new Set([productKey])}
          onUnpinProduct={() => {}}
        />
      </I18nProvider>,
    );

    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
  });

  it('Table view: an explicit assignment beats a stale pin — the badge must not claim pinned for an assigned row', () => {
    const group = makeGroup();
    const productKey = getProductKey(group);

    render(
      <I18nProvider>
        <ProductGroupTable
          items={[group]}
          sections={SECTIONS}
          assignmentByItemId={new Map([[toProductItemId(productKey), 'dev']])}
          onMoveItem={() => {}}
          onCloseProduct={() => {}}
          onCloseDuplicates={() => {}}
          onFocusTab={() => {}}
          pinnedProductKeys={new Set([productKey])}
          onUnpinProduct={() => {}}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('combobox')).toHaveValue('dev');
    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
  });

  describe('focus after unpinning', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('Cards view: focus moves to the card\'s move button instead of dropping to the page', () => {
      vi.useFakeTimers();
      const group = makeGroup();
      const productKey = getProductKey(group);
      const card = (pinned: ReadonlySet<string>) => (
        <I18nProvider>
          <ProductGroupCard
            group={group}
            onCloseProductGroup={() => {}}
            onCloseDuplicates={() => {}}
            onCloseTab={() => {}}
            onFocusTab={() => {}}
            sections={SECTIONS}
            currentSectionId={null}
            onMoveToSection={() => {}}
            onMoveToNoSection={() => {}}
            pinnedProductKeys={pinned}
            onUnpinProduct={() => {}}
          />
        </I18nProvider>
      );
      const { rerender } = render(card(new Set([productKey])));
      screen.getByRole('button', { name: 'Unpin GitHub' }).focus();

      rerender(card(new Set()));
      act(() => { vi.advanceTimersByTime(1000); });

      expect(document.activeElement).toBe(screen.getByRole('button', { name: /Move GitHub to a section/ }));
    });

    it('Table view: focus moves to the row\'s section select', () => {
      vi.useFakeTimers();
      const group = makeGroup();
      const productKey = getProductKey(group);
      const table = (pinned: ReadonlySet<string>) => (
        <I18nProvider>
          <ProductGroupTable
            items={[group]}
            sections={SECTIONS}
            assignmentByItemId={new Map()}
            onMoveItem={() => {}}
            onCloseProduct={() => {}}
            onCloseDuplicates={() => {}}
            onFocusTab={() => {}}
            pinnedProductKeys={pinned}
            onUnpinProduct={() => {}}
          />
        </I18nProvider>
      );
      const { rerender } = render(table(new Set([productKey])));
      screen.getByRole('button', { name: 'Unpin GitHub' }).focus();

      rerender(table(new Set()));
      act(() => { vi.advanceTimersByTime(1000); });

      expect(document.activeElement).toBe(screen.getByRole('combobox'));
    });
  });
});

