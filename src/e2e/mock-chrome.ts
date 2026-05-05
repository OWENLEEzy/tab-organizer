/**
 * Complete Chrome API mock for E2E testing
 * This file is loaded via addInitScript in Playwright tests
 */

export type E2EScenario = 'default' | 'duplicates' | 'empty' | 'many-tabs';

export const mockChromeApi = (scenario: E2EScenario = 'default') => {
  const storageKey = '__tab_out_e2e_storage__';
  const readStorageData = (): Record<string, unknown> => {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as Record<string, unknown>;
    } catch {
      return {};
    }
  };
  const writeStorageData = (data: Record<string, unknown>): void => {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  };
  const createEvent = () => ({
    addListener: () => {},
    removeListener: () => {},
    hasListener: () => false,
    hasListeners: () => false,
  });

  // Mock tabs data for E2E testing
  const mockTabs: chrome.tabs.Tab[] = [
    { id: 1, url: 'https://github.com/explore', title: 'Explore · GitHub', favIconUrl: 'https://github.githubassets.com/favicons/favicon.png', windowId: 1, active: true, index: 0, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 2, url: 'https://github.com/trending', title: 'Trending · GitHub', favIconUrl: 'https://github.githubassets.com/favicons/favicon.png', windowId: 1, active: false, index: 1, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 3, url: 'https://github.com/notifications', title: 'Notifications · GitHub', favIconUrl: 'https://github.githubassets.com/favicons/favicon.png', windowId: 1, active: false, index: 2, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 4, url: 'https://www.youtube.com/watch?v=test1', title: 'Test Video 1 - YouTube', favIconUrl: 'https://www.youtube.com/favicon.ico', windowId: 1, active: false, index: 3, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 5, url: 'https://www.youtube.com/watch?v=test2', title: 'Test Video 2 - YouTube', favIconUrl: 'https://www.youtube.com/favicon.ico', windowId: 1, active: false, index: 4, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 6, url: 'https://docs.google.com/document/d/1', title: 'Test Doc 1 - Google Docs', favIconUrl: 'https://docs.google.com/favicon.ico', windowId: 1, active: false, index: 5, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 7, url: 'https://docs.google.com/document/d/2', title: 'Test Doc 2 - Google Docs', favIconUrl: 'https://docs.google.com/favicon.ico', windowId: 1, active: false, index: 6, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 8, url: 'https://www.reddit.com/r/programming', title: 'r/programming - Reddit', favIconUrl: 'https://www.reddit.com/favicon.ico', windowId: 1, active: false, index: 7, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 9, url: 'https://www.reddit.com/r/webdev', title: 'r/webdev - Reddit', favIconUrl: 'https://www.reddit.com/favicon.ico', windowId: 1, active: false, index: 8, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
    { id: 10, url: 'https://stackoverflow.com/questions/123', title: 'Test Question - Stack Overflow', favIconUrl: 'https://stackoverflow.com/favicon.ico', windowId: 1, active: false, index: 9, pinned: false, highlighted: false, incognito: false, selected: false, status: 'complete', frozen: false, discarded: false, autoDiscardable: true, groupId: -1 },
  ];

  const scenarioTabs = scenario === 'empty' ? [] : mockTabs;

  const chromeMock = {
    tabs: {
      query: () => Promise.resolve(scenarioTabs),
      remove: () => Promise.resolve(),
      update: () => Promise.resolve(),
      create: () => Promise.resolve(),
      get: () => Promise.resolve(scenarioTabs[0]),
      getCurrent: () => Promise.resolve({ id: 1, url: 'chrome://newtab', windowId: 1, active: true }),
      onActivated: createEvent(),
      onAttached: createEvent(),
      onCreated: createEvent(),
      onDetached: createEvent(),
      onMoved: createEvent(),
      onRemoved: createEvent(),
      onReplaced: createEvent(),
      onUpdated: createEvent(),
      onZoomChange: createEvent(),
    },
    storage: {
      local: {
        get: (keys?: string[] | string | null) => {
          const storageData = readStorageData();
          if (keys == null) return Promise.resolve({ ...storageData });
          const result: Record<string, unknown> = {};
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            if (key in storageData) result[key] = storageData[key];
          }
          return Promise.resolve(result);
        },
        set: (items: Record<string, unknown>) => {
          const storageData = readStorageData();
          Object.assign(storageData, items);
          writeStorageData(storageData);
          return Promise.resolve();
        },
        remove: (keys: string[] | string) => {
          const storageData = readStorageData();
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete storageData[key];
          }
          writeStorageData(storageData);
          return Promise.resolve();
        },
        clear: () => {
          writeStorageData({});
          return Promise.resolve();
        },
        getBytesInUse: () => Promise.resolve(0),
        onChanged: createEvent(),
      },
      session: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        clear: () => Promise.resolve(),
        onChanged: createEvent(),
      },
      sync: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        clear: () => Promise.resolve(),
        onChanged: createEvent(),
      },
      onChanged: createEvent(),
    },
    runtime: {
      getURL: (path: string) => `chrome-extension://test-extension-id/${path || ''}`,
      getManifest: () => ({ version: '1.0.0' }),
      id: 'test-extension-id',
      onMessage: createEvent(),
      onConnect: createEvent(),
      onInstalled: createEvent(),
      onSuspend: createEvent(),
      onSuspendCanceled: createEvent(),
      onStartup: createEvent(),
      onRestartRequired: createEvent(),
      onUpdateAvailable: createEvent(),
      onBrowserUpdateAvailable: createEvent(),
      onConnectExternal: createEvent(),
      onMessageExternal: createEvent(),
      sendMessage: () => Promise.resolve(),
      connect: () => ({}),
      connectNative: () => ({}),
      getPlatformInfo: () => Promise.resolve({ os: 'mac', arch: 'x86-64', nacl_arch: 'x86-64' }),
      getPackageDirectoryEntry: () => Promise.resolve({}),
      requestUpdateCheck: () => Promise.resolve({ status: 'no_update' }),
      restart: () => {},
      restartAfterDelay: () => {},
    },
    windows: {
      get: () => Promise.resolve({ id: 1, focused: true }),
      getCurrent: () => Promise.resolve({ id: 1, focused: true }),
      getAll: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      remove: () => Promise.resolve({}),
      onCreated: createEvent(),
      onRemoved: createEvent(),
      onFocusChanged: createEvent(),
    },
    commands: {
      getAll: () => Promise.resolve([]),
      onCommand: createEvent(),
    },
  };

  Object.defineProperty(window, 'chrome', {
    configurable: true,
    value: chromeMock,
  });
};

// Auto-mock for non-test environments
if (typeof window !== 'undefined' && !('chrome' in window)) {
  mockChromeApi();
}
