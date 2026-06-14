/**
 * Pure tab-sorting math for a single Chrome window.
 *
 * Only unpinned tabs are reordered, and only within the slot positions they already
 * occupy, so pinned tabs and Chrome-internal/extension pages keep their exact
 * positions. Pinned tabs are intentionally never moved — users arrange them
 * deliberately. Known products follow `productOrder`; unknown products stay at the
 * end in their original order.
 */

export interface SortableTab {
  id: number;
  /** Current absolute Chrome tab index within the window. */
  index: number;
  pinned: boolean;
  productKey: string;
}

export interface TabMove {
  id: number;
  index: number;
}

function sortArea(tabs: SortableTab[], orderPos: Map<string, number>): SortableTab[] {
  // Known products (finite position) sort ahead of unknown ones (Infinity); ties — and
  // unknown vs unknown — fall back to the original index so order stays deterministic.
  return [...tabs].sort((a, b) => {
    const posA = orderPos.get(a.productKey) ?? Infinity;
    const posB = orderPos.get(b.productKey) ?? Infinity;
    if (posA !== posB) return posA - posB;
    return a.index - b.index;
  });
}

export function computeWindowSortMoves(tabs: SortableTab[], productOrder: string[]): TabMove[] {
  const orderPos = new Map<string, number>();
  productOrder.forEach((key, i) => orderPos.set(key, i));

  // Reorder only unpinned tabs, within their own existing slots. Pinned tabs are
  // never moved, so they keep their exact positions.
  const area = tabs.filter((t) => !t.pinned);
  if (area.length === 0) return [];

  const slots = area.map((t) => t.index).sort((a, b) => a - b);
  const sorted = sortArea(area, orderPos);
  return sorted.map((t, i) => ({ id: t.id, index: slots[i] }));
}
