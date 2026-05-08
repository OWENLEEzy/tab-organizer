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
      theme: 'dark' as const,
      soundEnabled: false,
    };
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
    await useSettingsStore.getState().setTheme('dark');

    expect(useSettingsStore.getState().settings.theme).toBe('dark');
    const stored = chromeStorage.data['settings'] as AppSettings;
    expect(stored.theme).toBe('dark');
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

  it('rolls back state if storage write fails', async () => {
    chromeStorage.set.mockRejectedValueOnce(new Error('Storage failure'));
    const initialTheme = useSettingsStore.getState().settings.theme;

    await useSettingsStore.getState().setTheme('dark');

    // Should have updated then rolled back
    expect(useSettingsStore.getState().settings.theme).toBe(initialTheme);
  });
});
