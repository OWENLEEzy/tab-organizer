import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';

let onUpdatedListener: ((tabId: number, info: chrome.tabs.OnUpdatedInfo) => void) | null = null;

function listenerMock<T extends (...args: never[]) => void>() {
  return {
    addListener: vi.fn((listener: T) => {
      onUpdatedListener = listener as unknown as typeof onUpdatedListener;
    }),
    removeListener: vi.fn(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  onUpdatedListener = null;

  vi.stubGlobal('chrome', {
    tabs: {
      onCreated: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      onRemoved: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      onMoved: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      onUpdated: listenerMock<(tabId: number, info: chrome.tabs.OnUpdatedInfo) => void>(),
    },
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('tab store listeners', () => {
  it('refreshes tabs when Chrome reports a favicon URL update', () => {
    const fetchTabs = vi.fn(() => Promise.resolve());
    useTabStore.setState({ fetchTabs });

    const stopListeners = useTabStore.getState().startListeners();

    onUpdatedListener?.(1, { favIconUrl: 'https://www.youtube.com/favicon.ico' });
    expect(fetchTabs).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fetchTabs).toHaveBeenCalledTimes(1);

    stopListeners();
  });

  it('skips one debounced refresh after a programmatic close, then resumes', () => {
    const fetchTabs = vi.fn(() => Promise.resolve());
    useTabStore.setState({ fetchTabs, suppressListenerRefresh: true });

    const stopListeners = useTabStore.getState().startListeners();

    // First event after a close is suppressed (the close already refreshed).
    onUpdatedListener?.(1, { favIconUrl: 'https://www.youtube.com/favicon.ico' });
    vi.advanceTimersByTime(300);
    expect(fetchTabs).not.toHaveBeenCalled();
    expect(useTabStore.getState().suppressListenerRefresh).toBe(false);

    // The very next event refreshes normally again.
    onUpdatedListener?.(1, { favIconUrl: 'https://www.youtube.com/favicon.ico' });
    vi.advanceTimersByTime(300);
    expect(fetchTabs).toHaveBeenCalledTimes(1);

    stopListeners();
  });
});
