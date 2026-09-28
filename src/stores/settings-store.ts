import { create } from 'zustand';
import type { AppSettings, CustomGroup, GroupSortOption } from '../types';
import { readSettings, writeSettings, DEFAULT_SETTINGS } from '../utils/storage';
import { type AccentKey } from '../config/themes';
import { clearProductLabel, setProductLabel } from '../lib/product-labels';

// ─── Types ───────────────────────────────────────────────────────────

interface SettingsActions {
  /** Read settings from chrome.storage.local and hydrate store. */
  fetchSettings: () => Promise<void>;
  /** Toggle the sound-enabled flag. */
  toggleSound: () => Promise<void>;
  /** Toggle the confetti-enabled flag. */
  toggleConfetti: () => Promise<void>;
  /** Change the theme preference. */
  setTheme: (theme: AccentKey) => Promise<void>;
  /** Change the language preference. */
  setLanguage: (language: 'en' | 'zh' | 'system') => Promise<void>;
  /** Add a custom group rule. */
  addCustomGroup: (group: CustomGroup) => Promise<void>;
  /** Remove a custom group rule by its groupKey. */
  removeCustomGroup: (groupKey: string) => Promise<void>;
  /** Give a product group a display name; a blank or built-in label reverts it. */
  renameProduct: (productKey: string, label: string, defaultLabel?: string) => Promise<void>;
  /** Drop a product group's display-name override. */
  revertProductLabel: (productKey: string) => Promise<void>;
  /** Replace every display-name override, e.g. from a backup import. */
  replaceProductLabels: (labels: Record<string, string>) => Promise<void>;
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

export const useSettingsStore = create<SettingsStore>((set, get) => {
  /**
   * Apply a settings patch optimistically, then persist it. On failure roll
   * back only the fields this patch set, and only where nothing newer has
   * replaced them — restoring a whole earlier snapshot would erase changes
   * made while this write was in flight.
   */
  async function persistSettings(patch: Partial<AppSettings>): Promise<void> {
    const prev = get().settings;
    const updated: AppSettings = { ...prev, ...patch };
    set({ settings: updated });
    try {
      await writeSettings(patch);
    } catch {
      const current = get().settings;
      const reverted: AppSettings = { ...current };
      for (const key of Object.keys(patch) as (keyof AppSettings)[]) {
        if (current[key] === updated[key]) Object.assign(reverted, { [key]: prev[key] });
      }
      set({ settings: reverted });
    }
  }

  return {
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

    toggleSound: () => persistSettings({ soundEnabled: !get().settings.soundEnabled }),

    toggleConfetti: () => persistSettings({ confettiEnabled: !get().settings.confettiEnabled }),

    setTheme: (theme: AccentKey) => persistSettings({ theme }),

    addCustomGroup: (group: CustomGroup) =>
      persistSettings({ customGroups: [...get().settings.customGroups, group] }),

    removeCustomGroup: (groupKey: string) =>
      persistSettings({
        customGroups: get().settings.customGroups.filter((g) => g.groupKey !== groupKey),
      }),

    renameProduct: (productKey: string, label: string, defaultLabel?: string) =>
      persistSettings({
        productLabels: setProductLabel(get().settings.productLabels, productKey, label, defaultLabel),
      }),

    revertProductLabel: (productKey: string) =>
      persistSettings({ productLabels: clearProductLabel(get().settings.productLabels, productKey) }),

    replaceProductLabels: (productLabels: Record<string, string>) => persistSettings({ productLabels }),

    updateKeyBinding: (key: keyof AppSettings['keyBindings'], binding: string) =>
      persistSettings({ keyBindings: { ...get().settings.keyBindings, [key]: binding } }),

    resetKeyBindings: () =>
      persistSettings({
        keyBindings: {
          switchSectionN: 'Meta+{n}',
          switchSectionAll: 'Meta+0',
          cyclePrev: 'ArrowLeft',
          cycleNext: 'ArrowRight',
          focusSearch: '/',
          clearFilter: 'Escape',
        },
      }),

    setMaxChipsVisible: (count: number) => persistSettings({ maxChipsVisible: count }),

    setStaleThresholdDays: (days: number) => persistSettings({ staleThresholdDays: days }),

    setLanguage: (language: 'en' | 'zh' | 'system') => persistSettings({ language }),

    setGroupSortBy: (groupSortBy: GroupSortOption) => persistSettings({ groupSortBy }),
  };
});
