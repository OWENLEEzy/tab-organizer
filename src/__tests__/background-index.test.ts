import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listeners = {
  onInstalled: vi.fn(),
  onStartup: vi.fn(),
  onCreated: vi.fn(),
  onRemoved: vi.fn(),
  onUpdated: vi.fn(),
  onClicked: vi.fn(),
  onCommand: vi.fn(),
};

const chromeMock = {
  runtime: {
    getURL: vi.fn((path = '') => `chrome-extension://fake-id/${path}`),
    onInstalled: { addListener: listeners.onInstalled },
    onStartup: { addListener: listeners.onStartup },
  },
  tabs: {
    query: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    sendMessage: vi.fn(),
    onCreated: { addListener: listeners.onCreated },
    onRemoved: { addListener: listeners.onRemoved },
    onUpdated: { addListener: listeners.onUpdated },
  },
  windows: {
    getCurrent: vi.fn(),
    update: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    onClicked: { addListener: listeners.onClicked },
  },
  commands: {
    onCommand: { addListener: listeners.onCommand },
  },
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    },
  },
};

describe('background service worker entry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal('chrome', chromeMock);
    chromeMock.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://example.com', title: 'Example', windowId: 1, active: true },
      { id: 2, url: 'chrome://extensions', title: 'Extensions', windowId: 1, active: false },
    ]);
    chromeMock.windows.getCurrent.mockResolvedValue({ id: 1 });
    chromeMock.tabs.update.mockResolvedValue({});
    chromeMock.windows.update.mockResolvedValue({});
    chromeMock.tabs.create.mockResolvedValue({});
    chromeMock.tabs.sendMessage.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers lifecycle listeners and refreshes badge on install', async () => {
    await import('../background/index');
    await listeners.onInstalled.mock.calls[0][0]();

    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
    expect(chromeMock.storage.local.set).toHaveBeenCalled();
  });

  it('refreshes history and badge on startup, tab creation, and tab removal', async () => {
    await import('../background/index');

    await listeners.onStartup.mock.calls[0][0]();
    listeners.onCreated.mock.calls[0][0]();
    await vi.advanceTimersByTimeAsync(1500);
    await listeners.onRemoved.mock.calls[0][0]();

    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
    expect(chromeMock.storage.local.set).toHaveBeenCalled();
  });

  it('captures tabs with missing optional Chrome fields without failing', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      { url: 'https://example.com' },
      { id: 2, title: 'Missing URL' },
    ]);

    await import('../background/index');
    await listeners.onInstalled.mock.calls[0][0]();

    expect(chromeMock.storage.local.set).toHaveBeenCalled();
  });

  it('focuses an existing dashboard tab from the toolbar action', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      { id: 10, url: 'chrome-extension://fake-id/src/newtab/index.html', windowId: 1 },
    ]);

    await import('../background/index');
    listeners.onClicked.mock.calls[0][0]();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(chromeMock.tabs.update).toHaveBeenCalledWith(10, { active: true });
    expect(chromeMock.windows.update).toHaveBeenCalledWith(1, { focused: true });
  });

  it('falls back to the first dashboard tab when none is in the current window', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      { id: 10, url: 'chrome-extension://fake-id/src/newtab/index.html', windowId: 2 },
    ]);
    chromeMock.windows.getCurrent.mockResolvedValue({ id: 1 });

    await import('../background/index');
    listeners.onClicked.mock.calls[0][0]();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(chromeMock.tabs.update).toHaveBeenCalledWith(10, { active: true });
    expect(chromeMock.windows.update).toHaveBeenCalledWith(2, { focused: true });
  });

  it('opens a focus URL when the command is invoked', async () => {
    chromeMock.tabs.query.mockResolvedValue([]);

    await import('../background/index');
    listeners.onCommand.mock.calls[0][0]('open-space-switcher');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(chromeMock.tabs.create).toHaveBeenCalledWith({
      url: expect.stringContaining('#focus-space-switcher'),
    });
  });

  it('ignores unrelated commands and creates a dashboard if the candidate tab has no id', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      { url: 'chrome-extension://fake-id/src/newtab/index.html', windowId: 1 },
    ]);

    await import('../background/index');
    listeners.onCommand.mock.calls[0][0]('not-tab-organizer');
    await Promise.resolve();
    expect(chromeMock.tabs.create).not.toHaveBeenCalled();

    listeners.onClicked.mock.calls[0][0]();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(chromeMock.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://fake-id/src/newtab/index.html',
    });
  });

  it('falls back to create when dashboard query fails and clears badge on badge failure', async () => {
    chromeMock.tabs.query.mockRejectedValue(new Error('query failed'));

    await import('../background/index');
    listeners.onClicked.mock.calls[0][0]();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(chromeMock.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://fake-id/src/newtab/index.html',
    });
    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });

  it('retries focusing the space switcher after command focus', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      { id: 10, url: 'chrome-extension://fake-id/src/newtab/index.html', windowId: 1 },
    ]);
    chromeMock.tabs.sendMessage
      .mockRejectedValueOnce(new Error('not ready'))
      .mockResolvedValueOnce({});

    await import('../background/index');
    listeners.onCommand.mock.calls[0][0]('open-space-switcher');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(chromeMock.tabs.sendMessage).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);

    expect(chromeMock.tabs.sendMessage).toHaveBeenCalledTimes(2);
    expect(chromeMock.tabs.sendMessage).toHaveBeenLastCalledWith(10, {
      type: 'FOCUS_SPACE_SWITCHER',
    });
  });

  it('stops retrying space switcher focus after repeated send failures', async () => {
    chromeMock.tabs.query.mockResolvedValue([
      { id: 10, url: 'chrome-extension://fake-id/src/newtab/index.html', windowId: 1 },
    ]);
    chromeMock.tabs.sendMessage.mockRejectedValue(new Error('not ready'));

    await import('../background/index');
    listeners.onCommand.mock.calls[0][0]('open-space-switcher');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(800);

    expect(chromeMock.tabs.sendMessage).toHaveBeenCalledTimes(8);
  });

  it('debounces tab update badge refreshes', async () => {
    await import('../background/index');
    listeners.onUpdated.mock.calls[0][0]();
    listeners.onUpdated.mock.calls[0][0]();
    vi.advanceTimersByTime(300);
    await Promise.resolve();

    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
  });
});
