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
};

vi.stubGlobal('chrome', {
  tabs: chromeTabs,
  storage: {
    local: chromeStorage,
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
  windows: {
    getCurrent: vi.fn(),
    update: vi.fn(),
  },
});

describe('useTabStore', () => {
  beforeEach(() => {
    chromeTabs.query.mockReset();
    chromeTabs.remove.mockReset();
    chromeStorage.get.mockClear();
    chromeStorage.set.mockClear();
    chromeStorage.data = {};
    useTabStore.setState({
      tabs: [],
      groups: [],
      sections: [],
      sectionAssignments: [],
      viewMode: 'cards',
      loading: false,
      error: null,
      fetchTabs: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('closes only one underlying tab per selected chip URL', async () => {
    chromeTabs.query.mockResolvedValue([
      { id: 11, url: 'https://github.com/OWENLEEzy/tab-out' },
      { id: 12, url: 'https://github.com/OWENLEEzy/tab-out' },
      { id: 13, url: 'https://vercel.com' },
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await useTabStore.getState().closeOneTabPerUrl([
      'https://github.com/OWENLEEzy/tab-out',
    ]);

    expect(chromeTabs.remove).toHaveBeenCalledWith([11]);
    expect(useTabStore.getState().fetchTabs).toHaveBeenCalledTimes(1);
  });

  it('projects URL assignments out of their product group and prunes stale assignments', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeStorage.data = {
      schemaVersion: 3,
      deferred: [],
      workspaces: [],
      settings: {
        theme: 'system',
        soundEnabled: true,
        confettiEnabled: true,
        maxChipsVisible: 8,
        customGroups: [],
        landingPagePatterns: [],
      },
      groupOrder: { youtube: 0, 'old-hostname.com': 1 },
      sections: [{ id: 'later', name: 'Later', order: 0 }],
      sectionAssignments: [
        { itemType: 'tabUrl', itemKey: 'https://www.youtube.com/watch?v=1', sectionId: 'later', order: 0 },
        { itemType: 'tabUrl', itemKey: 'https://missing.example', sectionId: 'later', order: 1 },
        { itemType: 'product', itemKey: 'missing-product', sectionId: 'later', order: 2 },
      ],
      viewMode: 'table',
    };
    chromeTabs.query.mockResolvedValue([
      { id: 11, url: 'https://www.youtube.com/watch?v=1', title: 'Video 1', windowId: 1, active: false },
      { id: 12, url: 'https://www.youtube.com/watch?v=2', title: 'Video 2', windowId: 1, active: false },
    ]);

    await useTabStore.getState().fetchTabs();

    const state = useTabStore.getState();
    const youtube = state.groups.find((group) => group.itemType === 'product' && group.domain === 'youtube');
    const assignedUrl = state.groups.find((group) => group.itemType === 'tabUrl');

    expect(youtube?.tabs.map((tab) => tab.url)).toEqual(['https://www.youtube.com/watch?v=2']);
    expect(assignedUrl?.tabs.map((tab) => tab.url)).toEqual(['https://www.youtube.com/watch?v=1']);
    expect(state.sectionAssignments).toEqual([
      { itemType: 'tabUrl', itemKey: 'https://www.youtube.com/watch?v=1', sectionId: 'later', order: 0 },
    ]);
    expect(state.viewMode).toBe('table');
    expect(chromeStorage.data['groupOrder']).toEqual({ youtube: 0 });
  });

  it('closes exact rendered product URLs instead of every tab on the same host', async () => {
    chromeTabs.query.mockResolvedValue([
      { id: 11, url: 'https://www.youtube.com/watch?v=1' },
      { id: 12, url: 'https://www.youtube.com/watch?v=2' },
      { id: 13, url: 'https://www.youtube.com/watch?v=3' },
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await useTabStore.getState().closeTabsExact([
      'https://www.youtube.com/watch?v=1',
      'https://www.youtube.com/watch?v=2',
    ]);

    expect(chromeTabs.remove).toHaveBeenCalledWith([11, 12]);
  });
});
