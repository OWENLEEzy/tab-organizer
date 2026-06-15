import { describe, it, expect, vi, beforeEach } from 'vitest';

// Order-tracking + collaborator mocks. The pure logic (computeOrganizePlan,
// groupTabsByProduct, duplicate detection, tab mapping) runs for real.
const m = vi.hoisted(() => {
  const calls: string[] = [];
  return {
    calls,
    queryAllTabs: vi.fn(),
    closeTabIds: vi.fn(() => { calls.push('close'); return Promise.resolve(); }),
    readStorage: vi.fn(),
    applyAssignmentUpdates: vi.fn(() => Promise.resolve()),
    protectRecoveryBeforeClosing: vi.fn(() => { calls.push('protect'); return Promise.resolve(); }),
    sortAndGroupTabs: vi.fn(() => Promise.resolve({ moveFailures: 0, groupFailures: 0 })),
  };
});

const {
  queryAllTabs, closeTabIds, readStorage,
  protectRecoveryBeforeClosing, sortAndGroupTabs, calls,
} = m;

vi.mock('../utils/chrome-tabs', () => ({ queryAllTabs: m.queryAllTabs, closeTabIds: m.closeTabIds }));
vi.mock('../utils/storage', () => ({ readStorage: m.readStorage, applyAssignmentUpdates: m.applyAssignmentUpdates }));
vi.mock('../utils/recovery-protect', () => ({ protectRecoveryBeforeClosing: m.protectRecoveryBeforeClosing }));
vi.mock('../utils/sort-and-group-tabs', () => ({ sortAndGroupTabs: m.sortAndGroupTabs }));

import { runOrganize } from '../popup/run-organize';

const STORAGE = {
  sections: [],
  sectionAssignments: [],
  unsectionedProductKeys: [],
  groupOrder: {},
  settings: { customGroups: [] },
};

// Two tabs with the same URL → one duplicate to close (keep the newer one).
const TABS = [
  { id: 1, url: 'https://a.com/x', title: 'A', windowId: 1, active: false, lastAccessed: 100 },
  { id: 2, url: 'https://a.com/x', title: 'A', windowId: 1, active: false, lastAccessed: 200 },
];

describe('runOrganize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    queryAllTabs.mockResolvedValue(TABS);
    readStorage.mockResolvedValue(STORAGE);
    sortAndGroupTabs.mockResolvedValue({ moveFailures: 0, groupFailures: 0 });
  });

  it('protects recovery BEFORE closing duplicates', async () => {
    await runOrganize();
    expect(protectRecoveryBeforeClosing).toHaveBeenCalledTimes(1);
    expect(closeTabIds).toHaveBeenCalledWith([1]);
    expect(calls).toEqual(['protect', 'close']);
  });

  it('reports success and the real closed count when everything works', async () => {
    const outcome = await runOrganize();
    expect(outcome.ok).toBe(true);
    expect(outcome.closedCount).toBe(1);
  });

  it('reports failure (ok=false) when sort/group reports failures', async () => {
    sortAndGroupTabs.mockResolvedValue({ moveFailures: 1, groupFailures: 0 });
    const outcome = await runOrganize();
    expect(outcome.ok).toBe(false);
  });

  it('reports failure (ok=false) when closing duplicates throws', async () => {
    closeTabIds.mockRejectedValueOnce(new Error('cannot close'));
    const outcome = await runOrganize();
    expect(outcome.ok).toBe(false);
  });

  it('reports real remaining counts from a FRESH post-close re-read', async () => {
    // First read (planning) sees both duplicates; the post-close re-read sees only
    // the kept tab. The remaining count must come from that fresh read — proving it
    // is not faked, and not just echoing the pre-close snapshot.
    queryAllTabs
      .mockReset()
      .mockResolvedValueOnce(TABS)        // planning read: 2 dup tabs
      .mockResolvedValueOnce([TABS[1]]);  // post-close read: 1 tab left

    const outcome = await runOrganize();

    expect(outcome.closedCount).toBe(1);
    expect(outcome.remainingDuplicates).toBe(0);
  });

  it('reflects duplicates still open when the close did not remove them', async () => {
    // Both reads return both tabs (e.g. close was a no-op): the honest count must
    // stay at 1, never silently reset to 0 just because organize ran.
    const outcome = await runOrganize();
    expect(outcome.remainingDuplicates).toBe(1);
  });
});
