/**
 * Pure tab-sorting math for a single Chrome window.
 *
 * Real tabs are reordered only within the slot positions they already occupy, so
 * Chrome-internal/extension pages keep their relative positions. Pinned and unpinned
 * tabs are sorted independently because Chrome cannot place an unpinned tab before the
 * pinned block. Known products follow `productOrder`; unknown products stay at the end
 * in their original order.
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

  const moves: TabMove[] = [];
  // Sort the pinned and unpinned areas separately, each within its own existing slots.
  for (const pinned of [true, false]) {
    const area = tabs.filter((t) => t.pinned === pinned);
    if (area.length === 0) continue;

    const slots = area.map((t) => t.index).sort((a, b) => a - b);
    const sorted = sortArea(area, orderPos);
    sorted.forEach((t, i) => moves.push({ id: t.id, index: slots[i] }));
  }
  return moves;
}
