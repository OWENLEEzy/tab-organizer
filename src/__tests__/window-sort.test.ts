import { describe, it, expect } from 'vitest';
import { computeWindowSortMoves } from '../lib/window-sort';
import type { SortableTab } from '../lib/window-sort';

function tab(id: number, index: number, productKey: string, pinned = false): SortableTab {
  return { id, index, productKey, pinned };
}

describe('computeWindowSortMoves', () => {
  it('reorders unpinned tabs within their existing slots by product order', () => {
    // Slots occupied: indices 0,1,2. Desired order: b, a, c.
    const tabs = [tab(1, 0, 'a'), tab(2, 1, 'b'), tab(3, 2, 'c')];
    const moves = computeWindowSortMoves(tabs, ['b', 'a', 'c']);
    expect(moves).toEqual([
      { id: 2, index: 0 }, // b → first slot
      { id: 1, index: 1 }, // a → second slot
      { id: 3, index: 2 }, // c → third slot
    ]);
  });

  it('never moves an unpinned tab into a pinned slot (C1 regression)', () => {
    // Pinned P at index 0; unpinned A,B,C at 1,2,3. Desired order B,A,C.
    const tabs = [
      tab(99, 0, 'pinnedProd', true),
      tab(1, 1, 'a'),
      tab(2, 2, 'b'),
      tab(3, 3, 'c'),
    ];
    const moves = computeWindowSortMoves(tabs, ['b', 'a', 'c']);
    // Pinned area (1 tab) stays at slot 0. Unpinned area uses slots [1,2,3] only.
    expect(moves).toEqual([
      { id: 99, index: 0 }, // pinned stays in its own slot
      { id: 2, index: 1 },  // b → first unpinned slot (1), NOT 0
      { id: 1, index: 2 },  // a
      { id: 3, index: 3 },  // c
    ]);
  });

  it('sorts pinned tabs independently from unpinned tabs', () => {
    const tabs = [
      tab(10, 0, 'a', true),
      tab(11, 1, 'b', true),
      tab(20, 2, 'a'),
      tab(21, 3, 'b'),
    ];
    const moves = computeWindowSortMoves(tabs, ['b', 'a']);
    // Pinned slots [0,1] reordered b,a → 11→0, 10→1.
    // Unpinned slots [2,3] reordered b,a → 21→2, 20→3.
    expect(moves).toEqual([
      { id: 11, index: 0 },
      { id: 10, index: 1 },
      { id: 21, index: 2 },
      { id: 20, index: 3 },
    ]);
  });

  it('keeps unknown products at the end in original order', () => {
    const tabs = [tab(1, 0, 'unknown1'), tab(2, 1, 'known'), tab(3, 2, 'unknown2')];
    const moves = computeWindowSortMoves(tabs, ['known']);
    expect(moves).toEqual([
      { id: 2, index: 0 }, // known first
      { id: 1, index: 1 }, // unknown1 (original order preserved)
      { id: 3, index: 2 }, // unknown2
    ]);
  });

  it('preserves non-contiguous real-tab slots (internal pages keep their gaps)', () => {
    // Real tabs sit at indices 1 and 3 (a chrome:// page occupies 0 and 2 conceptually).
    const tabs = [tab(1, 1, 'a'), tab(2, 3, 'b')];
    const moves = computeWindowSortMoves(tabs, ['b', 'a']);
    // Slots are [1,3]; reordered b,a → b→1, a→3.
    expect(moves).toEqual([
      { id: 2, index: 1 },
      { id: 1, index: 3 },
    ]);
  });

  it('returns no moves for an empty window', () => {
    expect(computeWindowSortMoves([], ['a'])).toEqual([]);
  });

  it('breaks product-order ties by original index', () => {
    // Two tabs of the same product keep their relative order.
    const tabs = [tab(1, 0, 'a'), tab(2, 1, 'a')];
    const moves = computeWindowSortMoves(tabs, ['a']);
    expect(moves).toEqual([
      { id: 1, index: 0 },
      { id: 2, index: 1 },
    ]);
  });
});
