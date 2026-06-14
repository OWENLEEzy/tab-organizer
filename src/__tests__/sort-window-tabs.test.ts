import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';
import { useSettingsStore } from '../stores/settings-store';

const chromeStorageData: Record<string, unknown> = {};

beforeEach(() => {
  chromeStorageData.settings = { groupSortBy: 'count', customGroups: [] };
  chromeStorageData.sections = [];
  chromeStorageData.sectionAssignments = [];
  chromeStorageData.unsectionedProductKeys = [];
  chromeStorageData.viewMode = 'cards';

  vi.stubGlobal('chrome', {
    runtime: { getManifest: () => ({ version: '2.0.0' }) },
    storage: {
      local: {
        get: vi.fn(async () => ({ ...chromeStorageData })),
        set: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
    },
    tabs: {
      query: vi.fn(),
      move: vi.fn(async () => {}),
      onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
      onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    windows: { getCurrent: vi.fn(async () => ({ id: 1 })) },
  });

  useTabStore.setState(useTabStore.getInitialState(), true);
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
});

describe('sortCurrentWindowTabsByDashboardOrder', () => {
  it('never moves pinned tabs — only unpinned tabs are reordered', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 2, url: 'https://example.com', pinned: true, index: 0 } as chrome.tabs.Tab,
      { id: 1, url: 'https://github.com/a', pinned: true, index: 1 } as chrome.tabs.Tab,
      // Two unpinned tabs in the wrong order so a real reorder happens.
      { id: 3, url: 'https://example.com', pinned: false, index: 2 } as chrome.tabs.Tab,
      { id: 4, url: 'https://github.com/b', pinned: false, index: 3 } as chrome.tabs.Tab,
    ]);

    const products = [
      { id: '1', domain: 'github.com', productKey: 'github', friendlyName: 'GitHub', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
      { id: '2', domain: 'example.com', productKey: 'example', friendlyName: 'Example', collapsed: false, order: 1, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
    ];

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products);

    const moves = (chrome.tabs.move as ReturnType<typeof vi.fn>).mock.calls;
    // Pinned tabs 1 and 2 are never moved; only the unpinned tabs reorder within
    // their own slots [2,3]: github (4) → 2, example (3) → 3.
    expect(moves).toEqual([
      [4, { index: 2 }],
      [3, { index: 3 }],
    ]);
    expect(moves.map((c) => c[0])).not.toContain(1);
    expect(moves.map((c) => c[0])).not.toContain(2);
  });

  it('sorts unpinned tabs by product order', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 3, url: 'https://example.com', pinned: false, index: 0 } as chrome.tabs.Tab,
      { id: 1, url: 'https://github.com/a', pinned: false, index: 1 } as chrome.tabs.Tab,
      { id: 2, url: 'https://github.com/b', pinned: false, index: 2 } as chrome.tabs.Tab,
    ]);

    const products = [
      { id: '1', domain: 'github.com', productKey: 'github', friendlyName: 'GitHub', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
      { id: '2', domain: 'example.com', productKey: 'example', friendlyName: 'Example', collapsed: false, order: 1, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
    ];

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products);

    const moves = (chrome.tabs.move as ReturnType<typeof vi.fn>).mock.calls;
    // GitHub tabs (1,2) should come before example.com (3)
    const movedIds = moves.map((c) => c[0]);
    expect(movedIds).toEqual([1, 2, 3]);
  });

  it('preserves non-real unpinned tab slots while sorting real tabs', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 9, url: 'chrome://extensions', pinned: false, index: 0 } as chrome.tabs.Tab,
      { id: 3, url: 'https://example.com', pinned: false, index: 1 } as chrome.tabs.Tab,
      { id: 1, url: 'https://github.com/a', pinned: false, index: 2 } as chrome.tabs.Tab,
      { id: 8, url: 'chrome-extension://fake-id/src/dashboard/index.html', pinned: false, index: 3 } as chrome.tabs.Tab,
      { id: 2, url: 'https://github.com/b', pinned: false, index: 4 } as chrome.tabs.Tab,
    ]);

    const products = [
      { id: '1', domain: 'github.com', productKey: 'github', friendlyName: 'GitHub', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
      { id: '2', domain: 'example.com', productKey: 'example', friendlyName: 'Example', collapsed: false, order: 1, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
    ];

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products);

    const moves = (chrome.tabs.move as ReturnType<typeof vi.fn>).mock.calls;
    expect(moves).toEqual([
      [1, { index: 1 }],
      [2, { index: 2 }],
      [3, { index: 4 }],
    ]);
  });

  it('keeps unknown products after known products in original order', async () => {
    // github starts last so a real reorder happens; the two unknowns must keep their
    // original relative order (unknown-a@0 before unknown-b@1) behind github.
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 5, url: 'https://unknown-a.com', pinned: false, index: 0 } as chrome.tabs.Tab,
      { id: 4, url: 'https://unknown-b.com', pinned: false, index: 1 } as chrome.tabs.Tab,
      { id: 1, url: 'https://github.com/a', pinned: false, index: 2 } as chrome.tabs.Tab,
    ]);

    const products = [
      { id: '1', domain: 'github.com', productKey: 'github', friendlyName: 'GitHub', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
    ];

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products);

    const movedIds = (chrome.tabs.move as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(movedIds).toEqual([1, 5, 4]);
  });

  it('continues sorting when one tab move fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 3, url: 'https://example.com', pinned: false, index: 0 } as chrome.tabs.Tab,
      { id: 1, url: 'https://github.com/a', pinned: false, index: 1 } as chrome.tabs.Tab,
    ]);
    (chrome.tabs.move as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('move failed'))
      .mockResolvedValue(undefined);

    const products = [
      { id: '1', domain: 'github.com', productKey: 'github', friendlyName: 'GitHub', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
      { id: '2', domain: 'example.com', productKey: 'example', friendlyName: 'Example', collapsed: false, order: 1, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
    ];

    await expect(useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products)).resolves.toBeUndefined();

    expect(chrome.tabs.move).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      '[Tab Organizer] Failed to move tab',
      1,
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('uses domain fallback product ids and custom group mappings', async () => {
    // The shared sort pipeline reads customGroups from storage so the popup (no
    // settings store) works too — seed a valid current-schema storage snapshot.
    chromeStorageData.schemaVersion = 5;
    chromeStorageData.settings = {
      groupSortBy: 'count',
      customGroups: [
        { hostname: 'app.internal.test', groupKey: 'internal', groupLabel: 'Internal' },
      ],
    };
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 2, url: 'https://github.com/a', pinned: false, index: 0 } as chrome.tabs.Tab,
      { id: 1, url: 'https://app.internal.test/a', pinned: false, index: 1 } as chrome.tabs.Tab,
    ]);

    const products = [
      { id: 'internal', domain: 'internal', friendlyName: 'Internal', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
      { id: 'github', domain: 'github', friendlyName: 'GitHub', collapsed: false, order: 1, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
    ];

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products);

    const movedIds = (chrome.tabs.move as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(movedIds).toEqual([1, 2]);
  });

  it('skips real tabs without ids', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { url: 'https://github.com/a', pinned: true, index: 0 } as chrome.tabs.Tab,
      { url: 'https://example.com/a', pinned: false, index: 1 } as chrome.tabs.Tab,
    ]);

    const products = [
      { id: '1', domain: 'github.com', productKey: 'github', friendlyName: 'GitHub', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
      { id: '2', domain: 'example.com', productKey: 'example', friendlyName: 'Example', collapsed: false, order: 1, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] },
    ];

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products);

    expect(chrome.tabs.move).not.toHaveBeenCalled();
  });

  it('does nothing when no real tabs exist', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, url: 'chrome://settings', pinned: true, index: 0 } as chrome.tabs.Tab,
    ]);

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder([]);

    expect((chrome.tabs.move as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
