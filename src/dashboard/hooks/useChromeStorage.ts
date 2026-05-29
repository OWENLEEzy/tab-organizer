import { useEffect, useRef } from 'react';

/**
 * Listen for chrome.storage.onChanged events and call a callback.
 * Used to sync state across extension pages (e.g., multiple new tab pages).
 *
 * Uses ref to avoid stale closure issues — the listener is registered once
 * and always calls the latest callback without re-subscribing.
 */
export function useChromeStorage(
  onChange: (changes: {
    [key: string]: chrome.storage.StorageChange;
  }) => void
): void {
  const callbackRef = useRef(onChange);
  useEffect(() => {
    callbackRef.current = onChange;
  });

  useEffect(() => {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local') {
        callbackRef.current(changes);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);
}
