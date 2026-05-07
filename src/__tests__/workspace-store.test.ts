import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspaceStore } from '../stores/workspace-store';
import type { SavedTab, Workspace } from '../types';

const chromeTabs = {
  create: vi.fn().mockResolvedValue({}),
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
  storage: {
    local: chromeStorage,
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
});

// Mock crypto.randomUUID
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'fake-uuid',
    },
    writable: true,
  });
}

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    chromeTabs.create.mockClear();
    chromeStorage.get.mockClear();
    chromeStorage.set.mockClear();
    chromeStorage.data = {};
    useWorkspaceStore.setState({
      workspaces: [],
      activeWorkspaceId: null,
      loading: false,
    });
  });

  it('fetches workspaces from storage', async () => {
    const workspaces: Workspace[] = [{ id: '1', name: 'Work', icon: '💼', savedTabs: [], order: 0, createdAt: 1, updatedAt: 1 }];
    chromeStorage.data['workspaces'] = workspaces;

    await useWorkspaceStore.getState().fetchWorkspaces();

    expect(useWorkspaceStore.getState().workspaces).toEqual(workspaces);
  });

  it('creates a new workspace', async () => {
    await useWorkspaceStore.getState().createWorkspace('Project X', '🚀');

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
    expect(state.workspaces[0].name).toBe('Project X');
    expect(state.workspaces[0].icon).toBe('🚀');
    expect(chromeStorage.data['workspaces'] as Workspace[]).toHaveLength(1);
  });

  it('deletes a workspace', async () => {
    const workspace: Workspace = { id: 'w1', name: 'To Delete', icon: '', savedTabs: [], order: 0, createdAt: 1, updatedAt: 1 };
    useWorkspaceStore.setState({ workspaces: [workspace] });

    await useWorkspaceStore.getState().deleteWorkspace('w1');

    expect(useWorkspaceStore.getState().workspaces).toHaveLength(0);
    expect(chromeStorage.data['workspaces'] as Workspace[]).toHaveLength(0);
  });

  it('renames a workspace', async () => {
    const workspace: Workspace = { id: 'w1', name: 'Old Name', icon: '', savedTabs: [], order: 0, createdAt: 1, updatedAt: 1 };
    useWorkspaceStore.setState({ workspaces: [workspace] });

    await useWorkspaceStore.getState().renameWorkspace('w1', 'New Name');

    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('New Name');
    const stored = chromeStorage.data['workspaces'] as Workspace[];
    expect(stored[0].name).toBe('New Name');
  });

  it('adds a tab to a workspace', async () => {
    const workspace: Workspace = { id: 'w1', name: 'W', icon: '', savedTabs: [], order: 0, createdAt: 1, updatedAt: 1 };
    useWorkspaceStore.setState({ workspaces: [workspace] });

    const tab: SavedTab = {
      id: 't1',
      url: 'https://example.com',
      title: 'Example',
      domain: 'example.com',
      savedAt: '2026',
      completed: false,
      dismissed: false,
    };

    await useWorkspaceStore.getState().addTabToWorkspace('w1', tab);

    expect(useWorkspaceStore.getState().workspaces[0].savedTabs).toContainEqual(tab);
    const stored = chromeStorage.data['workspaces'] as Workspace[];
    expect(stored[0].savedTabs).toContainEqual(tab);
  });

  it('removes a tab from a workspace', async () => {
    const tab: SavedTab = {
      id: 't1',
      url: 'https://example.com',
      title: 'Example',
      domain: 'example.com',
      savedAt: '2026',
      completed: false,
      dismissed: false,
    };
    const workspace: Workspace = { id: 'w1', name: 'W', icon: '', savedTabs: [tab], order: 0, createdAt: 1, updatedAt: 1 };
    useWorkspaceStore.setState({ workspaces: [workspace] });

    await useWorkspaceStore.getState().removeTabFromWorkspace('w1', 't1');

    expect(useWorkspaceStore.getState().workspaces[0].savedTabs).toHaveLength(0);
    const stored = chromeStorage.data['workspaces'] as Workspace[];
    expect(stored[0].savedTabs).toHaveLength(0);
  });

  it('restores a workspace by creating tabs', async () => {
    const tab: SavedTab = {
      id: 't1',
      url: 'https://example.com',
      title: 'Example',
      domain: 'example.com',
      savedAt: '2026',
      completed: false,
      dismissed: false,
    };
    const workspace: Workspace = { id: 'w1', name: 'W', icon: '', savedTabs: [tab], order: 0, createdAt: 1, updatedAt: 1 };
    useWorkspaceStore.setState({ workspaces: [workspace] });

    await useWorkspaceStore.getState().restoreWorkspace('w1');

    expect(chromeTabs.create).toHaveBeenCalledWith({ url: tab.url });
  });

  it('rolls back on storage failure', async () => {
    chromeStorage.set.mockRejectedValueOnce(new Error('Fail'));
    const initialWorkspaces = useWorkspaceStore.getState().workspaces;

    await useWorkspaceStore.getState().createWorkspace('Failed', '');

    expect(useWorkspaceStore.getState().workspaces).toEqual(initialWorkspaces);
  });
});
