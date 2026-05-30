/**
 * Chrome tabs/windows adapter.
 *
 * Wraps chrome.tabs and chrome.windows API calls so stores and components never
 * reference the raw chrome namespace directly.
 */

export async function queryAllTabs(): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query({});
}

export async function queryTabs(
  queryInfo: chrome.tabs.QueryInfo,
): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query(queryInfo);
}

export async function getCurrentWindow(): Promise<chrome.windows.Window> {
  return chrome.windows.getCurrent();
}

export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  return chrome.tabs.getCurrent();
}

export async function closeTabIds(
  tabIds: number | number[],
): Promise<void> {
  if (Array.isArray(tabIds)) {
    await chrome.tabs.remove(tabIds);
    return;
  }

  await chrome.tabs.remove(tabIds);
}

export async function focusChromeTab(
  tabId: number,
  windowId: number,
): Promise<void> {
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(windowId, { focused: true });
}

export async function createChromeTab(url: string): Promise<void> {
  await chrome.tabs.create({ url, active: false });
}

export async function moveChromeTab(
  tabId: number,
  index: number,
): Promise<void> {
  await chrome.tabs.move(tabId, { index });
}

/**
 * Subscribe to chrome.tabs lifecycle events. Calls `onChange` whenever a tab
 * is created, removed, moved, or has its URL/title/favIcon/status updated.
 * Returns an unsubscribe function that removes all listeners.
 */
export function subscribeToTabEvents(onChange: () => void): () => void {
  const onCreated = (): void => onChange();
  const onRemoved = (): void => onChange();
  const onMoved = (): void => onChange();
  const onUpdated = (_tabId: number, info: chrome.tabs.OnUpdatedInfo): void => {
    if (info.url || info.title || info.favIconUrl || info.status === 'complete') {
      onChange();
    }
  };

  chrome.tabs.onCreated.addListener(onCreated);
  chrome.tabs.onRemoved.addListener(onRemoved);
  chrome.tabs.onMoved.addListener(onMoved);
  chrome.tabs.onUpdated.addListener(onUpdated);

  return () => {
    chrome.tabs.onCreated.removeListener(onCreated);
    chrome.tabs.onRemoved.removeListener(onRemoved);
    chrome.tabs.onMoved.removeListener(onMoved);
    chrome.tabs.onUpdated.removeListener(onUpdated);
  };
}
