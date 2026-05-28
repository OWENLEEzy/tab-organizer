import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useChromeStorageSync } from '../newtab/controllers/useChromeStorageSync';

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

function Harness({
  fetchSettings,
  fetchTabs,
  fetchHistory,
}: {
  fetchSettings: () => Promise<void>;
  fetchTabs: () => Promise<void>;
  fetchHistory: () => Promise<void>;
}): null {
  useChromeStorageSync({ fetchSettings, fetchTabs, fetchHistory });
  return null;
}

describe('useChromeStorageSync', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refreshes settings, tabs, and history from relevant local storage changes', async () => {
    const listeners: StorageListener[] = [];
    const addListener = vi.fn((nextListener: StorageListener) => {
      listeners.push(nextListener);
    });
    const removeListener = vi.fn();
    const fetchSettings = vi.fn(async () => {});
    const fetchTabs = vi.fn(async () => {});
    const fetchHistory = vi.fn(async () => {});

    vi.stubGlobal('chrome', {
      storage: {
        onChanged: {
          addListener,
          removeListener,
        },
      },
    });

    const { unmount } = render(
      <Harness
        fetchSettings={fetchSettings}
        fetchTabs={fetchTabs}
        fetchHistory={fetchHistory}
      />,
    );

    expect(addListener).toHaveBeenCalledTimes(1);
    const listener = listeners[0];
    expect(listener).not.toBeNull();

    listener(
      {
        settings: { oldValue: {}, newValue: { maxChipsVisible: 12 } },
        sections: { oldValue: [], newValue: [{ id: 'work', name: 'Work', order: 0 }] },
        history: { oldValue: [], newValue: [{ id: 'snapshot-1' }] },
      },
      'local',
    );

    await waitFor(() => expect(fetchSettings).toHaveBeenCalledTimes(1));
    expect(fetchTabs).toHaveBeenCalledTimes(1);
    expect(fetchHistory).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeListener).toHaveBeenCalledWith(listener);
  });

  it('ignores non-local and unrelated storage changes', async () => {
    const listeners: StorageListener[] = [];
    const fetchSettings = vi.fn(async () => {});
    const fetchTabs = vi.fn(async () => {});
    const fetchHistory = vi.fn(async () => {});

    vi.stubGlobal('chrome', {
      storage: {
        onChanged: {
          addListener: vi.fn((nextListener: StorageListener) => {
            listeners.push(nextListener);
          }),
          removeListener: vi.fn(),
        },
      },
    });

    render(
      <Harness
        fetchSettings={fetchSettings}
        fetchTabs={fetchTabs}
        fetchHistory={fetchHistory}
      />,
    );

    const listener = listeners[0];
    listener({ unrelated: { oldValue: 1, newValue: 2 } }, 'local');
    listener({ settings: { oldValue: {}, newValue: {} } }, 'sync');

    await Promise.resolve();
    expect(fetchSettings).not.toHaveBeenCalled();
    expect(fetchTabs).not.toHaveBeenCalled();
    expect(fetchHistory).not.toHaveBeenCalled();
  });
});
