import { useEffect, useRef } from 'react';

type StorageChanges = Record<string, chrome.storage.StorageChange>;

const SETTINGS_KEYS = new Set(['settings', 'schemaVersion']);
const ORGANIZER_KEYS = new Set([
  'settings',
  'schemaVersion',
  'groupOrder',
  'sections',
  'sectionAssignments',
  'unsortedOverrides',
  'viewMode',
  'manualGroups',
  'groupAssignments',
  'deferred',
  'workspaces',
]);
const HISTORY_KEYS = new Set([
  'schemaVersion',
  'historyCandidate',
  'history',
  'recoveryCandidate',
  'recoveryHistory',
]);

interface ChromeStorageSyncOptions {
  fetchSettings: () => Promise<void>;
  fetchTabs: () => Promise<void>;
  fetchHistory: () => Promise<void>;
}

function hasChangedKey(changes: StorageChanges, keys: Set<string>): boolean {
  return Object.keys(changes).some((key) => keys.has(key));
}

export function useChromeStorageSync({
  fetchSettings,
  fetchTabs,
  fetchHistory,
}: ChromeStorageSyncOptions): void {
  const callbacksRef = useRef({ fetchSettings, fetchTabs, fetchHistory });

  useEffect(() => {
    callbacksRef.current = { fetchSettings, fetchTabs, fetchHistory };
  });

  useEffect(() => {
    const onChanged = chrome.storage?.onChanged;
    if (!onChanged) return undefined;

    const listener = (changes: StorageChanges, areaName: string): void => {
      if (areaName !== 'local') return;

      const callbacks = callbacksRef.current;
      if (hasChangedKey(changes, SETTINGS_KEYS)) {
        void callbacks.fetchSettings();
      }
      if (hasChangedKey(changes, ORGANIZER_KEYS)) {
        void callbacks.fetchTabs();
      }
      if (hasChangedKey(changes, HISTORY_KEYS)) {
        void callbacks.fetchHistory();
      }
    };

    onChanged.addListener(listener);
    return () => {
      onChanged.removeListener(listener);
    };
  }, []);
}
