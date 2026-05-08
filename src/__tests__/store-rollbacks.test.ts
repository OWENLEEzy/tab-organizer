import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsStore } from '../stores/settings-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useTabStore } from '../stores/tab-store';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { makeChromeTab, makeSavedTab, makeWorkspace } from './factories';

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

const chromeTabs = {
  query: vi.fn<() => Promise<chrome.tabs.Tab[]>>().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue({}),
};

vi.stubGlobal('chrome', {
  storage: { local: chromeStorage },
  tabs: chromeTabs,
  runtime: { getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`) }
});

describe('Store Rollbacks & Errors Final', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeStorage.data = {
        schemaVersion: 4,
        settings: DEFAULT_SETTINGS,
        workspaces: [],
        groupOrder: {}
    };
    chromeTabs.query.mockResolvedValue([]);
    useWorkspaceStore.setState({ workspaces: [], activeWorkspaceId: null });
  });

  it('SettingsStore rollbacks', async () => {
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useSettingsStore.getState().toggleSound();
    expect(useSettingsStore.getState().settings.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
  });

  it('WorkspaceStore full coverage', async () => {
    // 1. fetchWorkspaces failure (line 45)
    chromeStorage.get.mockRejectedValueOnce(new Error('fail'));
    await useWorkspaceStore.getState().fetchWorkspaces();
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(0);

    // 2. createWorkspace success
    await useWorkspaceStore.getState().createWorkspace('A', 'icon');
    const ws = useWorkspaceStore.getState().workspaces[0];
    const id = ws.id;

    // 3. renameWorkspace failure (line 90)
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useWorkspaceStore.getState().renameWorkspace(id, 'B');
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('A');

    // 4. addTabToWorkspace failure (line 105)
    const savedTab = makeSavedTab({ id: 't1', url: 'u', title: 'T' });
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useWorkspaceStore.getState().addTabToWorkspace(id, savedTab);
    expect(useWorkspaceStore.getState().workspaces[0].savedTabs).toHaveLength(0);

    // 5. removeTabFromWorkspace failure (line 124)
    useWorkspaceStore.setState({ workspaces: [makeWorkspace({ ...ws, savedTabs: [savedTab] })] });
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useWorkspaceStore.getState().removeTabFromWorkspace(id, 't1');
    expect(useWorkspaceStore.getState().workspaces[0].savedTabs).toHaveLength(1);

    // 6. deleteWorkspace failure (line 77)
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useWorkspaceStore.getState().deleteWorkspace(id);
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);

    // 7. setActiveWorkspace (line 139)
    useWorkspaceStore.getState().setActiveWorkspace('test');
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('test');
  });

  it('TabStore error paths', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    
    // Line 392: reorderProducts catch
    const dummyProduct: any = { productKey: 'google', domain: 'google.com', order: 0, tabs: [] };
    useTabStore.setState({ products: [dummyProduct] });
    useTabStore.getState().reorderProducts([{ ...dummyProduct, order: 1 }]);
    await vi.waitFor(() => expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to persist product order'), expect.any(Error)));
    
    // Line 177: fetchTabs prune catch
    spy.mockClear();
    chromeStorage.data['groupOrder'] = { 'stale': 0 };
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useTabStore.getState().fetchTabs();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to prune stale organizer storage'), expect.any(Error));

    // Line 127: protectHistoryBeforeClosing catch
    spy.mockClear();
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    chromeTabs.query.mockResolvedValueOnce([makeChromeTab({ id: 1, url: 'https://a.com' })]);
    await useTabStore.getState().closeTabByUrl('https://a.com');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to protect history before closing tabs'), expect.any(Error));

    spy.mockRestore();
  });

  it('TabStore restoreHistorySnapshot handles null snapshot', async () => {
    // Line 490 in tab-store.ts
    chromeStorage.data['history'] = [];
    await useTabStore.getState().restoreHistorySnapshot('non-existent');
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });
});
