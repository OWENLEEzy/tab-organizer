import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsStore } from '../stores/settings-store';
import { DEFAULT_SETTINGS } from '../utils/storage';
import type { AppSettings, CustomGroup } from '../types';

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
  storage: {
    local: chromeStorage,
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
});

describe('useSettingsStore', () => {
  beforeEach(() => {
    chromeStorage.get.mockClear();
    chromeStorage.set.mockClear();
    chromeStorage.data = {};
    useSettingsStore.setState({
      settings: DEFAULT_SETTINGS,
      loading: false,
    });
  });

  it('hydrates settings from storage', async () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      theme: 'sage' as const,
      soundEnabled: false,
    };
    chromeStorage.data['schemaVersion'] = 6;
    chromeStorage.data['settings'] = customSettings;

    await useSettingsStore.getState().fetchSettings();

    expect(useSettingsStore.getState().settings).toEqual(customSettings);
  });

  it('toggles sound and persists to storage', async () => {
    const initialSound = DEFAULT_SETTINGS.soundEnabled;
    await useSettingsStore.getState().toggleSound();

    expect(useSettingsStore.getState().settings.soundEnabled).toBe(!initialSound);
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.soundEnabled).toBe(!initialSound);
  });

  it('toggles confetti and persists to storage', async () => {
    const initialConfetti = DEFAULT_SETTINGS.confettiEnabled;
    await useSettingsStore.getState().toggleConfetti();

    expect(useSettingsStore.getState().settings.confettiEnabled).toBe(!initialConfetti);
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.confettiEnabled).toBe(!initialConfetti);
  });

  it('sets theme and persists to storage', async () => {
    await useSettingsStore.getState().setTheme('clay');

    expect(useSettingsStore.getState().settings.theme).toBe('clay');
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.theme).toBe('clay');
  });

  it('adds a custom group rule', async () => {
    const group: CustomGroup = { groupKey: 'test', groupLabel: 'Test', hostname: 'test.com' };
    await useSettingsStore.getState().addCustomGroup(group);

    expect(useSettingsStore.getState().settings.customGroups).toContainEqual(group);
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.customGroups).toContainEqual(group);
  });

  it('removes a custom group rule', async () => {
    const group: CustomGroup = { groupKey: 'test', groupLabel: 'Test', hostname: 'test.com' };
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, customGroups: [group] },
    });

    await useSettingsStore.getState().removeCustomGroup('test');

    expect(useSettingsStore.getState().settings.customGroups).toHaveLength(0);
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.customGroups).toHaveLength(0);
  });

  it('renaming a product twice keeps a single label override', async () => {
    await useSettingsStore.getState().renameProduct('youtube', 'Videos');
    await useSettingsStore.getState().renameProduct('youtube', 'Watch later');

    expect(useSettingsStore.getState().settings.productLabels).toEqual({ youtube: 'Watch later' });
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.productLabels).toEqual({ youtube: 'Watch later' });
    // Renaming never touches hostname grouping rules.
    expect(stored.customGroups).toEqual(DEFAULT_SETTINGS.customGroups);
  });

  it('renaming back to the built-in name leaves no override behind', async () => {
    await useSettingsStore.getState().renameProduct('youtube', 'Videos', 'YouTube');
    await useSettingsStore.getState().renameProduct('youtube', 'YouTube', 'YouTube');

    expect(useSettingsStore.getState().settings.productLabels).toEqual({});
    expect((chromeStorage.data['settings'] as AppSettings).productLabels).toEqual({});
  });

  it('reverting a label removes only that override', async () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, productLabels: { youtube: 'Videos', github: 'Code' } },
    });

    await useSettingsStore.getState().revertProductLabel('youtube');

    expect(useSettingsStore.getState().settings.productLabels).toEqual({ github: 'Code' });
  });

  it('replaces all label overrides at once (backup import)', async () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, productLabels: { youtube: 'Videos' } },
    });

    await useSettingsStore.getState().replaceProductLabels({ github: 'Code' });

    expect(useSettingsStore.getState().settings.productLabels).toEqual({ github: 'Code' });
  });

  it('rolls back a rename when the storage write fails, and reports the failure', async () => {
    chromeStorage.set.mockRejectedValueOnce(new Error('Storage failure'));

    await expect(useSettingsStore.getState().renameProduct('youtube', 'Videos')).rejects.toThrow('Storage failure');

    expect(useSettingsStore.getState().settings.productLabels).toEqual({});
  });

  it('a failed write rolls back only its own field, not a change made meanwhile', async () => {
    const initialTheme = useSettingsStore.getState().settings.theme;
    chromeStorage.set.mockRejectedValueOnce(new Error('Storage failure'));

    const rename = useSettingsStore.getState().renameProduct('youtube', 'Videos');
    const theme = useSettingsStore.getState().setTheme(initialTheme === 'clay' ? 'pine' : 'clay');
    await Promise.allSettled([rename, theme]);

    const { settings } = useSettingsStore.getState();
    expect(settings.productLabels).toEqual({});
    expect(settings.theme).not.toBe(initialTheme);
  });

  it('a failed write does not undo a newer value for the same field', async () => {
    chromeStorage.set.mockRejectedValueOnce(new Error('Storage failure'));

    const first = useSettingsStore.getState().renameProduct('youtube', 'Videos');
    const second = useSettingsStore.getState().renameProduct('youtube', 'Watch later');
    await Promise.allSettled([first, second]);

    expect(useSettingsStore.getState().settings.productLabels).toEqual({ youtube: 'Watch later' });
  });

  it('rolls back state if storage write fails', async () => {
    chromeStorage.set.mockRejectedValueOnce(new Error('Storage failure'));
    const initialTheme = useSettingsStore.getState().settings.theme;

    await expect(useSettingsStore.getState().setTheme('clay')).rejects.toThrow('Storage failure');

    // Should have updated then rolled back
    expect(useSettingsStore.getState().settings.theme).toBe(initialTheme);
  });

  it('sets maxChipsVisible and persists to storage', async () => {
    await useSettingsStore.getState().setMaxChipsVisible(12);

    expect(useSettingsStore.getState().settings.maxChipsVisible).toBe(12);
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.maxChipsVisible).toBe(12);
  });

  it('sets staleThresholdDays and persists to storage', async () => {
    await useSettingsStore.getState().setStaleThresholdDays(7);

    expect(useSettingsStore.getState().settings.staleThresholdDays).toBe(7);
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.staleThresholdDays).toBe(7);
  });

  it('sets language and group sort preference', async () => {
    await useSettingsStore.getState().setLanguage('zh');
    await useSettingsStore.getState().setGroupSortBy('name');

    expect(useSettingsStore.getState().settings.language).toBe('zh');
    expect(useSettingsStore.getState().settings.groupSortBy).toBe('name');
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.language).toBe('zh');
    expect(stored.groupSortBy).toBe('name');
  });

  it('updates and resets key bindings', async () => {
    await useSettingsStore.getState().updateKeyBinding('focusSearch', 'Meta+K');
    expect(useSettingsStore.getState().settings.keyBindings.focusSearch).toBe('Meta+K');

    await useSettingsStore.getState().resetKeyBindings();
    expect(useSettingsStore.getState().settings.keyBindings.focusSearch).toBe('/');
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.keyBindings.focusSearch).toBe('/');
  });

  it.each([
    ['toggleSound', () => useSettingsStore.getState().toggleSound()],
    ['toggleConfetti', () => useSettingsStore.getState().toggleConfetti()],
    ['setMaxChipsVisible', () => useSettingsStore.getState().setMaxChipsVisible(16)],
    ['setStaleThresholdDays', () => useSettingsStore.getState().setStaleThresholdDays(14)],
    ['setLanguage', () => useSettingsStore.getState().setLanguage('en')],
    ['setGroupSortBy', () => useSettingsStore.getState().setGroupSortBy('lastAccessed')],
    ['updateKeyBinding', () => useSettingsStore.getState().updateKeyBinding('clearFilter', 'Escape')],
    ['resetKeyBindings', () => useSettingsStore.getState().resetKeyBindings()],
  ])('rolls back state if %s storage write fails', async (_name, act) => {
    const previous = useSettingsStore.getState().settings;
    chromeStorage.set.mockRejectedValueOnce(new Error('Storage failure'));

    await expect(act()).rejects.toThrow('Storage failure');

    expect(useSettingsStore.getState().settings).toEqual(previous);
  });
});
