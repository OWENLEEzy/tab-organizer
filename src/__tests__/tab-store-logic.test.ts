import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';

const chromeTabs = {
  query: vi.fn(),
  remove: vi.fn(),
};

const chromeStorage = {
  data: {} as Record<string, unknown>,
  get: vi.fn((keys: string[] | string) => {
    const result: Record<string, unknown> = {};
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      if (key in chromeStorage.data) result[key] = chromeStorage.data[key];
    }
    return Promise.resolve(result);
  }),
  set: vi.fn((items: Record<string, unknown>) => {
    Object.assign(chromeStorage.data, items);
    return Promise.resolve();
  }),
  remove: vi.fn(() => Promise.resolve()),
};

vi.stubGlobal('chrome', {
  tabs: chromeTabs,
  storage: { local: chromeStorage },
  runtime: { getURL: vi.fn(() => '') }
});

describe('TabStore Internal Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeStorage.data = {
        schemaVersion: 4,
        manualGroups: [],
        groupAssignments: [],
        groupOrder: {},
        viewMode: 'cards'
    };
  });

  it('prunes stale assignments and groupOrder during fetchTabs', async () => {
    chromeStorage.data['manualGroups'] = [{ id: 'g1', name: 'G1', order: 0 }];
    chromeStorage.data['groupAssignments'] = [
        { productKey: 'stale', groupId: 'g1', order: 0 },
        { productKey: 'youtube', groupId: 'missing-group', order: 1 }
    ];
    chromeStorage.data['groupOrder'] = { 'stale-domain': 0 };
    
    // Mock only youtube tab
    chromeTabs.query.mockResolvedValue([
        { id: 1, url: 'https://youtube.com', title: 'YT', windowId: 1, active: false }
    ]);

    await useTabStore.getState().fetchTabs();
    
    const state = useTabStore.getState();
    expect(state.groupAssignments).toHaveLength(0); // Both were stale/invalid
    expect(chromeStorage.data['groupOrder']).toEqual({}); // stale-domain removed
  });

  it('migrates legacy hostname organizer keys to canonical product keys', async () => {
    chromeStorage.data['manualGroups'] = [{ id: 'g1', name: 'G1', order: 0 }];
    chromeStorage.data['groupAssignments'] = [
      { productKey: 'stackoverflow.com', groupId: 'g1', order: 0 },
    ];
    chromeStorage.data['groupOrder'] = { 'stackoverflow.com': 1, stackoverflow: 3 };

    chromeTabs.query.mockResolvedValue([
      { id: 1, url: 'https://stackoverflow.com/questions/123', title: 'SO', windowId: 1, active: false },
    ]);

    await useTabStore.getState().fetchTabs();

    const state = useTabStore.getState();
    expect(state.products[0].domain).toBe('stackoverflow');
    expect(state.groupAssignments).toEqual([
      { productKey: 'stackoverflow', groupId: 'g1', order: 0 },
    ]);
    expect(chromeStorage.data['groupOrder']).toEqual({ stackoverflow: 3 });
    expect(chromeStorage.data['groupAssignments']).toEqual([
      { productKey: 'stackoverflow', groupId: 'g1', order: 0 },
    ]);
  });

  it('merges multiple legacy localized keys into one canonical assignment', async () => {
    chromeStorage.data['manualGroups'] = [
      { id: 'later', name: 'Later', order: 0 },
      { id: 'research', name: 'Research', order: 1 },
    ];
    chromeStorage.data['groupAssignments'] = [
      { productKey: 'example.com', groupId: 'later', order: 2 },
      { productKey: 'example.com.hk', groupId: 'research', order: 1 },
    ];
    chromeStorage.data['groupOrder'] = { 'example.com': 4, 'example.com.hk': 2 };

    chromeTabs.query.mockResolvedValue([
      { id: 1, url: 'https://example.com/a', title: 'Example US', windowId: 1, active: false },
      { id: 2, url: 'https://example.com.hk/b', title: 'Example HK', windowId: 1, active: false },
    ]);

    await useTabStore.getState().fetchTabs();

    expect(useTabStore.getState().groupAssignments).toEqual([
      { productKey: 'example', groupId: 'research', order: 1 },
    ]);
    expect(chromeStorage.data['groupOrder']).toEqual({ example: 2 });
    expect(chromeStorage.data['groupAssignments']).toEqual([
      { productKey: 'example', groupId: 'research', order: 1 },
    ]);
  });

  it('handles duplicate product assignments by keeping only the first one', async () => {
    chromeStorage.data['manualGroups'] = [{ id: 'g1', name: 'G1', order: 0 }];
    chromeStorage.data['groupAssignments'] = [
        { productKey: 'youtube', groupId: 'g1', order: 0 },
        { productKey: 'youtube', groupId: 'g1', order: 1 }
    ];
    
    chromeTabs.query.mockResolvedValue([
        { id: 1, url: 'https://youtube.com', title: 'YT', windowId: 1, active: false }
    ]);

    await useTabStore.getState().fetchTabs();
    
    expect(useTabStore.getState().groupAssignments).toHaveLength(1);
  });
});
