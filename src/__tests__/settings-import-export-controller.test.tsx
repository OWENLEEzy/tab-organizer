import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { SettingsStore } from '../stores/settings-store';
import type { TabStore } from '../stores/tab-store';
import { I18nProvider } from '../newtab/providers/I18nProvider';
import { useSettingsImportExport } from '../newtab/controllers/useSettingsImportExport';

function wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

function makeStores() {
  const settingsStore = {
    settings: {
      theme: 'clay',
      language: 'system',
      soundEnabled: true,
      confettiEnabled: true,
      maxChipsVisible: 8,
      staleThresholdDays: 3,
      customGroups: [{ groupKey: 'old', groupLabel: 'Old', hostname: 'old.test' }],
      landingPagePatterns: [],
      keyBindings: {
        switchSectionN: 'Meta+{n}',
        switchSectionAll: 'Meta+0',
        cyclePrev: 'ArrowLeft',
        cycleNext: 'ArrowRight',
        focusSearch: '/',
        clearFilter: 'Escape',
      },
      groupSortBy: 'count',
    },
    setTheme: vi.fn(async () => {}),
    toggleSound: vi.fn(async () => {}),
    toggleConfetti: vi.fn(async () => {}),
    setMaxChipsVisible: vi.fn(async () => {}),
    setStaleThresholdDays: vi.fn(async () => {}),
    setGroupSortBy: vi.fn(async () => {}),
    removeCustomGroup: vi.fn(async () => {}),
    addCustomGroup: vi.fn(async () => {}),
    updateKeyBinding: vi.fn(async () => {}),
  } as unknown as SettingsStore;

  const tabStore = {
    sections: [{ id: 'work', name: 'Work', order: 0 }],
    sectionAssignments: [{ productKey: 'github', sectionId: 'work', order: 0 }],
    unsortedOverrides: [],
    importBackup: vi.fn(async () => {}),
  } as unknown as TabStore;

  return { settingsStore, tabStore };
}

describe('useSettingsImportExport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports the current local settings and organizer state', () => {
    const { settingsStore, tabStore } = makeStores();
    const click = vi.fn();
    const realCreateElement = document.createElement.bind(document);
    const anchor = realCreateElement('a');
    vi.spyOn(anchor, 'click').mockImplementation(click);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      if (tagName === 'a') return anchor;
      return realCreateElement(tagName, options);
    });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const showToast = vi.fn();

    const { result } = renderHook(
      () => useSettingsImportExport({ settingsStore, tabStore, showToast }),
      { wrapper },
    );

    result.current.handleExportConfig();

    expect(createElement).toHaveBeenCalledWith('a');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Settings exported'));
  });

  it('imports settings and organizer state through store actions', async () => {
    const { settingsStore, tabStore } = makeStores();
    const showToast = vi.fn();
    const { result } = renderHook(
      () => useSettingsImportExport({ settingsStore, tabStore, showToast }),
      { wrapper },
    );

    await result.current.handleImportConfig(JSON.stringify({
      version: '1.0',
      settings: {
        theme: 'sage',
        soundEnabled: false,
        maxChipsVisible: 12,
        customGroups: [{ groupKey: 'new', groupLabel: 'New', hostname: 'new.test' }],
      },
      sections: [{ id: 'later', name: 'Later', order: 0 }],
      sectionAssignments: [{ productKey: 'github', sectionId: 'later', order: 0 }],
      unsortedOverrides: ['youtube'],
    }));

    await waitFor(() => expect(settingsStore.setTheme).toHaveBeenCalledWith('sage'));
    expect(settingsStore.toggleSound).toHaveBeenCalledTimes(1);
    expect(settingsStore.setMaxChipsVisible).toHaveBeenCalledWith(12);
    expect(settingsStore.removeCustomGroup).toHaveBeenCalledWith('old');
    expect(settingsStore.addCustomGroup).toHaveBeenCalledWith({ groupKey: 'new', groupLabel: 'New', hostname: 'new.test' });
    expect(tabStore.importBackup).toHaveBeenCalledWith(
      [{ id: 'later', name: 'Later', order: 0 }],
      [{ productKey: 'github', sectionId: 'later', order: 0 }],
      ['youtube'],
    );
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Settings imported'));
  });

  it('imports legacy manual group backups into section state', async () => {
    const { settingsStore, tabStore } = makeStores();
    const showToast = vi.fn();
    const { result } = renderHook(
      () => useSettingsImportExport({ settingsStore, tabStore, showToast }),
      { wrapper },
    );

    await result.current.handleImportConfig(JSON.stringify({
      version: '1.0',
      manualGroups: [{ id: 'legacy-later', name: 'Later', order: 0 }],
      groupAssignments: [{ productKey: 'github', groupId: 'legacy-later', order: 0 }],
    }));

    expect(tabStore.importBackup).toHaveBeenCalledWith(
      [{ id: 'legacy-later', name: 'Later', order: 0, emoji: undefined, autoRules: undefined }],
      [{ productKey: 'github', sectionId: 'legacy-later', order: 0 }],
      [],
    );
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Settings imported'));
  });
});
