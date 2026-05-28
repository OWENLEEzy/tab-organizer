import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';

const chromeStorageData: Record<string, unknown> = {};

beforeEach(() => {
  chromeStorageData.settings = { groupSortBy: 'count', customGroups: [] };
  chromeStorageData.sections = [];
  chromeStorageData.sectionAssignments = [];
  chromeStorageData.unsortedOverrides = [];
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
});

describe('sortCurrentWindowTabsByDashboardOrder', () => {
  it('does not move pinned tabs', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, url: 'https://github.com/a', pinned: true, index: 0 } as chrome.tabs.Tab,
      { id: 2, url: 'https://github.com/b', pinned: true, index: 1 } as chrome.tabs.Tab,
      { id: 3, url: 'https://example.com', pinned: false, index: 2 } as chrome.tabs.Tab,
    ]);

    const products = [{ id: '1', domain: 'github.com', productKey: 'github', friendlyName: 'GitHub', collapsed: false, order: 0, color: '', hasDuplicates: false, duplicateCount: 0, tabs: [] }];

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder(products);

    const movedIds = (chrome.tabs.move as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(movedIds).not.toContain(1);
    expect(movedIds).not.toContain(2);
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

  it('does nothing when no unpinned real tabs exist', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, url: 'chrome://settings', pinned: true, index: 0 } as chrome.tabs.Tab,
    ]);

    await useTabStore.getState().sortCurrentWindowTabsByDashboardOrder([]);

    expect((chrome.tabs.move as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});