import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';
import { readStorage } from '../utils/storage';
import type { TabGroup } from '../types';

const chromeTabs = {
  query: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
  onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
  onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
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
  windows: {
    getCurrent: vi.fn().mockResolvedValue({ id: 1 }),
    update: vi.fn().mockResolvedValue({}),
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  }
});

// Mock randomUUID
vi.spyOn(crypto, 'randomUUID').mockReturnValue('fake-uuid' as `${string}-${string}-${string}-${string}-${string}`);

describe('TabStore Manual Groups & Reordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeStorage.data = {
        schemaVersion: 4,
        manualGroups: [],
        groupAssignments: [],
        groupOrder: {},
        viewMode: 'cards'
    };
    useTabStore.setState({
      manualGroups: [],
      groupAssignments: [],
      products: [],
      loading: false,
      error: null
    });
  });

  it('creates, renames and deletes groups', async () => {
    await useTabStore.getState().createGroup(' New Group ');
    expect(useTabStore.getState().manualGroups).toHaveLength(1);
    expect(useTabStore.getState().manualGroups[0].name).toBe('New Group');
    expect(useTabStore.getState().manualGroups[0].id).toBe('fake-uuid');

    await useTabStore.getState().renameGroup('fake-uuid', ' Renamed ');
    expect(useTabStore.getState().manualGroups[0].name).toBe('Renamed');

    await useTabStore.getState().deleteGroup('fake-uuid');
    expect(useTabStore.getState().manualGroups).toHaveLength(0);
  });

  it('reorders groups', async () => {
    const groups = [
        { id: '1', name: 'A', order: 0 },
        { id: '2', name: 'B', order: 1 }
    ];
    await useTabStore.getState().reorderGroups([groups[1], groups[0]]);
    const updated = useTabStore.getState().manualGroups;
    expect(updated[0].id).toBe('2');
    expect(updated[0].order).toBe(0);
    expect(updated[1].id).toBe('1');
    expect(updated[1].order).toBe(1);
  });

  it('reorders products', async () => {
    const products = [
        { domain: 'a.com', order: 0, tabs: [], friendlyName: 'A', id: 'a', color: '', hasDuplicates: false, duplicateCount: 0 },
        { domain: 'b.com', order: 1, tabs: [], friendlyName: 'B', id: 'b', color: '', hasDuplicates: false, duplicateCount: 0 }
    ] as unknown as TabGroup[];
    useTabStore.setState({ products });
    
    useTabStore.getState().reorderProducts([products[1], products[0]]);
    expect(useTabStore.getState().products[0].domain).toBe('b.com');
    
    // reorderProducts is not awaited internally, so we wait for the mock call
    await vi.waitFor(() => {
        expect(chromeStorage.set).toHaveBeenCalled();
    });
    
    const storage = await readStorage();
    expect(storage.groupOrder['b.com']).toBe(0);
    expect(storage.groupOrder['a.com']).toBe(1);
  });
});

describe('TabStore ViewMode & Error', () => {
    it('sets view mode', async () => {
        await useTabStore.getState().setViewMode('table');
        expect(useTabStore.getState().viewMode).toBe('table');
    });

    it('clears error', () => {
        useTabStore.setState({ error: 'fail' });
        useTabStore.getState().clearError();
        expect(useTabStore.getState().error).toBeNull();
    });
});

describe('TabStore Listeners', () => {
    it('starts and stops listeners', () => {
        const cleanup = useTabStore.getState().startListeners();
        expect(chromeTabs.onCreated.addListener).toHaveBeenCalled();
        expect(chromeTabs.onRemoved.addListener).toHaveBeenCalled();
        expect(chromeTabs.onUpdated.addListener).toHaveBeenCalled();
        
        cleanup();
        expect(chromeTabs.onCreated.removeListener).toHaveBeenCalled();
        expect(chromeTabs.onRemoved.removeListener).toHaveBeenCalled();
        expect(chromeTabs.onUpdated.removeListener).toHaveBeenCalled();
    });

    it('refreshes on tab updates', () => {
        vi.useFakeTimers();
        useTabStore.getState().startListeners();
        const onUpdated = chromeTabs.onUpdated.addListener.mock.calls[0][0];
        
        const fetchSpy = vi.spyOn(useTabStore.getState(), 'fetchTabs');
        
        // Should ignore irrelevant updates
        onUpdated(1, { pinned: true });
        vi.advanceTimersByTime(300);
        expect(fetchSpy).not.toHaveBeenCalled();
        
        // Should refresh on relevant updates
        onUpdated(1, { status: 'complete' });
        vi.advanceTimersByTime(300);
        expect(fetchSpy).toHaveBeenCalled();
        
        vi.useRealTimers();
    });
});
