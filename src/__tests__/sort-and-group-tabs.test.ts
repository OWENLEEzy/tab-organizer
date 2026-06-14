import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TabGroup } from '../types';
import type { ProductSectionRef } from '../lib/section-grouping';

vi.mock('../utils/storage', () => ({
  readStorage: vi.fn(() => Promise.resolve({ settings: { customGroups: [] } })),
}));

import { sortAndGroupTabs } from '../utils/sort-and-group-tabs';

// Unknown domains so productForHostname keeps the full registrable domain as the
// productKey — i.e. productKey === hostname, keeping fixtures unambiguous.
function group(hostname: string, friendlyName: string): TabGroup {
  return {
    id: hostname, domain: hostname, friendlyName,
    productKey: hostname, itemKey: hostname, iconDomain: hostname,
    tabs: [], collapsed: false, order: 0, color: '#000', hasDuplicates: false, duplicateCount: 0,
  };
}

function chromeTab(id: number, hostname: string, index: number, windowId = 1, pinned = false): chrome.tabs.Tab {
  return {
    id, url: `https://${hostname}/`, title: hostname, windowId, index, pinned,
    highlighted: false, active: false, incognito: false, selected: false,
    discarded: false, autoDiscardable: true, groupId: -1, frozen: false,
  };
}

/** Section lookup helper: every listed product → the same section ref. */
function inSection(sectionId: string, name: string, productKeys: string[], emoji?: string) {
  const ref: ProductSectionRef = { sectionId, name, emoji };
  return new Map(productKeys.map((k) => [k, ref]));
}

const chromeMock = {
  tabs: { query: vi.fn(), move: vi.fn(), group: vi.fn() },
  tabGroups: { update: vi.fn() },
};

describe('sortAndGroupTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('chrome', chromeMock);
    chromeMock.tabs.move.mockResolvedValue({});
    chromeMock.tabs.group.mockResolvedValue(7);
    chromeMock.tabGroups.update.mockResolvedValue({});
  });

  it('sorts real tabs into product order within their existing slots', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'beta.dev', 1),
    ]);
    // Desired order: beta first, then alpha.
    await sortAndGroupTabs([group('beta.dev', 'Beta'), group('alpha.io', 'Alpha')]);
    const moves = chromeMock.tabs.move.mock.calls.map((c) => ({ id: c[0], index: c[1].index }));
    expect(moves).toContainEqual({ id: 2, index: 0 }); // beta → slot 0
    expect(moves).toContainEqual({ id: 1, index: 1 }); // alpha → slot 1
  });

  it('creates ONE native group per section spanning all its products', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'beta.dev', 1),
    ]);
    // Both products live in the same "Work" section.
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha'), group('beta.dev', 'Beta')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io', 'beta.dev']) },
    );
    expect(chromeMock.tabs.group).toHaveBeenCalledTimes(1);
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2] });
    expect(chromeMock.tabGroups.update).toHaveBeenCalledWith(7, expect.objectContaining({ title: 'Work' }));
  });

  it('prefixes the section emoji in the group title when present', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'alpha.io', 1),
    ]);
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io'], '💼') },
    );
    expect(chromeMock.tabGroups.update).toHaveBeenCalledWith(7, expect.objectContaining({ title: '💼 Work' }));
  });

  it('groups a section even when it has a single tab', async () => {
    chromeMock.tabs.query.mockResolvedValue([chromeTab(1, 'alpha.io', 0)]);
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io']) },
    );
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [1] });
  });

  it('does not group products with no section assignment', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'beta.dev', 1),
    ]);
    // Only alpha is assigned; beta is unassigned and must stay ungrouped.
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha'), group('beta.dev', 'Beta')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io']) },
    );
    expect(chromeMock.tabs.group).toHaveBeenCalledTimes(1);
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [1] });
  });

  it('does not create any group when no section info is provided (sort only)', async () => {
    // Two products out of order so a real sort move happens; no section info → no group.
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'beta.dev', 1),
    ]);
    await sortAndGroupTabs([group('beta.dev', 'Beta'), group('alpha.io', 'Alpha')]);
    expect(chromeMock.tabs.move).toHaveBeenCalled();
    expect(chromeMock.tabs.group).not.toHaveBeenCalled();
  });

  it('excludes just-closed tab ids from sorting and grouping', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'alpha.io', 1),
      chromeTab(3, 'alpha.io', 2),
    ]);
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha')],
      { closedTabIds: new Set([2]), sectionByProductKey: inSection('work', 'Work', ['alpha.io']) },
    );
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 3] });
  });

  it('does not group pinned tabs', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0, 1, true),  // pinned
      chromeTab(2, 'alpha.io', 1, 1, false),
      chromeTab(3, 'alpha.io', 2, 1, false),
    ]);
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io']) },
    );
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [2, 3] });
  });

  it('groups each window independently', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0, 1),
      chromeTab(2, 'alpha.io', 1, 1),
      chromeTab(3, 'alpha.io', 0, 2),
      chromeTab(4, 'alpha.io', 1, 2),
    ]);
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io']) },
    );
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2] });
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [3, 4] });
    expect(chromeMock.tabs.group).toHaveBeenCalledTimes(2);
  });

  it('still sorts when chrome.tabGroups is unavailable', async () => {
    vi.stubGlobal('chrome', { tabs: chromeMock.tabs });
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 1),
      chromeTab(2, 'beta.dev', 0),
    ]);
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha'), group('beta.dev', 'Beta')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io', 'beta.dev']) },
    );
    expect(chromeMock.tabs.move).toHaveBeenCalled();   // sorting happened
    expect(chromeMock.tabs.group).not.toHaveBeenCalled(); // grouping skipped
  });

  it('queries only the given window when windowId is provided', async () => {
    chromeMock.tabs.query.mockResolvedValue([chromeTab(1, 'alpha.io', 0, 5)]);
    await sortAndGroupTabs([group('alpha.io', 'Alpha')], { windowId: 5 });
    expect(chromeMock.tabs.query).toHaveBeenCalledWith({ windowId: 5 });
  });

  it('reports group failures instead of silently swallowing them', async () => {
    chromeMock.tabs.group.mockRejectedValue(new Error('cannot group'));
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'alpha.io', 1),
    ]);
    const result = await sortAndGroupTabs(
      [group('alpha.io', 'Alpha')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io']) },
    );
    expect(result.groupFailures).toBe(1);
    expect(result.moveFailures).toBe(0);
  });

  it('reports move failures instead of silently swallowing them', async () => {
    chromeMock.tabs.move.mockRejectedValue(new Error('cannot move'));
    // Tabs start out of the desired order so real moves are attempted (and fail).
    chromeMock.tabs.query.mockResolvedValue([
      chromeTab(1, 'alpha.io', 0),
      chromeTab(2, 'beta.dev', 1),
    ]);
    const result = await sortAndGroupTabs([group('beta.dev', 'Beta'), group('alpha.io', 'Alpha')]);
    expect(result.moveFailures).toBeGreaterThan(0);
  });

  it('skips internal/extension pages', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      { ...chromeTab(1, 'alpha.io', 2), url: 'chrome://extensions' },
      chromeTab(2, 'alpha.io', 0),
      chromeTab(3, 'alpha.io', 1),
    ]);
    await sortAndGroupTabs(
      [group('alpha.io', 'Alpha')],
      { sectionByProductKey: inSection('work', 'Work', ['alpha.io']) },
    );
    expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: [2, 3] });
  });
});
