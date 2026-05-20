import { create } from 'zustand';
import type { AppSettings, CustomGroup, GroupSortOption } from '../types';
import { readSettings, writeSettings, DEFAULT_SETTINGS } from '../utils/storage';

// ─── Types ───────────────────────────────────────────────────────────

interface SettingsActions {
  /** Read settings from chrome.storage.local and hydrate store. */
  fetchSettings: () => Promise<void>;
  /** Toggle the sound-enabled flag. */
  toggleSound: () => Promise<void>;
  /** Toggle the confetti-enabled flag. */
  toggleConfetti: () => Promise<void>;
  /** Change the theme preference. */
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  /** Change the language preference. */
  setLanguage: (language: 'en' | 'zh' | 'system') => Promise<void>;
  /** Add a custom group rule. */
  addCustomGroup: (group: CustomGroup) => Promise<void>;
  /** Remove a custom group rule by its groupKey. */
  removeCustomGroup: (groupKey: string) => Promise<void>;
  /** Update a specific shortcut keybinding. */
  updateKeyBinding: (key: keyof AppSettings['keyBindings'], binding: string) => Promise<void>;
  /** Reset all key bindings to their defaults. */
  resetKeyBindings: () => Promise<void>;
  /** Change the maximum number of visible tab chips per group. */
  setMaxChipsVisible: (count: number) => Promise<void>;
  /** Change the tab staleness idle threshold in days. */
  setStaleThresholdDays: (days: number) => Promise<void>;
  /** Change the group sort order preference. */
  setGroupSortBy: (sortBy: GroupSortOption) => Promise<void>;
}

export type SettingsStore = {
  settings: AppSettings;
  loading: boolean;
} & SettingsActions;

// ─── Store ───────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const settings = await readSettings();
      set({ settings, loading: false });
    } catch {
      set({ settings: DEFAULT_SETTINGS, loading: false });
    }
  },

  toggleSound: async () => {
    const { settings: prev } = get();
    const updated: AppSettings = { ...prev, soundEnabled: !prev.soundEnabled };
    set({ settings: updated });
    try {
      await writeSettings({ soundEnabled: updated.soundEnabled });
    } catch {
      set({ settings: prev });
    }
  },

  toggleConfetti: async () => {
    const { settings: prev } = get();
    const updated: AppSettings = { ...prev, confettiEnabled: !prev.confettiEnabled };
    set({ settings: updated });
    try {
      await writeSettings({ confettiEnabled: updated.confettiEnabled });
    } catch {
      set({ settings: prev });
    }
  },

  setTheme: async (theme: 'light' | 'dark' | 'system') => {
    const { settings: prev } = get();
    const updated: AppSettings = { ...prev, theme };
    set({ settings: updated });
    try {
      await writeSettings({ theme });
    } catch {
      set({ settings: prev });
    }
  },

  addCustomGroup: async (group: CustomGroup) => {
    const { settings: prev } = get();
    const updated: AppSettings = {
      ...prev,
      customGroups: [...prev.customGroups, group],
    };
    set({ settings: updated });
    try {
      await writeSettings({ customGroups: updated.customGroups });
    } catch {
      set({ settings: prev });
    }
  },

  removeCustomGroup: async (groupKey: string) => {
    const { settings: prev } = get();
    const updated: AppSettings = {
      ...prev,
      customGroups: prev.customGroups.filter((g) => g.groupKey !== groupKey),
    };
    set({ settings: updated });
    try {
      await writeSettings({ customGroups: updated.customGroups });
    } catch {
      set({ settings: prev });
    }
  },

  updateKeyBinding: async (key: keyof AppSettings['keyBindings'], binding: string) => {
    const { settings: prev } = get();
    const updated: AppSettings = {
      ...prev,
      keyBindings: {
        ...prev.keyBindings,
        [key]: binding,
      },
    };
    set({ settings: updated });
    try {
      await writeSettings({ keyBindings: updated.keyBindings });
    } catch {
      set({ settings: prev });
    }
  },

  resetKeyBindings: async () => {
    const { settings: prev } = get();
    const updated: AppSettings = {
      ...prev,
      keyBindings: {
        switchSpaceN: 'Meta+{n}',
        switchSpaceAll: 'Meta+0',
        cyclePrev: 'ArrowLeft',
        cycleNext: 'ArrowRight',
        focusSearch: '/',
        clearFilter: 'Escape',
      },
    };
    set({ settings: updated });
    try {
      await writeSettings({ keyBindings: updated.keyBindings });
    } catch {
      set({ settings: prev });
    }
  },

  setMaxChipsVisible: async (count: number) => {
    const { settings: prev } = get();
    const updated: AppSettings = { ...prev, maxChipsVisible: count };
    set({ settings: updated });
    try {
      await writeSettings({ maxChipsVisible: count });
    } catch {
      set({ settings: prev });
    }
  },

  setStaleThresholdDays: async (days: number) => {
    const { settings: prev } = get();
    const updated: AppSettings = { ...prev, staleThresholdDays: days };
    set({ settings: updated });
    try {
      await writeSettings({ staleThresholdDays: days });
    } catch {
      set({ settings: prev });
    }
  },

  setLanguage: async (language: 'en' | 'zh' | 'system') => {
    const { settings: prev } = get();
    const updated: AppSettings = { ...prev, language };
    set({ settings: updated });
    try {
      await writeSettings({ language });
    } catch {
      set({ settings: prev });
    }
  },

  setGroupSortBy: async (groupSortBy: GroupSortOption) => {
    const { settings: prev } = get();
    const updated: AppSettings = { ...prev, groupSortBy };
    set({ settings: updated });
    try {
      await writeSettings({ groupSortBy });
    } catch {
      set({ settings: prev });
    }
  },
}));
