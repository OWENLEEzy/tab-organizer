import { create } from 'zustand';
import type { Workspace, SavedTab } from '../types';
import { readWorkspaces, writeWorkspaces } from '../utils/storage';

// ─── Types ───────────────────────────────────────────────────────────

interface WorkspaceActions {
  /** Fetch all workspaces from chrome.storage.local. */
  fetchWorkspaces: () => Promise<void>;
  /** Create a new workspace with the given name and icon. */
  createWorkspace: (name: string, icon: string) => Promise<void>;
  /** Delete a workspace by its id. */
  deleteWorkspace: (id: string) => Promise<void>;
  /** Rename an existing workspace. */
  renameWorkspace: (id: string, name: string) => Promise<void>;
  /** Add a saved tab to a workspace. */
  addTabToWorkspace: (workspaceId: string, tab: SavedTab) => Promise<void>;
  /** Remove a saved tab from a workspace. */
  removeTabFromWorkspace: (workspaceId: string, tabId: string) => Promise<void>;
  /** Open all tabs in a workspace via chrome.tabs.create. */
  restoreWorkspace: (workspaceId: string) => Promise<void>;
  /** Set the currently active workspace (local state only, not persisted). */
  setActiveWorkspace: (id: string | null) => void;
}

export type WorkspaceStore = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  loading: boolean;
} & WorkspaceActions;

// ─── Store ───────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  loading: false,

  fetchWorkspaces: async () => {
    set({ loading: true });
    try {
      const workspaces = await readWorkspaces();
      set({ workspaces, loading: false });
    } catch {
      set({ workspaces: [], loading: false });
    }
  },

  createWorkspace: async (name: string, icon: string) => {
    const { workspaces: prev } = get();
    const now = Date.now();
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name,
      icon,
      savedTabs: [],
      createdAt: now,
      updatedAt: now,
      order: prev.length,
    };
    const updated = [...prev, workspace];
    set({ workspaces: updated });
    try {
      await writeWorkspaces(updated);
    } catch {
      set({ workspaces: prev });
    }
  },

  deleteWorkspace: async (id: string) => {
    const { workspaces: prev } = get();
    const updated = prev.filter((w) => w.id !== id);
    set({ workspaces: updated });
    try {
      await writeWorkspaces(updated);
    } catch {
      set({ workspaces: prev });
    }
  },

  renameWorkspace: async (id: string, name: string) => {
    const { workspaces: prev } = get();
    const updated = prev.map((w) =>
      w.id === id ? { ...w, name, updatedAt: Date.now() } : w
    );
    set({ workspaces: updated });
    try {
      await writeWorkspaces(updated);
    } catch {
      set({ workspaces: prev });
    }
  },

  addTabToWorkspace: async (workspaceId: string, tab: SavedTab) => {
    const { workspaces: prev } = get();
    const updated = prev.map((w) =>
      w.id === workspaceId
        ? { ...w, savedTabs: [...w.savedTabs, tab], updatedAt: Date.now() }
        : w
    );
    set({ workspaces: updated });
    try {
      await writeWorkspaces(updated);
    } catch {
      set({ workspaces: prev });
    }
  },

  removeTabFromWorkspace: async (workspaceId: string, tabId: string) => {
    const { workspaces: prev } = get();
    const updated = prev.map((w) =>
      w.id === workspaceId
        ? {
            ...w,
            savedTabs: w.savedTabs.filter((t) => t.id !== tabId),
            updatedAt: Date.now(),
          }
        : w
    );
    set({ workspaces: updated });
    try {
      await writeWorkspaces(updated);
    } catch {
      set({ workspaces: prev });
    }
  },

  restoreWorkspace: async (workspaceId: string) => {
    const { workspaces } = get();
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return;

    for (const tab of workspace.savedTabs) {
      await chrome.tabs.create({ url: tab.url });
    }
  },

  setActiveWorkspace: (id: string | null) => {
    set({ activeWorkspaceId: id });
  },
}));
