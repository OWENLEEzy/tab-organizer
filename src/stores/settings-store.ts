import { create } from 'zustand';
import type { AppSettings, CustomGroup } from '../types';
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
  /** Add a custom group rule. */
  addCustomGroup: (group: CustomGroup) => Promise<void>;
  /** Remove a custom group rule by its groupKey. */
  removeCustomGroup: (groupKey: string) => Promise<void>;
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
}));
