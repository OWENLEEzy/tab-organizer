import { useEffect, useRef } from 'react';

type StorageChanges = Record<string, chrome.storage.StorageChange>;

const SETTINGS_KEYS = new Set(['settings', 'schemaVersion']);
const ORGANIZER_KEYS = new Set([
  'settings',
  'schemaVersion',
  'groupOrder',
  'sections',
  'sectionAssignments',
  'unsectionedProductKeys',
  'viewMode',
]);
const HISTORY_KEYS = new Set([
  'schemaVersion',
  'recoveryCandidate',
  'recoverySnapshots',
]);

interface ChromeStorageSyncOptions {
  fetchSettings: () => Promise<void>;
  fetchTabs: () => Promise<void>;
  fetchRecovery: () => Promise<void>;
}

function hasChangedKey(changes: StorageChanges, keys: Set<string>): boolean {
  return Object.keys(changes).some((key) => keys.has(key));
}

export function useChromeStorageSync({
  fetchSettings,
  fetchTabs,
  fetchRecovery,
}: ChromeStorageSyncOptions): void {
  const callbacksRef = useRef({ fetchSettings, fetchTabs, fetchRecovery });

  useEffect(() => {
    callbacksRef.current = { fetchSettings, fetchTabs, fetchRecovery };
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
        void callbacks.fetchRecovery();
      }
    };

    onChanged.addListener(listener);
    return () => {
      onChanged.removeListener(listener);
    };
  }, []);
}
